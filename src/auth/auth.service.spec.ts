import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { Admin } from './entities/admin.entity';

describe('AuthService', () => {
  let service: AuthService;
  let repository: {
    count: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let queryBuilder: { addSelect: jest.Mock; where: jest.Mock; getOne: jest.Mock };
  let jwtService: { signAsync: jest.Mock };
  let env: Record<string, string | undefined>;

  const passwordHash = bcrypt.hashSync('senha-correta', 4);

  beforeEach(async () => {
    env = {
      ADMIN_EMAIL: 'admin@kakatrufas.com.br',
      ADMIN_PASSWORD: 'senha-correta',
    };

    queryBuilder = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    repository = {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn((entity) => entity),
      save: jest.fn((entity) => Promise.resolve({ id: 1, ...entity })),
      createQueryBuilder: jest.fn(() => queryBuilder),
    };

    jwtService = { signAsync: jest.fn().mockResolvedValue('token-assinado') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(Admin), useValue: repository },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: { get: (key: string) => env[key] } },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('seed do administrador', () => {
    it('cria o administrador com senha em hash quando nao existe nenhum', async () => {
      await service.onModuleInit();

      expect(repository.save).toHaveBeenCalledTimes(1);
      const saved = repository.save.mock.calls[0][0] as Admin;
      expect(saved.email).toBe('admin@kakatrufas.com.br');
      expect(saved.passwordHash).not.toBe('senha-correta');
      expect(bcrypt.compareSync('senha-correta', saved.passwordHash)).toBe(true);
    });

    it('nao duplica o administrador quando ja existe um', async () => {
      repository.count.mockResolvedValue(1);

      await service.onModuleInit();

      expect(repository.save).not.toHaveBeenCalled();
    });

    it('ignora o seed quando as variaveis nao estao definidas', async () => {
      env = {};

      await service.onModuleInit();

      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('retorna accessToken para credenciais validas', async () => {
      queryBuilder.getOne.mockResolvedValue({
        id: 1,
        email: 'admin@kakatrufas.com.br',
        passwordHash,
      });

      await expect(
        service.login({ email: 'admin@kakatrufas.com.br', password: 'senha-correta' }),
      ).resolves.toEqual({ accessToken: 'token-assinado' });

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 1,
        email: 'admin@kakatrufas.com.br',
      });
    });

    it('rejeita senha incorreta', async () => {
      queryBuilder.getOne.mockResolvedValue({
        id: 1,
        email: 'admin@kakatrufas.com.br',
        passwordHash,
      });

      await expect(
        service.login({ email: 'admin@kakatrufas.com.br', password: 'senha-errada' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejeita e-mail inexistente sem emitir token', async () => {
      queryBuilder.getOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ninguem@exemplo.com', password: 'qualquer' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });
});
