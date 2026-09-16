import { env } from '../../config/env';
import { sequelize } from './sequelize';
import './models';

export { sequelize };
export { User, type UserAttributes } from './models';

export async function connectDatabase(): Promise<void> {
  await sequelize.authenticate();
  console.log('Database connection established');

  if (env.isDev) {
    await sequelize.sync({ alter: true });
    console.log('Database models synced');
  }
}
