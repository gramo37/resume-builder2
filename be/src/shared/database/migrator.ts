import type { QueryInterface } from 'sequelize';
import { SequelizeStorage, Umzug } from 'umzug';
import * as createResumeTables from './migrations/20260927120000-create-resume-tables';
import { sequelize } from './sequelize';

export const migrator = new Umzug<QueryInterface>({
  migrations: [
    {
      name: '20260927120000-create-resume-tables',
      up: createResumeTables.up,
      down: createResumeTables.down,
    },
  ],
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: undefined,
});
