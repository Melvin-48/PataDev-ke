import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

// Simple liveness check - used by Render/Railway to confirm the service is up.
@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
