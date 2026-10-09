import type { LiveServerContent } from '@google/genai';

export type VoiceAnswerBuffer = { text: string; overflow: boolean; suppressed: boolean; interrupted: boolean };

/** Input/output transcription ordering is independent. Never collect the model's words. */
export function collectVoiceAnswer(buffer: VoiceAnswerBuffer, content: LiveServerContent) {
  if (content.interrupted) buffer.interrupted = true;
  const input = content.inputTranscription;
  if (typeof input?.text === 'string' && !buffer.suppressed) {
    buffer.overflow ||= buffer.text.length + input.text.length > 4000;
    buffer.text = (buffer.text + input.text).slice(0, 4000);
  }
  // Prefer the native final-transcription marker; older streams complete on turnComplete.
  // An interrupted model turn must not split the candidate's new, unfinished answer.
  const complete = input?.finished || content.turnComplete && !buffer.interrupted;
  const suppressed = buffer.suppressed;
  if (content.turnComplete) { buffer.interrupted = false; buffer.suppressed = false; }
  if (!complete || suppressed) return null;
  const answer = buffer.text.trim();
  const tooLong = buffer.overflow;
  buffer.text = ''; buffer.overflow = false;
  return answer || tooLong ? { answer: tooLong ? '' : answer, tooLong } : null;
}
