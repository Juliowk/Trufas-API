import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'email deve ser um e-mail valido' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'password e obrigatorio' })
  @MaxLength(72, { message: 'password deve ter no maximo 72 caracteres' })
  password: string;
}
