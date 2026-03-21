import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger, UseGuards } from '@nestjs/common';
import { MessagesService } from '../messages.service';
import { MessageType } from '@prisma/client';

interface JoinRoomPayload {
  orderId?: string;
  userId: string;
}

interface SendMessagePayload {
  orderId?: string;
  receiverId: string;
  content: string;
  type?: MessageType;
  imageUrl?: string;
}

interface TypingPayload {
  receiverId: string;
  isTyping: boolean;
}

interface MarkReadPayload {
  messageIds: string[];
  senderId: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');
  private connectedUsers = new Map<string, string>(); // socketId -> userId
  private userSockets = new Map<string, string[]>(); // userId -> socketIds[]

  constructor(
    private jwtService: JwtService,
    private messagesService: MessagesService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from auth or query
      const token = client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token.toString());
      const userId = payload.sub;

      // Store user connection
      this.connectedUsers.set(client.id, userId);

      // Track user's sockets
      const userSocketList = this.userSockets.get(userId) || [];
      userSocketList.push(client.id);
      this.userSockets.set(userId, userSocketList);

      // Join user's personal room for direct messages
      client.join(`user:${userId}`);

      this.logger.log(`User ${userId} connected with socket ${client.id}`);

      // Send unread count to user
      const unreadCount = await this.messagesService.getUnreadCount(userId);
      client.emit('unread:count', { count: unreadCount });

      // Notify others that user is online
      this.server.emit('user:online', { userId });
    } catch (error) {
      this.logger.warn(`Invalid token from client ${client.id}: ${error.message}`);
      client.emit('error', { message: 'Invalid token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      // Remove from connected users
      this.connectedUsers.delete(client.id);

      // Remove from user's socket list
      const userSocketList = this.userSockets.get(userId) || [];
      const updatedSockets = userSocketList.filter(id => id !== client.id);
      if (updatedSockets.length === 0) {
        this.userSockets.delete(userId);
        // Notify others that user is offline
        this.server.emit('user:offline', { userId });
        this.logger.log(`User ${userId} disconnected (all sockets)`);
      } else {
        this.userSockets.set(userId, updatedSockets);
        this.logger.log(`User ${userId} disconnected socket ${client.id}`);
      }
    }
  }

  @SubscribeMessage('join:room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload,
  ) {
    const { orderId, userId } = payload;
    const socketUserId = this.connectedUsers.get(client.id);

    if (socketUserId !== userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    // Join order room for order-related chat
    if (orderId) {
      client.join(`order:${orderId}`);
      this.logger.log(`User ${userId} joined order room ${orderId}`);
    }

    return { success: true, room: orderId };
  }

  @SubscribeMessage('leave:room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { orderId: string },
  ) {
    const { orderId } = payload;
    client.leave(`order:${orderId}`);
    this.logger.log(`Client left room ${orderId}`);
    return { success: true };
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessagePayload,
  ) {
    const senderId = this.connectedUsers.get(client.id);
    if (!senderId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    const { orderId, receiverId, content, type = MessageType.TEXT, imageUrl } = payload;

    try {
      // Save message to database
      const savedMessage = await this.messagesService.send(senderId, {
        receiverId,
        content,
        orderId,
        type,
        imageUrl,
      });

      const messagePayload = {
        id: savedMessage.id,
        senderId: savedMessage.senderId,
        receiverId: savedMessage.receiverId,
        content: savedMessage.content,
        type: savedMessage.type,
        imageUrl: savedMessage.imageUrl,
        orderId: savedMessage.orderId,
        createdAt: savedMessage.createdAt.toISOString(),
        isRead: savedMessage.isRead,
        sender: savedMessage.sender,
      };

      // Send to receiver's personal room
      this.server.to(`user:${receiverId}`).emit('message:received', messagePayload);

      // If there's an order room, also broadcast there
      if (orderId) {
        this.server.to(`order:${orderId}`).emit('message:received', messagePayload);
      }

      // Send confirmation back to sender
      client.emit('message:sent', messagePayload);

      this.logger.log(`Message ${savedMessage.id} sent from ${senderId} to ${receiverId}`);

      return { success: true, message: messagePayload };
    } catch (error) {
      this.logger.error(`Failed to send message: ${error.message}`);
      client.emit('error', { message: 'Failed to send message', details: error.message });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('message:read')
  async handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MarkReadPayload,
  ) {
    const readerId = this.connectedUsers.get(client.id);
    if (!readerId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    const { messageIds, senderId } = payload;

    try {
      // Mark messages as read in database
      for (const messageId of messageIds) {
        await this.messagesService.markAsRead(messageId, readerId);
      }

      // Notify sender that messages were read
      this.server.to(`user:${senderId}`).emit('message:read', {
        messageIds,
        readerId,
        readAt: new Date().toISOString(),
      });

      this.logger.log(`Messages ${messageIds.join(', ')} marked as read by ${readerId}`);

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to mark messages as read: ${error.message}`);
      client.emit('error', { message: 'Failed to mark as read' });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingPayload,
  ) {
    const senderId = this.connectedUsers.get(client.id);
    if (!senderId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    const { receiverId, isTyping } = payload;

    // Send typing indicator to receiver
    this.server.to(`user:${receiverId}`).emit('typing', {
      senderId,
      isTyping,
    });

    return { success: true };
  }

  @SubscribeMessage('conversation:read')
  async handleConversationRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { partnerId: string },
  ) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    const { partnerId } = payload;

    try {
      const result = await this.messagesService.markConversationAsRead(userId, partnerId);

      // Notify partner that messages were read
      this.server.to(`user:${partnerId}`).emit('conversation:read', {
        readerId: userId,
        readAt: new Date().toISOString(),
      });

      this.logger.log(`Conversation with ${partnerId} marked as read by ${userId}`);

      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`Failed to mark conversation as read: ${error.message}`);
      client.emit('error', { message: 'Failed to mark conversation as read' });
      return { success: false, error: error.message };
    }
  }

  // Helper: Send notification to user
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Helper: Broadcast to all connected clients
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Helper: Check if user is online
  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return !!sockets && sockets.length > 0;
  }

  // Get count of connected users
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  // Get list of online user IDs
  getOnlineUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }
}
