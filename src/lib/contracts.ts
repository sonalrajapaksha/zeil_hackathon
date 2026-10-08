import { z } from "zod";
export const ExperienceSchema = z.object({ id:z.string(), organisation:z.string(), role:z.string(), dateRange:z.string().optional(), evidence:z.array(z.string()), confirmed:z.boolean().default(false) });
export const ProfileSkillSchema = z.object({ id:z.string(), name:z.string(), evidence:z.string(), confirmed:z.boolean().default(false) });
export const ProfileExperienceSchema = z.object({ id:z.string(), text:z.string(), evidence:z.array(z.string()), confirmed:z.boolean().default(false) });
export const ProfileEducationSchema = z.object({ id:z.string(), text:z.string(), evidence:z.string(), confirmed:z.boolean().default(false) });
export const CandidateProfileSchema = z.object({ name:z.string().optional(), summary:z.string().optional(), skills:z.array(ProfileSkillSchema), experience:z.array(z.union([ExperienceSchema, ProfileExperienceSchema])), education:z.array(ProfileEducationSchema), preferences:z.object({largeText:z.boolean(), highContrast:z.boolean(), reducedMotion:z.boolean(), questionStyle:z.enum(['simple','standard']).optional()}) });
export const JobListingSchema = z.object({id:z.string(),title:z.string(),company:z.string(),location:z.string(),arrangement:z.string(),description:z.string(),requirements:z.array(z.string())});
export const ConversationMessageSchema = z.object({id:z.string(),role:z.enum(['user','assistant']),content:z.string()});
export const ApplicationPackageSchema = z.object({jobId:z.string().min(1).max(100),cvText:z.string().trim().min(1).max(12_000),coverLetter:z.string().trim().min(1).max(8_000),unverifiedClaims:z.array(z.string().trim().min(1).max(300)).max(10),generatedAt:z.string().datetime()}).strict();
export const ApplicationRequestSchema = z.object({ profile: CandidateProfileSchema, jobId: z.string().min(1).max(100) }).strict().superRefine(({ profile }, ctx) => {
  const claims = [...profile.skills, ...profile.experience, ...profile.education];
  if (claims.length > 60) ctx.addIssue({ code: 'custom', message: 'Too many profile items.' });
  if (claims.some((claim) => ("name" in claim ? claim.name.length : "text" in claim ? claim.text.length : claim.role.length + claim.organisation.length) > 500))
    ctx.addIssue({ code: 'custom', message: 'Profile items must be 500 characters or fewer.' });
});
export const ApplicationErrorSchema = z.object({
  error: z.object({
    code: z.enum(['INVALID_REQUEST', 'NOT_CONFIGURED', 'UNKNOWN_JOB', 'NO_CONFIRMED_EVIDENCE', 'TIMEOUT', 'RATE_LIMITED', 'PROVIDER_ERROR', 'INVALID_RESPONSE']),
    message: z.string(), retryable: z.boolean(),
  }).strict(),
}).strict();
export const CvImportResponseSchema = z.object({ suggestions: z.array(z.object({ kind: z.enum(['skill', 'experience', 'education']), text: z.string().trim().min(1).max(240), evidence: z.string().trim().min(1).max(400) }).strict()).max(5) }).strict();
export const CvImportErrorSchema = z.object({ error: z.object({ code: z.enum(['INVALID_REQUEST', 'NOT_CONFIGURED', 'TIMEOUT', 'RATE_LIMITED', 'PROVIDER_ERROR', 'INVALID_RESPONSE']), message: z.string(), retryable: z.boolean() }).strict() }).strict();
export type ApplicationRequest = z.infer<typeof ApplicationRequestSchema>;
export type CandidateProfile = z.infer<typeof CandidateProfileSchema>;
export type JobListing = z.infer<typeof JobListingSchema>;
export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;
export type ApplicationPackage = z.infer<typeof ApplicationPackageSchema>;

export const INTERVIEW_LIMIT = 12;
export const QuestionStyleSchema = z.enum(['simple', 'standard']);
export const CLARIFICATION_REQUEST = '[Candidate requested clarification]';
export const InterviewHistorySchema = z.array(ConversationMessageSchema.extend({
  id: z.string().min(1).max(100),
  content: z.string().trim().min(1).max(4000),
}).strict()).max(INTERVIEW_LIMIT * 4 - 1).superRefine((history, ctx) => {
  if (new Set(history.map((message) => message.id)).size !== history.length)
    ctx.addIssue({ code: 'custom', message: 'Message IDs must be unique.' });
  history.forEach((message, index) => {
    if (message.role !== (index % 2 === 0 ? 'assistant' : 'user'))
      ctx.addIssue({ code: 'custom', message: 'History must alternate questions and answers.' });
  });
});
export const ConversationRequestSchema = z.object({
  action: z.enum(['start', 'answer', 'skip', 'correct', 'clarify', 'end']),
  history: InterviewHistorySchema,
  questionStyle: QuestionStyleSchema,
  answer: z.string().trim().min(1).max(4000).optional(),
  messageId: z.string().min(1).max(100).optional(),
}).strict().superRefine((request, ctx) => {
  const { action, history, answer, messageId } = request;
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
  if (action === 'start' && history.length) fail('Start requires an empty history.');
  if (action !== 'start' && !history.length) fail('Start the interview first.');
  if ((action === 'answer' || action === 'skip' || action === 'clarify') && history.at(-1)?.role !== 'assistant') fail('This action requires a pending question.');
  if (action === 'clarify' && history.at(-2)?.content === CLARIFICATION_REQUEST) fail('The pending question has already been clarified.');
  if ((action === 'answer' || action === 'correct') !== (answer !== undefined)) fail('Provide an answer only for answer or correct.');
  if (action === 'correct') {
    if (!history.some((message) => message.id === messageId && message.role === 'user')) fail('Choose a previous answer to correct.');
  } else if (messageId !== undefined) fail('Message ID is only used for corrections.');
});
export const InterviewProgressSchema = z.object({
  status: z.enum(['active', 'ended']),
  answered: z.number().int().min(0).max(INTERVIEW_LIMIT),
  questions: z.number().int().min(0).max(INTERVIEW_LIMIT),
  limit: z.literal(INTERVIEW_LIMIT),
}).strict();
export const ConversationResponseSchema = z.object({
  reply: z.string().trim().min(1).max(700),
  suggestions: z.array(z.object({ kind:z.enum(['skill','experience','education']), text:z.string().trim().min(1).max(240), evidence:z.string().trim().min(1).max(400) }).strict()).max(5),
  toolTrace: z.object({ selected:z.boolean(), functionName:z.string().nullable(), arguments:z.array(z.object({ kind:z.enum(['skill','experience','education']), text:z.string().trim().min(1).max(240), evidence:z.string().trim().min(1).max(400) }).strict()).max(5), dispatched:z.boolean(), outcome:z.enum(['no_tool_selected','pending_for_review','no_safe_items']) }).strict(),
  history: InterviewHistorySchema,
  interview: InterviewProgressSchema,
}).strict();
export const ConversationErrorSchema = z.object({
  error: z.object({
    code: z.enum(['INVALID_REQUEST', 'NOT_CONFIGURED', 'TIMEOUT', 'RATE_LIMITED', 'PROVIDER_ERROR', 'INVALID_RESPONSE']),
    message: z.string(),
    retryable: z.boolean(),
  }).strict(),
}).strict();
export type ConversationRequest = z.infer<typeof ConversationRequestSchema>;
export type ConversationResponse = z.infer<typeof ConversationResponseSchema>;
export type InterviewProgress = z.infer<typeof InterviewProgressSchema>;
