import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Admin } from '../auth/entities/admin.entity';
import { Product } from '../products/entities/product.entity';

/**
 * Conexao unica com PostgreSQL, sempre via DATABASE_URL.
 *
 * synchronize fica ligado fora de producao para dispensar migrations no MVP.
 * Em producao ele so e ligado se DB_SYNCHRONIZE=true for definido de forma
 * deliberada — util no primeiro deploy no Heroku para criar as tabelas, e para
 * ser desligado logo em seguida.
 */
export function buildTypeOrmOptions(config: ConfigService): TypeOrmModuleOptions {
  const isProduction = config.get<string>('NODE_ENV') === 'production';
  const explicitSync = config.get<string>('DB_SYNCHRONIZE') === 'true';

  return {
    type: 'postgres',
    url: config.get<string>('DATABASE_URL'),
    entities: [Product, Admin],
    synchronize: isProduction ? explicitSync : true,
    autoLoadEntities: false,
    logging: isProduction ? ['error'] : ['error', 'warn'],
    // O Heroku Postgres exige TLS com certificado que nao encadeia numa CA
    // publica; local nao usa TLS.
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  };
}
