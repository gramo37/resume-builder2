import { migrator } from './migrator';
import { sequelize } from './sequelize';
import './models';

export { sequelize };
export {
  Resume,
  ResumeChangeRequest,
  ResumeChatMessage,
  ResumeConversation,
  ResumeTemplate,
  ResumeVersion,
  User,
  UserResumeProfile,
  type ResumeAttributes,
  type ResumeChangeRequestAttributes,
  type ResumeChatMessageAttributes,
  type ResumeConversationAttributes,
  type ResumeTemplateAttributes,
  type ResumeVersionAttributes,
  type UserAttributes,
  type UserResumeProfileAttributes,
} from './models';

export async function connectDatabase(): Promise<void> {
  await sequelize.authenticate();
  console.log('Database connection established');

  await migrator.up();
  console.log('Database migrations applied');
}
