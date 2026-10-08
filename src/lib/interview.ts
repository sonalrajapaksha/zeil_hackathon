import { INTERVIEW_LIMIT, type ConversationMessage, type ConversationRequest, type InterviewProgress } from './contracts.ts';

export const EMPTY_INTERVIEW: InterviewProgress = { status: 'active', answered: 0, questions: 0, limit: INTERVIEW_LIMIT };
export const END_REPLY = 'Thank you for sharing your story. Your interview has ended. You can review your history and add details to your career canvas.';

// Pure transitions: callers keep the previous state until generation succeeds.
export function prepareTurn(request: ConversationRequest): ConversationMessage[] {
  if (request.action === 'start') return [];
  if (request.action === 'end') return request.history;
  if (request.action === 'correct') {
    const index = request.history.findIndex((message) => message.id === request.messageId);
    return [...request.history.slice(0, index), { ...request.history[index], content: request.answer! }];
  }
  return [...request.history, {
    id: crypto.randomUUID(), role: 'user',
    content: request.action === 'skip' ? '[Question skipped by candidate]' : request.answer!,
  }];
}

export function progress(history: ConversationMessage[], ended = false): InterviewProgress {
  const questions = history.filter((message) => message.role === 'assistant').length;
  return {
    status: ended ? 'ended' : 'active',
    answered: history.filter((message) => message.role === 'user' && message.content !== '[Question skipped by candidate]').length,
    questions, limit: INTERVIEW_LIMIT,
  };
}
