import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { HospitalsService } from './hospitals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Hospitals')
@Controller('hospitals')
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all hospitals with search and pagination' })
  @ApiQuery({ name: 'keyword', required: false, description: 'Search by name, address, or department' })
  @ApiQuery({ name: 'department', required: false, description: 'Filter by department' })
  @ApiQuery({ name: 'level', required: false, description: 'Filter by hospital level (e.g., 三甲)' })
  @ApiQuery({ name: 'minRating', required: false, description: 'Minimum rating filter' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field: rating, name, createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order: asc, desc' })
  async findAll(
    @Query('keyword') keyword?: string,
    @Query('department') department?: string,
    @Query('level') level?: string,
    @Query('minRating') minRating?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.hospitalsService.findAll({
      keyword,
      department,
      level,
      minRating: minRating ? parseFloat(minRating) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      sortBy: sortBy || 'rating',
      sortOrder: sortOrder || 'desc',
    });
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions for hospitals' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of suggestions (default: 10)' })
  async getSuggestions(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    return this.hospitalsService.getSuggestions(query, limit ? parseInt(limit, 10) : 10);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular hospitals' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of hospitals (default: 10)' })
  async getPopular(@Query('limit') limit?: string) {
    return this.hospitalsService.getPopular(limit ? parseInt(limit, 10) : 10);
  }

  @Get('departments')
  @ApiOperation({ summary: 'Get all unique departments' })
  async getDepartments() {
    return this.hospitalsService.getDepartments();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hospital by ID' })
  async findById(@Param('id') id: string) {
    return this.hospitalsService.findById(id);
  }
}
