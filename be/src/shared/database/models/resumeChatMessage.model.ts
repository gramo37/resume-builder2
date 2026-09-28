import { DataTypes, Model, type Optional } from 'sequelize';
import { CHAT_ROLES, type ChatRole } from '../../../features/resume/resume.constants';
import { sequelize } from '../sequelize';

export interface ResumeChatMessageAttributes {
  id: number;
  conversationId: number;
  role: ChatRole;
  content: string;
  changeRequestId: number | null;
  createdAt?: Date;
}

type ResumeChatMessageCreationAttributes = Optional<
  ResumeChatMessageAttributes,
  'id' | 'changeRequestId' | 'createdAt'
>;

export class ResumeChatMessage
  extends Model<ResumeChatMessageAttributes, ResumeChatMessageCreationAttributes>
  implements ResumeChatMessageAttributes
{
  declare id: number;
  declare conversationId: number;
  declare role: ChatRole;
  declare content: string;
  declare changeRequestId: number | null;
  declare createdAt: Date;
}

ResumeChatMessage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(...CHAT_ROLES),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    changeRequestId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'resume_chat_messages',
    timestamps: true,
    updatedAt: false,
  },
);
