import { Resume } from './resume.model';
import { ResumeChangeRequest } from './resumeChangeRequest.model';
import { ResumeChatMessage } from './resumeChatMessage.model';
import { ResumeConversation } from './resumeConversation.model';
import { ResumeTemplate } from './resumeTemplate.model';
import { ResumeVersion } from './resumeVersion.model';
import { User } from './user.model';
import { UserResumeProfile } from './userResumeProfile.model';

User.hasMany(Resume, { foreignKey: 'userId' });
Resume.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(UserResumeProfile, { foreignKey: 'userId' });
UserResumeProfile.belongsTo(User, { foreignKey: 'userId' });

ResumeTemplate.hasMany(Resume, { foreignKey: 'templateId' });
Resume.belongsTo(ResumeTemplate, { foreignKey: 'templateId' });

Resume.hasMany(ResumeVersion, { foreignKey: 'resumeId', as: 'versions' });
ResumeVersion.belongsTo(Resume, { foreignKey: 'resumeId' });
Resume.belongsTo(ResumeVersion, { foreignKey: 'currentVersionId', as: 'currentVersion', constraints: false });
ResumeVersion.belongsTo(ResumeVersion, { foreignKey: 'parentVersionId', as: 'parentVersion', constraints: false });

Resume.hasMany(ResumeChangeRequest, { foreignKey: 'resumeId' });
ResumeChangeRequest.belongsTo(Resume, { foreignKey: 'resumeId' });
ResumeChangeRequest.belongsTo(ResumeVersion, { foreignKey: 'baseVersionId', as: 'baseVersion', constraints: false });
ResumeChangeRequest.belongsTo(ResumeVersion, {
  foreignKey: 'proposedVersionId',
  as: 'proposedVersion',
  constraints: false,
});

Resume.hasMany(ResumeConversation, { foreignKey: 'resumeId' });
ResumeConversation.belongsTo(Resume, { foreignKey: 'resumeId' });
ResumeConversation.hasMany(ResumeChatMessage, { foreignKey: 'conversationId', as: 'messages' });
ResumeChatMessage.belongsTo(ResumeConversation, { foreignKey: 'conversationId' });
ResumeChatMessage.belongsTo(ResumeChangeRequest, { foreignKey: 'changeRequestId', constraints: false });

export { User, type UserAttributes } from './user.model';
export { Resume, type ResumeAttributes } from './resume.model';
export { ResumeTemplate, type ResumeTemplateAttributes } from './resumeTemplate.model';
export { ResumeVersion, type ResumeVersionAttributes } from './resumeVersion.model';
export { ResumeChangeRequest, type ResumeChangeRequestAttributes } from './resumeChangeRequest.model';
export { ResumeConversation, type ResumeConversationAttributes } from './resumeConversation.model';
export { ResumeChatMessage, type ResumeChatMessageAttributes } from './resumeChatMessage.model';
export { UserResumeProfile, type UserResumeProfileAttributes } from './userResumeProfile.model';
