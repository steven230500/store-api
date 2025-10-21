import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Server running on port ${process.env.PORT ?? 3000}`);
}

bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
  process.exit(1);
});
