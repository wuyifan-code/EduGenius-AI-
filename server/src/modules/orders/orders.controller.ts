import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto } from './dto/orders.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  async create(@Request() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get my orders' })
  async findMyOrders(@Request() req: any) {
    const userRole = req.user.role;
    if (userRole === 'ESCORT') {
      return this.ordersService.findByEscort(req.user.sub);
    }
    return this.ordersService.findByPatient(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  async findById(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.findById(id, req.user.sub, req.user.role);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept an order (for escorts)' })
  async acceptOrder(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.acceptOrder(id, req.user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order status' })
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.ordersService.updateStatus(id, req.user.sub, dto.status as any);
  }
}
