import { Sequelize } from 'sequelize';
import { env } from '../../config/env';
import { migrator } from './migrator';
import { sequelize } from './sequelize';

async function ensureDatabaseExists(): Promise<void> {
  const admin = new Sequelize({
    dialect: 'postgres',
    host: env.db.host,
    port: env.db.port,
    database: 'postgres',
    username: env.db.user,
    password: env.db.password,
    logging: false,
  });

  try {
    const [rows] = await admin.query('SELECT 1 FROM pg_database WHERE datname = :name', {
      replacements: { name: env.db.name },
    });
    if (rows.length === 0) {
      await admin.query(`CREATE DATABASE "${env.db.name.replace(/"/g, '""')}"`);
      console.log(`Created database "${env.db.name}"`);
    }
  } finally {
    await admin.close();
  }
}

async function main(): Promise<void> {
  try {
    await ensureDatabaseExists();
    await sequelize.authenticate();
    await migrator.runAsCLI();
  } finally {
    await sequelize.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
