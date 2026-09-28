import { DataTypes, type QueryInterface } from 'sequelize';
import singleColumnTemplate from '../../../features/resume/templates/single-column.json';

const VERSION_STATUSES = ['PROPOSED', 'APPROVED', 'REJECTED', 'SUPERSEDED'];
const VERSION_SOURCES = ['AI', 'EDITOR', 'SYSTEM', 'IMPORT'];
const CHANGE_REQUEST_STATUSES = ['PROCESSING', 'PROPOSED', 'APPROVED', 'REJECTED', 'FAILED'];
const CHAT_ROLES = ['USER', 'ASSISTANT', 'SYSTEM'];

export async function up({ context: queryInterface }: { context: QueryInterface }): Promise<void> {
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      "cognitoSub" VARCHAR(64) NOT NULL UNIQUE,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      "createdAt" TIMESTAMPTZ NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL
    );
  `);

  await queryInterface.createTable('resume_templates', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
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
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  await queryInterface.createTable('user_resume_profiles', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  await queryInterface.createTable('resumes', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    templateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'resume_templates', key: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    currentVersionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await queryInterface.createTable('resume_versions', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    resumeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'resumes', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
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
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  await queryInterface.addConstraint('resume_versions', {
    fields: ['parentVersionId'],
    type: 'foreign key',
    name: 'resume_versions_parent_version_id_fkey',
    references: { table: 'resume_versions', field: 'id' },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  await queryInterface.addConstraint('resumes', {
    fields: ['currentVersionId'],
    type: 'foreign key',
    name: 'resumes_current_version_id_fkey',
    references: { table: 'resume_versions', field: 'id' },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });

  await queryInterface.createTable('resume_change_requests', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    resumeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'resumes', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    baseVersionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'resume_versions', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    proposedVersionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'resume_versions', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    instruction: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...CHANGE_REQUEST_STATUSES),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await queryInterface.createTable('resume_conversations', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    resumeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'resumes', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  await queryInterface.createTable('resume_chat_messages', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'resume_conversations', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
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
      references: { model: 'resume_change_requests', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  await queryInterface.addIndex('resumes', ['userId'], { name: 'resumes_user_id' });
  await queryInterface.addIndex('resumes', ['templateId'], { name: 'resumes_template_id' });
  await queryInterface.addIndex('resume_versions', ['resumeId'], { name: 'resume_versions_resume_id' });
  await queryInterface.addIndex('resume_versions', ['resumeId', 'versionNumber'], {
    unique: true,
    name: 'resume_versions_resume_id_version_number',
  });
  await queryInterface.addIndex('resume_versions', ['parentVersionId'], {
    name: 'resume_versions_parent_version_id',
  });
  await queryInterface.addIndex('resume_versions', ['status'], { name: 'resume_versions_status' });
  await queryInterface.addIndex('resume_change_requests', ['resumeId'], {
    name: 'resume_change_requests_resume_id',
  });
  await queryInterface.addIndex('resume_change_requests', ['status'], {
    name: 'resume_change_requests_status',
  });
  await queryInterface.addIndex('resume_conversations', ['resumeId'], {
    name: 'resume_conversations_resume_id',
  });
  await queryInterface.addIndex('resume_chat_messages', ['conversationId'], {
    name: 'resume_chat_messages_conversation_id',
  });
  await queryInterface.addIndex('resume_chat_messages', ['changeRequestId'], {
    name: 'resume_chat_messages_change_request_id',
  });

  await queryInterface.bulkInsert('resume_templates', [
    {
      key: 'single-column',
      name: 'Single column',
      description: 'A single column resume layout.',
      template: JSON.stringify(singleColumnTemplate),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}

export async function down({ context: queryInterface }: { context: QueryInterface }): Promise<void> {
  await queryInterface.removeConstraint('resumes', 'resumes_current_version_id_fkey');
  await queryInterface.dropTable('resume_chat_messages');
  await queryInterface.dropTable('resume_conversations');
  await queryInterface.dropTable('resume_change_requests');
  await queryInterface.dropTable('resume_versions');
  await queryInterface.dropTable('resumes');
  await queryInterface.dropTable('user_resume_profiles');
  await queryInterface.dropTable('resume_templates');

  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_resume_chat_messages_role";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_resume_change_requests_status";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_resume_versions_source";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_resume_versions_status";');
}
