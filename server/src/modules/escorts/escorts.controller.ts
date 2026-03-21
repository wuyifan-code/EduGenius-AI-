import { Controller, Get, Post, Query, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { EscortsService } from './escorts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Escorts')
@Controller('escorts')
export class EscortsController {
  constructor(private readonly escortsService: EscortsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all verified escorts with search and pagination' })
  @ApiQuery({ name: 'keyword', required: false, description: 'Search by name, bio, or specialties' })
  @ApiQuery({ name: 'specialty', required: false, description: 'Filter by specialty' })
  @ApiQuery({ name: 'minRating', required: false, description: 'Minimum rating filter' })
  @ApiQuery({ name: 'maxPrice', required: false, description: 'Maximum hourly rate' })
  @ApiQuery({ name: 'minPrice', required: false, description: 'Minimum hourly rate' })
  @ApiQuery({ name: 'latitude', required: false, description: 'User latitude for distance sorting' })
  @ApiQuery({ name: 'longitude', required: false, description: 'User longitude for distance sorting' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field: rating, price, distance, orders' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order: asc, desc' })
  async findAll(
    @Query('keyword') keyword?: string,
    @Query('specialty') specialty?: string,
    @Query('minRating') minRating?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('minPrice') minPrice?: string,
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.escortsService.findAll({
      keyword,
      specialty,
      minRating: minRating ? parseFloat(minRating) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      sortBy: sortBy || 'rating',
      sortOrder: sortOrder || 'desc',
    });
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions for escorts' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of suggestions (default: 10)' })
  async getSuggestions(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    return this.escortsService.getSuggestions(query, limit ? parseInt(limit, 10) : 10);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular/top escorts' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of escorts (default: 10)' })
  async getPopular(@Query('limit') limit?: string) {
    return this.escortsService.getPopular(limit ? parseInt(limit, 10) : 10);
  }

  @Get('specialties')
  @ApiOperation({ summary: 'Get all unique specialties' })
  async getSpecialties() {
    return this.escortsService.getSpecialties();
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby escorts' })
  @ApiQuery({ name: 'latitude', required: true })
  @ApiQuery({ name: 'longitude', required: true })
  @ApiQuery({ name: 'radius', required: false, description: 'Radius in km (default: 10)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of escorts (default: 20)' })
  async findNearby(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radius') radius?: string,
    @Query('limit') limit?: string,
  ) {
    return this.escortsService.findNearby(
      parseFloat(latitude),
      parseFloat(longitude),
      radius ? parseFloat(radius) : 10,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get escort by ID' })
  async findById(@Param('id') id: string) {
    return this.escortsService.findById(id);
  }

  @Post('location')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update escort location' })
  async updateLocation(
    @Request() req: any,
    @Body() body: { latitude: number; longitude: number },
  ) {
    return this.escortsService.updateLocation(
      req.user.sub,
      body.latitude,
      body.longitude,
    );
  }
}
