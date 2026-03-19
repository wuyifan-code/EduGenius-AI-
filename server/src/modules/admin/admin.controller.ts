import { Controller, Get, Patch, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ============ Dashboard ============

  @Get('dashboard')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('revenue')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get revenue statistics' })
  async getRevenue(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const end = endDate || new Date().toISOString();
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    return this.adminService.getRevenueStats(start, end);
  }

  // ============ User Management ============

  @Get('users')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all users with pagination' })
  async getUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.adminService.getUsers(page, limit, search, role);
  }

  @Get('users/:userId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUser(@Param('userId') userId: string) {
    return this.adminService.getUserById(userId);
  }

  @Patch('users/:userId/role')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update user role' })
  async updateUserRole(
    @Param('userId') userId: string,
    @Body() body: { role: string },
  ) {
    return this.adminService.updateUserRole(userId, body.role);
  }

  @Patch('users/:userId/disable')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Disable user' })
  async disableUser(@Param('userId') userId: string) {
    return this.adminService.disableUser(userId);
  }

  @Patch('users/:userId/enable')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Enable user' })
  async enableUser(@Param('userId') userId: string) {
    return this.adminService.enableUser(userId);
  }

  // ============ Order Management ============

  @Get('orders')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all orders with pagination' })
  async getOrders(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getOrders(page, limit, status, search);
  }

  @Get('orders/:orderId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get order by ID' })
  async getOrder(@Param('orderId') orderId: string) {
    return this.adminService.getOrderById(orderId);
  }

  @Patch('orders/:orderId/status')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update order status' })
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() body: { status: string },
  ) {
    return this.adminService.updateOrderStatus(orderId, body.status);
  }

  @Post('orders/:orderId/assign')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Assign escort to order' })
  async assignEscort(
    @Param('orderId') orderId: string,
    @Body() body: { escortId: string },
  ) {
    return this.adminService.assignEscort(orderId, body.escortId);
  }

  // ============ Escort Management ============

  @Get('escorts')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all escorts with pagination' })
  async getEscorts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getEscorts(page, limit, status, search);
  }

  @Patch('escorts/:escortId/verify')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Verify or reject escort' })
  async verifyEscort(
    @Param('escortId') escortId: string,
    @Body() body: { approved: boolean; reason?: string },
  ) {
    return this.adminService.verifyEscort(escortId, body.approved, body.reason);
  }
}
