import { Controller, Get, Patch, Delete, Param, Query, UseGuards, Request, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications for current user' })
  async getNotifications(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('unreadOnly') unreadOnly?: boolean,
    @Query('type') type?: string,
  ) {
    return this.notificationsService.getByUser(
      req.user.sub,
      page,
      limit,
      unreadOnly === true,
      type,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@Request() req: any) {
    const count = await this.notificationsService.getUnreadCount(req.user.sub);
    return { success: true, data: { count } };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics' })
  async getStats(@Request() req: any) {
    const stats = await this.notificationsService.getStats(req.user.sub);
    return { success: true, data: stats };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Request() req: any, @Param('id') id: string) {
    const result = await this.notificationsService.markAsRead(id, req.user.sub);
    return { success: !!result, data: result };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Request() req: any) {
    const result = await this.notificationsService.markAllAsRead(req.user.sub);
    return { success: true, data: { updatedCount: result.count } };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  async delete(@Request() req: any, @Param('id') id: string) {
    const result = await this.notificationsService.delete(id, req.user.sub);
    return { success: !!result, data: result };
  }

  @Delete('batch')
  @ApiOperation({ summary: 'Delete multiple notifications' })
  async deleteBatch(@Request() req: any, @Body() body: { ids: string[] }) {
    const results = await Promise.all(
      body.ids.map(id => this.notificationsService.delete(id, req.user.sub))
    );
    return { success: true, data: { deletedCount: results.filter(r => r).length } };
  }
}
