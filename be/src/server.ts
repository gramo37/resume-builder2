import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase } from './shared/database';

async function bootstrap() {
  await connectDatabase();

  const app = createApp();

  app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
