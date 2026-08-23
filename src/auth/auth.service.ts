import { Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { Admin } from './entities/admin.entity';
import { JwtPayload } from './strategies/jwt.strategy';

const BCRYPT_ROUNDS = 12;

export interface LoginResponse {
  accessToken: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Admin)
    private readonly adminsRepository: Repository<Admin>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Seed do unico administrador. Roda a cada boot, mas so cria o registro se
   * ainda nao existir nenhum administrador — reiniciar a aplicacao nao duplica
   * usuarios nem sobrescreve a senha em uso.
   */
  async onModuleInit(): Promise<void> {
    const email = this.config.get<string>('ADMIN_EMAIL')?.trim().toLowerCase();
    const password = this.config.get<string>('ADMIN_PASSWORD');

    if (!email || !password) {
      this.logger.warn(
        'ADMIN_EMAIL/ADMIN_PASSWORD nao definidos: seed do administrador ignorado.',
      );
      return;
    }

    const existing = await this.adminsRepository.count();

    if (existing > 0) {
      this.logger.log('Administrador ja existe; seed ignorado.');
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await this.adminsRepository.save(this.adminsRepository.create({ email, passwordHash }));

    this.logger.log(`Administrador criado: ${email}`);
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const admin = await this.adminsRepository
      .createQueryBuilder('admin')
      .addSelect('admin.passwordHash')
      .where('admin.email = :email', { email: loginDto.email })
      .getOne();

    // bcrypt.compare tambem roda quando o e-mail nao existe, contra um hash
    // descartavel, para nao vazar a existencia da conta pelo tempo de resposta.
    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      admin?.passwordHash ?? '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin',
    );

    if (!admin || !passwordMatches) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    const payload: JwtPayload = { sub: admin.id, email: admin.email };

    return { accessToken: await this.jwtService.signAsync(payload) };
  }
}
