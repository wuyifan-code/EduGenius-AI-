import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations with unread counts' })
  async getConversations(@Request() req: any) {
    return this.messagesService.getConversations(req.user.sub);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get total unread message count' })
  async getUnreadCount(@Request() req: any) {
    const count = await this.messagesService.getUnreadCount(req.user.sub);
    return { unreadCount: count };
  }

  @Get(':partnerId')
  @ApiOperation({ summary: 'Get conversation with a user' })
  async getConversation(
    @Request() req: any,
    @Param('partnerId') partnerId: string,
  ) {
    // Mark conversation as read when opening
    await this.messagesService.markConversationAsRead(req.user.sub, partnerId);
    return this.messagesService.findConversation(req.user.sub, partnerId);
  }

  @Post()
  @ApiOperation({ summary: 'Send a message' })
  async send(
    @Request() req: any,
    @Body() data: { receiverId: string; content: string; orderId?: string },
  ) {
    return this.messagesService.send(req.user.sub, data.receiverId, data.content, data.orderId);
  }

  @Patch(':messageId/read')
  @ApiOperation({ summary: 'Mark a message as read' })
  async markAsRead(
    @Request() req: any,
    @Param('messageId') messageId: string,
  ) {
    return this.messagesService.markAsRead(messageId, req.user.sub);
  }

  @Patch('conversations/:partnerId/read')
  @ApiOperation({ summary: 'Mark all messages in conversation as read' })
  async markConversationAsRead(
    @Request() req: any,
    @Param('partnerId') partnerId: string,
  ) {
    await this.messagesService.markConversationAsRead(req.user.sub, partnerId);
    return { success: true };
  }
}
