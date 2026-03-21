import { PartialType } from '@nestjs/mapped-types';
import { CreateEscortServiceDto } from './create-escort-service.dto';

export class UpdateEscortServiceDto extends PartialType(CreateEscortServiceDto) {}
