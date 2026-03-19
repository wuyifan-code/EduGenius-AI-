import { Controller, Get, Post, Query, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { EscortsService } from './escorts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Escorts')
@Controller('escorts')
export class EscortsController {
  constructor(private readonly escortsService: EscortsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all verified escorts' })
  @ApiQuery({ name: 'latitude', required: false })
  @ApiQuery({ name: 'longitude', required: false })
  @ApiQuery({ name: 'rating', required: false })
  async findAll(
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number,
    @Query('rating') rating?: number,
  ) {
    return this.escortsService.findAll({
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      rating: rating ? Number(rating) : undefined,
    });
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby escorts' })
  @ApiQuery({ name: 'latitude', required: true })
  @ApiQuery({ name: 'longitude', required: true })
  @ApiQuery({ name: 'radius', required: false })
  async findNearby(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radius') radius?: string,
  ) {
    return this.escortsService.findNearby(
      Number(latitude),
      Number(longitude),
      radius ? Number(radius) : 10,
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
