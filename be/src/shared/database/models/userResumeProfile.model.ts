import { DataTypes, Model, type Optional } from 'sequelize';
import { sequelize } from '../sequelize';

export interface UserResumeProfileAttributes {
  id: number;
  userId: number;
  data: object;
  createdAt?: Date;
  updatedAt?: Date;
}

type UserResumeProfileCreationAttributes = Optional<
  UserResumeProfileAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

export class UserResumeProfile
  extends Model<UserResumeProfileAttributes, UserResumeProfileCreationAttributes>
  implements UserResumeProfileAttributes
{
  declare id: number;
  declare userId: number;
  declare data: object;
  declare createdAt: Date;
  declare updatedAt: Date;
}

UserResumeProfile.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'user_resume_profiles',
    timestamps: true,
  },
);
