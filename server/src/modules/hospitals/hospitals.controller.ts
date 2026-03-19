import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { HospitalsService } from './hospitals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Hospitals')
@Controller('hospitals')
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all hospitals' })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'department', required: false })
  async findAll(
    @Query('keyword') keyword?: string,
    @Query('department') department?: string,
  ) {
    return this.hospitalsService.findAll({ keyword, department });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hospital by ID' })
  async findById(@Param('id') id: string) {
    return this.hospitalsService.findById(id);
  }
}
