import { DataTypes, Model, type Optional } from 'sequelize';
import { sequelize } from '../sequelize';

export interface ResumeTemplateAttributes {
  id: number;
  key: string;
  name: string;
  description: string;
  template: object;
  createdAt?: Date;
  updatedAt?: Date;
}

type ResumeTemplateCreationAttributes = Optional<ResumeTemplateAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class ResumeTemplate
  extends Model<ResumeTemplateAttributes, ResumeTemplateCreationAttributes>
  implements ResumeTemplateAttributes
{
  declare id: number;
  declare key: string;
  declare name: string;
  declare description: string;
  declare template: object;
  declare createdAt: Date;
  declare updatedAt: Date;
}

ResumeTemplate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    template: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'resume_templates',
    timestamps: true,
  },
);
