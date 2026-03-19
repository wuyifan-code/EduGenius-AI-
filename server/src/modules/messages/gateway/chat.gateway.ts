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
import { Logger } from '@nestjs/common';

interface JoinRoomPayload {
  orderId: string;
  userId: string;
}

interface SendMessagePayload {
  orderId?: string;
  receiverId: string;
  content: string;
}

interface TypingPayload {
  receiverId: string;
  isTyping: boolean;
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

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from query
      const token = client.handshake.auth.token || client.handshake.query.token;

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token.toString());
      const userId = payload.sub;

      // Store user connection
      this.connectedUsers.set(client.id, userId);

      // Join user's personal room for direct messages
      client.join(`user:${userId}`);

      this.logger.log(`User ${userId} connected with socket ${client.id}`);

      // Notify others that user is online
      this.server.emit('user:online', { userId });
    } catch (error) {
      this.logger.warn(`Invalid token from client ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      this.connectedUsers.delete(client.id);
      this.logger.log(`User ${userId} disconnected`);
      this.server.emit('user:offline', { userId });
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
    const { orderId, receiverId, content } = payload;

    const message = {
      id: `msg_${Date.now()}`,
      senderId,
      receiverId,
      orderId,
      content,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    // Send to receiver's personal room
    this.server.to(`user:${receiverId}`).emit('message:received', message);

    // If there's an order room, also broadcast there
    if (orderId) {
      this.server.to(`order:${orderId}`).emit('message:received', message);
    }

    this.logger.log(`Message sent from ${senderId} to ${receiverId}`);

    // Return message with ID for confirmation
    return { success: true, message };
  }

  @SubscribeMessage('message:read')
  handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageIds: string[]; senderId: string },
  ) {
    const { messageIds, senderId } = payload;
    const readerId = this.connectedUsers.get(client.id);

    // Notify sender that messages were read
    this.server.to(`user:${senderId}`).emit('message:read', {
      messageIds,
      readerId,
      readAt: new Date().toISOString(),
    });

    return { success: true };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingPayload,
  ) {
    const senderId = this.connectedUsers.get(client.id);
    const { receiverId, isTyping } = payload;

    // Send typing indicator to receiver
    this.server.to(`user:${receiverId}`).emit('typing', {
      senderId,
      isTyping,
    });

    return { success: true };
  }

  // Helper: Send notification to user
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Helper: Broadcast to all connected clients
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Get count of connected users
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }
}
