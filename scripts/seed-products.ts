import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { Admin } from '../src/auth/entities/admin.entity';
import { Product } from '../src/products/entities/product.entity';

loadEnv();

/**
 * Catalogo inicial. Os ids sao fixos e devem casar com as imagens do frontend
 * (produto 1 -> /products/1.webp), por isso sao inseridos explicitamente.
 */
const CATALOG: Array<Pick<Product, 'id' | 'name' | 'price'>> = [
  { id: 1, name: 'Choco Clássico', price: 3.0 },
  { id: 2, name: 'Choco Morango', price: 3.0 },
  { id: 3, name: 'Choco Leite', price: 3.0 },
  { id: 4, name: 'Três Amores', price: 3.0 },
  { id: 5, name: 'Ninho dos Sonhos', price: 3.0 },
  { id: 6, name: 'Paçoquinha Doce', price: 3.0 },
  { id: 7, name: 'Amendoim Real', price: 3.0 },
  { id: 8, name: 'Sabor Tropical', price: 3.0 },
  { id: 9, name: 'Encanto de Limão', price: 3.0 },
  { id: 10, name: 'Beijinho', price: 3.0 },
];

async function seed(): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production';

  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [Product, Admin],
    synchronize: true,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  });

  await dataSource.initialize();
  const repository = dataSource.getRepository(Product);

  let created = 0;

  for (const item of CATALOG) {
    const existing = await repository.findOne({ where: { id: item.id } });

    // Nunca sobrescreve um produto existente: estoque e preco ja podem ter
    // sido ajustados pela administradora.
    if (existing) {
      continue;
    }

    await repository.insert({ ...item, stock: 0, active: true });
    created += 1;
  }

  // Reposiciona a sequence apos os ids inseridos manualmente, senao o proximo
  // INSERT automatico colidiria com um id ja usado.
  await dataSource.query(
    `SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1))`,
  );

  console.log(`Seed concluido: ${created} produto(s) criado(s), ${CATALOG.length - created} ja existiam.`);

  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('Falha no seed de produtos:', error);
  process.exit(1);
});
