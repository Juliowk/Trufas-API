import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpdateStockDto {
  @Type(() => Number)
  @IsInt({ message: 'stock deve ser um numero inteiro' })
  @Min(0, { message: 'stock nao pode ser negativo' })
  stock: number;
}
