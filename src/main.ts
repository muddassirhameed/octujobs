import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = Number(configService.get('APP_PORT', 5000));

  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error('Unhandled bootstrap error:', error);
  process.exit(1);
});
