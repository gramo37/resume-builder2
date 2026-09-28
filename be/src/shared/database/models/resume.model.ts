import { DataTypes, Model, type Optional } from 'sequelize';
import type { ResumeVersion } from './resumeVersion.model';
import { sequelize } from '../sequelize';

export interface ResumeAttributes {
  id: number;
  userId: number;
  templateId: number;
  name: string;
  currentVersionId: number | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

type ResumeCreationAttributes = Optional<
  ResumeAttributes,
  'id' | 'currentVersionId' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

export class Resume extends Model<ResumeAttributes, ResumeCreationAttributes> implements ResumeAttributes {
  declare id: number;
  declare userId: number;
  declare templateId: number;
  declare name: string;
  declare currentVersionId: number | null;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: Date | null;
  declare currentVersion?: ResumeVersion;
}

Resume.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    templateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    currentVersionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'resumes',
    timestamps: true,
    paranoid: true,
  },
);
