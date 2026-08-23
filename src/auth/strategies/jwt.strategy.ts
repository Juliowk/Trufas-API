import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  /** id do administrador */
  sub: number;
  email: string;
}

export interface AuthenticatedAdmin {
  id: number;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') as string,
    });
  }

  /** O payload ja foi verificado pela assinatura; vira request.user. */
  validate(payload: JwtPayload): AuthenticatedAdmin {
    return { id: payload.sub, email: payload.email };
  }
}
