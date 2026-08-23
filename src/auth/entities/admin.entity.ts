import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Unico administrador do sistema. Criado no boot a partir de ADMIN_EMAIL /
 * ADMIN_PASSWORD. A senha e armazenada apenas como hash bcrypt.
 */
@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 180, unique: true })
  email: string;

  // select: false mantem o hash fora das consultas comuns; o login pede o
  // campo explicitamente via addSelect.
  @Column({ type: 'varchar', length: 100, select: false })
  passwordHash: string;
}
