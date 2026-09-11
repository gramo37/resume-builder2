import { Sequelize } from 'sequelize';
import { env } from '../../config/env';

export const sequelize = new Sequelize({
  dialect: 'postgres',
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  username: env.db.user,
  password: env.db.password,
  logging: env.isDev ? console.log : false,
});
