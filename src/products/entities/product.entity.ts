import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Produto do catalogo.
 *
 * A imagem NAO faz parte da entidade: o frontend resolve a imagem a partir do
 * id (ex.: produto 1 -> /products/1.webp), por isso o id e permanente.
 */
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  // numeric no PostgreSQL evita os erros de arredondamento do float.
  // O transformer devolve number para a API em vez da string do driver pg.
  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number): number => value,
      from: (value: string | null): number => (value === null ? 0 : Number(value)),
    },
  })
  price: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
