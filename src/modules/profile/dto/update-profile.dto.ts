import {
  IsOptional,
  IsNumber,
  IsEnum,
  IsString,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FitnessGoal } from '../../../common/enums';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 175.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  heightCm?: number;

  @ApiPropertyOptional({ example: 80.2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  age?: number;

  @ApiPropertyOptional({ enum: FitnessGoal, example: FitnessGoal.MUSCLE_GAIN })
  @IsOptional()
  @IsEnum(FitnessGoal)
  fitnessGoal?: FitnessGoal;

  @ApiPropertyOptional({ example: 'High protein, low carb' })
  @IsOptional()
  @IsString()
  dietaryPreferences?: string;

  @ApiPropertyOptional({ example: 'Lactose, Gluten' })
  @IsOptional()
  @IsString()
  allergies?: string;
}
