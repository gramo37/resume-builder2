import type { Transaction } from 'sequelize';
import { ResumeChatMessage, ResumeConversation } from '../../shared/database';
import { AppError } from '../../shared/helpers/appError';
import type { ChatRole } from './resume.constants';

export const resumeConversationService = {
  async resolve(resumeId: number, conversationId: number | undefined, transaction: Transaction): Promise<ResumeConversation> {
    if (conversationId != null) {
      const conversation = await ResumeConversation.findOne({
        where: { id: conversationId, resumeId },
        transaction,
      });
      if (!conversation) {
        throw new AppError(404, 'Conversation not found');
      }
      return conversation;
    }

    const latest = await ResumeConversation.findOne({
      where: { resumeId },
      order: [['updatedAt', 'DESC']],
      transaction,
    });

    if (latest) {
      return latest;
    }

    return ResumeConversation.create({ resumeId }, { transaction });
  },

  async addMessage(
    input: {
      conversation: ResumeConversation;
      role: ChatRole;
      content: string;
      changeRequestId?: number | null;
    },
    transaction: Transaction,
  ): Promise<ResumeChatMessage> {
    const message = await ResumeChatMessage.create(
      {
        conversationId: input.conversation.id,
        role: input.role,
        content: input.content,
        changeRequestId: input.changeRequestId ?? null,
      },
      { transaction },
    );

    input.conversation.changed('updatedAt', true);
    await input.conversation.save({ transaction });
    return message;
  },
};
