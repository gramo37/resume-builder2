import { DataTypes, Model, type Optional } from 'sequelize';
import {
  VERSION_SOURCES,
  VERSION_STATUSES,
  type VersionSource,
  type VersionStatus,
} from '../../../features/resume/resume.constants';
import { sequelize } from '../sequelize';

export interface ResumeVersionAttributes {
  id: number;
  resumeId: number;
  versionNumber: number;
  parentVersionId: number | null;
  status: VersionStatus;
  source: VersionSource;
  content: object;
  changeSummary: string | null;
  createdAt?: Date;
}

type ResumeVersionCreationAttributes = Optional<
  ResumeVersionAttributes,
  'id' | 'parentVersionId' | 'changeSummary' | 'createdAt'
>;

export class ResumeVersion
  extends Model<ResumeVersionAttributes, ResumeVersionCreationAttributes>
  implements ResumeVersionAttributes
{
  declare id: number;
  declare resumeId: number;
  declare versionNumber: number;
  declare parentVersionId: number | null;
  declare status: VersionStatus;
  declare source: VersionSource;
  declare content: object;
  declare changeSummary: string | null;
  declare createdAt: Date;
}

ResumeVersion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    resumeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    versionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    parentVersionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...VERSION_STATUSES),
      allowNull: false,
    },
    source: {
      type: DataTypes.ENUM(...VERSION_SOURCES),
      allowNull: false,
    },
    content: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    changeSummary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'resume_versions',
    timestamps: true,
    updatedAt: false,
  },
);
