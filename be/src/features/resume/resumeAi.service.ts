import type { ResumeDocument } from './schema/types';
import { AppError } from '../../shared/helpers/appError';

export interface ResumeAiRequest {
  resume: ResumeDocument;
  instruction: string;
}

export interface ResumeAiResult {
  content: ResumeDocument;
  assistantMessage: string;
  changeSummary: string;
}

export interface ResumeAiProvider {
  applyInstruction(input: ResumeAiRequest): Promise<ResumeAiResult>;
}

class UnconfiguredResumeAiProvider implements ResumeAiProvider {
  async applyInstruction(): Promise<ResumeAiResult> {
    throw new AppError(501, 'AI provider is not configured');
  }
}

let provider: ResumeAiProvider = new UnconfiguredResumeAiProvider();

export const resumeAiService = {
  setProvider(next: ResumeAiProvider): void {
    provider = next;
  },

  resetProvider(): void {
    provider = new UnconfiguredResumeAiProvider();
  },

  applyInstruction(input: ResumeAiRequest): Promise<ResumeAiResult> {
    return provider.applyInstruction(input);
  },
};
