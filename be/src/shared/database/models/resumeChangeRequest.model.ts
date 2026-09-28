import { DataTypes, Model, type Optional } from 'sequelize';
import { CHANGE_REQUEST_STATUSES, type ChangeRequestStatus } from '../../../features/resume/resume.constants';
import { sequelize } from '../sequelize';

export interface ResumeChangeRequestAttributes {
  id: number;
  resumeId: number;
  baseVersionId: number | null;
  proposedVersionId: number | null;
  instruction: string;
  status: ChangeRequestStatus;
  createdAt?: Date;
  completedAt: Date | null;
}

type ResumeChangeRequestCreationAttributes = Optional<
  ResumeChangeRequestAttributes,
  'id' | 'baseVersionId' | 'proposedVersionId' | 'createdAt' | 'completedAt'
>;

export class ResumeChangeRequest
  extends Model<ResumeChangeRequestAttributes, ResumeChangeRequestCreationAttributes>
  implements ResumeChangeRequestAttributes
{
  declare id: number;
  declare resumeId: number;
  declare baseVersionId: number | null;
  declare proposedVersionId: number | null;
  declare instruction: string;
  declare status: ChangeRequestStatus;
  declare createdAt: Date;
  declare completedAt: Date | null;
}

ResumeChangeRequest.init(
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
    baseVersionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    proposedVersionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    instruction: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...CHANGE_REQUEST_STATUSES),
      allowNull: false,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'resume_change_requests',
    timestamps: true,
    updatedAt: false,
  },
);
