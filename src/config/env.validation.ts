import { plainToInstance, Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * Validacao das variaveis de ambiente no boot: e melhor falhar na subida do
 * que descobrir um segredo ausente na primeira requisicao.
 */
export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  // Variaveis de ambiente chegam sempre como string (o Heroku injeta PORT
  // assim), por isso a conversao explicita antes da validacao numerica.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT = 3000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @MinLength(16, { message: 'JWT_SECRET deve ter ao menos 16 caracteres' })
  JWT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  JWT_EXPIRES_IN = '12h';

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  CORS_ORIGIN = 'http://localhost:5173';

  @IsEmail({}, { message: 'ADMIN_EMAIL deve ser um e-mail valido' })
  @IsOptional()
  ADMIN_EMAIL?: string;

  @IsString()
  @MinLength(4, { message: 'ADMIN_PASSWORD deve ter ao menos 4 caracteres' })
  @IsOptional()
  ADMIN_PASSWORD?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('\n  - ');
    throw new Error(`Variaveis de ambiente invalidas:\n  - ${details}`);
  }

  return validated;
}
