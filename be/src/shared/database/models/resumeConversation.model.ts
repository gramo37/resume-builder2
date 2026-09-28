import { DataTypes, Model, type Optional } from 'sequelize';
import type { ResumeChatMessage } from './resumeChatMessage.model';
import { sequelize } from '../sequelize';

export interface ResumeConversationAttributes {
  id: number;
  resumeId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type ResumeConversationCreationAttributes = Optional<ResumeConversationAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class ResumeConversation
  extends Model<ResumeConversationAttributes, ResumeConversationCreationAttributes>
  implements ResumeConversationAttributes
{
  declare id: number;
  declare resumeId: number;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare messages?: ResumeChatMessage[];
}

ResumeConversation.init(
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
  },
  {
    sequelize,
    tableName: 'resume_conversations',
    timestamps: true,
  },
);
