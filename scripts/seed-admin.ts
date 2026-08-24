import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { Admin } from '../src/auth/entities/admin.entity';
import { Product } from '../src/products/entities/product.entity';

loadEnv();

// Mesmo custo usado pelo AuthService, para que o hash gerado aqui seja
// indistinguivel do criado no boot da aplicacao.
const BCRYPT_ROUNDS = 12;

/**
 * Reaplica ADMIN_EMAIL / ADMIN_PASSWORD no administrador existente.
 *
 * O seed do boot (AuthService.onModuleInit) e propositalmente idempotente: se
 * ja existe um administrador ele nao toca na senha em uso. Isso deixa o
 * desenvolvimento sem saida quando as credenciais do .env estavam erradas — dai
 * este script, que sobrescreve o registro em vez de ignora-lo.
 */
async function seedAdmin(): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production';

  // Sobrescrever credenciais e destrutivo: em producao exige o opt-in
  // explicito para nao derrubar o acesso da administradora por engano.
  if (isProduction && process.env.ALLOW_ADMIN_RESET !== 'true') {
    console.error(
      'Este script sobrescreve as credenciais do administrador e esta bloqueado em producao.\n' +
        'Se for realmente a intencao, rode com ALLOW_ADMIN_RESET=true.',
    );
    process.exit(1);
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Defina ADMIN_EMAIL e ADMIN_PASSWORD no .env antes de rodar o seed.');
    process.exit(1);
  }

  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [Product, Admin],
    synchronize: true,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  });

  await dataSource.initialize();
  const repository = dataSource.getRepository(Admin);

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // O sistema tem um unico administrador: pega o primeiro registro (qualquer
  // e-mail) e reescreve nele, senao o e-mail antigo ficaria orfao no banco.
  const existing = await repository.findOne({ where: {}, order: { id: 'ASC' } });

  if (existing) {
    await repository.update(existing.id, { email, passwordHash });
    console.log(`Credenciais do administrador atualizadas: ${email}`);
  } else {
    await repository.save(repository.create({ email, passwordHash }));
    console.log(`Administrador criado: ${email}`);
  }

  await dataSource.destroy();
}

seedAdmin().catch((error) => {
  console.error('Falha no seed do administrador:', error);
  process.exit(1);
});
