import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService, SendMessageDto } from './messages.service';
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
    const conversations = await this.messagesService.getConversations(req.user.sub);
    return {
      success: true,
      data: conversations,
    };
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Start or get a conversation with a user' })
  async createConversation(
    @Request() req: any,
    @Body() body: { userId: string },
  ) {
    const conversation = await this.messagesService.createOrGetConversation(req.user.sub, body.userId);
    return {
      success: true,
      data: conversation,
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get total unread message count' })
  async getUnreadCount(@Request() req: any) {
    const count = await this.messagesService.getUnreadCount(req.user.sub);
    return {
      success: true,
      data: { count },
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search messages' })
  async searchMessages(
    @Request() req: any,
    @Query('q') query: string,
  ) {
    const messages = await this.messagesService.searchMessages(req.user.sub, query);
    return {
      success: true,
      data: messages,
    };
  }

  @Get(':partnerId')
  @ApiOperation({ summary: 'Get conversation with a user' })
  async getConversation(
    @Request() req: any,
    @Param('partnerId') partnerId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Mark conversation as read when opening
    await this.messagesService.markConversationAsRead(req.user.sub, partnerId);

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;

    const messages = await this.messagesService.findConversation(
      req.user.sub,
      partnerId,
      pageNum,
      limitNum,
    );

    return {
      success: true,
      data: messages,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Send a message' })
  async send(
    @Request() req: any,
    @Body() data: SendMessageDto,
  ) {
    const message = await this.messagesService.send(req.user.sub, data);
    return {
      success: true,
      data: message,
    };
  }

  @Patch(':messageId/read')
  @ApiOperation({ summary: 'Mark a message as read' })
  async markAsRead(
    @Request() req: any,
    @Param('messageId') messageId: string,
  ) {
    await this.messagesService.markAsRead(messageId, req.user.sub);
    return {
      success: true,
      message: 'Message marked as read',
    };
  }

  @Patch('conversations/:partnerId/read')
  @ApiOperation({ summary: 'Mark all messages in conversation as read' })
  async markConversationAsRead(
    @Request() req: any,
    @Param('partnerId') partnerId: string,
  ) {
    const result = await this.messagesService.markConversationAsRead(req.user.sub, partnerId);
    return {
      success: true,
      data: result,
    };
  }

  @Delete(':messageId')
  @ApiOperation({ summary: 'Delete a message' })
  async deleteMessage(
    @Request() req: any,
    @Param('messageId') messageId: string,
  ) {
    await this.messagesService.deleteMessage(messageId, req.user.sub);
    return {
      success: true,
      message: 'Message deleted',
    };
  }
}
