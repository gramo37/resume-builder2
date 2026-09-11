import { env } from '../../config/env';
import { sequelize } from './sequelize';
import './models';

export { sequelize };

export async function connectDatabase(): Promise<void> {
  await sequelize.authenticate();
  console.log('Database connection established');

  if (env.isDev) {
    await sequelize.sync();
    console.log('Database models synced');
  }
}
