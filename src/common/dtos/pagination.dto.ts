import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsPositive()
  @Type(() => Number) // Convertir de tipo
  limit?: number;
  @IsOptional()
  @Min(0)
  @Type(() => Number) // Convertir de tipo
  offset?: number;
}
