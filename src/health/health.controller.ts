import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  /** Usado para conferir se a API subiu apos o deploy. */
  @Get()
  check(): { status: string } {
    return { status: 'ok' };
  }
}
