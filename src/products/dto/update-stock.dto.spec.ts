import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UpdateStockDto } from './update-stock.dto';

function validate(payload: unknown): string[] {
  const dto = plainToInstance(UpdateStockDto, payload);

  return validateSync(dto).flatMap((error) => Object.values(error.constraints ?? {}));
}

describe('UpdateStockDto', () => {
  it('aceita inteiro positivo', () => {
    expect(validate({ stock: 15 })).toHaveLength(0);
  });

  it('aceita zero', () => {
    expect(validate({ stock: 0 })).toHaveLength(0);
  });

  it('rejeita estoque negativo', () => {
    expect(validate({ stock: -5 })).toContain('stock nao pode ser negativo');
  });

  it('rejeita valor fracionado', () => {
    expect(validate({ stock: 1.5 })).toContain('stock deve ser um numero inteiro');
  });

  it('rejeita texto nao numerico', () => {
    expect(validate({ stock: 'abc' })).toContain('stock deve ser um numero inteiro');
  });

  it('rejeita ausencia do campo', () => {
    expect(validate({})).not.toHaveLength(0);
  });
});
