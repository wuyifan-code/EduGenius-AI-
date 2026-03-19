import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Reviews')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a review' })
  async create(
    @Request() req: any,
    @Body() body: { orderId: string; targetId: string; rating: number; comment?: string },
  ) {
    return this.reviewsService.create(
      body.orderId,
      req.user.sub,
      body.targetId,
      body.rating,
      body.comment,
    );
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get reviews by order' })
  async getByOrder(@Param('orderId') orderId: string) {
    return this.reviewsService.getByOrder(orderId);
  }

  @Get('target/:targetId')
  @ApiOperation({ summary: 'Get reviews for a user (escort)' })
  async getByTarget(
    @Param('targetId') targetId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewsService.getByTarget(targetId, page, limit);
  }

  @Get('author')
  @ApiOperation({ summary: 'Get reviews by current user' })
  async getByAuthor(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewsService.getByAuthor(req.user.sub, page, limit);
  }

  @Get('can-review/:orderId')
  @ApiOperation({ summary: 'Check if user can review an order' })
  async checkCanReview(
    @Request() req: any,
    @Param('orderId') orderId: string,
  ) {
    return this.reviewsService.checkCanReview(orderId, req.user.sub);
  }
}
