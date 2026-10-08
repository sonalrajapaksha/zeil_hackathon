"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { DEMO_JOBS } from "@/lib/jobs";
import { ApplicationErrorSchema, ApplicationPackageSchema, CLARIFICATION_REQUEST, ConversationErrorSchema, ConversationResponseSchema, CvImportErrorSchema, CvImportResponseSchema, type ApplicationPackage, type CandidateProfile, type ConversationMessage, type ConversationRequest } from "@/lib/contracts";
import { EMPTY_INTERVIEW, progress } from "@/lib/interview";
import { deleteSavedProfile, loadSavedProfile, saveProfile } from "@/lib/persistence";

type Step = "welcome" | "story" | "application";
type ClaimKind = "skill" | "experience" | "education";
type Claim = { id: string; kind: ClaimKind; text: string; evidence: string; confirmed: boolean };
function emptyProfile(): CandidateProfile {
  return { skills: [], experience: [], education: [], preferences: { largeText: false, highContrast: false, reducedMotion: false } };
}
function Mark({ small = false }: { small?: boolean }) {
  return <span className={`mark${small ? " mark-small" : ""}`} aria-hidden="true"><span /><span /><span /></span>;
}

export default function Home() {
  const [step, setStep] = useState<Step>("welcome");
  const [profile, setProfile] = useState<CandidateProfile>(emptyProfile);
  const [storageReady, setStorageReady] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"conversation" | "canvas">("conversation");
  const [chat, setChat] = useState<ConversationMessage[]>([]);
  const [interview, setInterview] = useState(EMPTY_INTERVIEW);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [failedRequest, setFailedRequest] = useState<ConversationRequest | null>(null);
  const [correctionId, setCorrectionId] = useState<string | null>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const activeCvImport = useRef<AbortController | null>(null);
  const skipNextPersist = useRef(false);
  const storageFailureReported = useRef(false);
  const messageInput = useRef<HTMLTextAreaElement>(null);
  const chatLog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatLog.current) chatLog.current.scrollTop = chatLog.current.scrollHeight;
  }, [chat]);
  useEffect(() => {
    const savedProfile = loadSavedProfile();
    if (savedProfile) setProfile(savedProfile);
    setStorageReady(true);
  }, []);
  useEffect(() => {
    if (!storageReady) return;
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    if (!saveProfile(profile) && !storageFailureReported.current) {
      storageFailureReported.current = true;
      setAnnouncement("Your browser could not save this profile. You can continue, but it may not be here next time.");
    }
  }, [profile, storageReady]);
  const [message, setMessage] = useState("");
  const claims = useMemo<Claim[]>(() => [
    ...profile.skills.map((item) => ({ id: item.id, kind: "skill" as const, text: item.name, evidence: item.evidence, confirmed: item.confirmed })),
    ...profile.experience.map((item) => ({ id: item.id, kind: "experience" as const, text: "text" in item ? item.text : [item.role, item.organisation].filter(Boolean).join(" · "), evidence: item.evidence.join(" · "), confirmed: item.confirmed })),
    ...profile.education.map((item) => ({ id: item.id, kind: "education" as const, text: item.text, evidence: item.evidence, confirmed: item.confirmed })),
  ], [profile]);
  const confirmed = useMemo(() => claims.filter((claim) => claim.confirmed), [claims]);
  const [skillDraft, setSkillDraft] = useState("");
  const [cvImportPending, setCvImportPending] = useState(false);
  const [cvImportError, setCvImportError] = useState("");
  const [selectedJob, setSelectedJob] = useState(DEMO_JOBS[0].id);
  const [cv, setCv] = useState("");
  const [letter, setLetter] = useState("");
  const [draftJobId, setDraftJobId] = useState<string | null>(null);
  const [unverifiedClaims, setUnverifiedClaims] = useState<string[]>([]);
  const [applicationPending, setApplicationPending] = useState(false);
  const [applicationError, setApplicationError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const selected = DEMO_JOBS.find((job) => job.id === selectedJob)!;

  async function requestTurn(request: ConversationRequest) {
    if (activeRequest.current) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    setPending(true); setError(""); setFailedRequest(null);
    setAnnouncement("Access is preparing a question.");
    const timeout = setTimeout(() => controller.abort(), 35_000);
    try {
      const response = await fetch("/api/conversation", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request), signal: controller.signal,
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const failure = ConversationErrorSchema.safeParse(body);
        throw new Error(failure.success ? failure.data.error.message : "The interview could not continue. Please retry.");
      }
      const parsed = ConversationResponseSchema.safeParse(body);
      if (!parsed.success) throw new Error("The AI returned an unusable response. Your story is unchanged. Please retry.");
      const result = parsed.data;
      if (activeRequest.current !== controller) return;
      setChat(result.history); setInterview(result.interview);
      if (request.action === "correct") {
        const remainingAnswers = new Map(result.history.filter((item) => item.role === "user").map((item) => [item.id, item.content]));
        const replacedAnswers = request.history.filter((item) => item.role === "user" && remainingAnswers.get(item.id) !== item.content).map((item) => item.content);
        if (replacedAnswers.length) setProfile((current) => ({
          ...current,
          skills: current.skills.filter((item) => item.confirmed || !replacedAnswers.some((answer) => answer.includes(item.evidence))),
          experience: current.experience.filter((item) => item.confirmed || !replacedAnswers.some((answer) => item.evidence.some((evidence) => answer.includes(evidence)))),
          education: current.education.filter((item) => item.confirmed || !replacedAnswers.some((answer) => answer.includes(item.evidence))),
        }));
      }
      if (result.suggestions.length) {
        const incoming = result.suggestions.map((suggestion) => ({ ...suggestion, id: crypto.randomUUID(), confirmed: false }));
        setProfile((current) => {
          const next = { ...current, skills: [...current.skills], experience: [...current.experience], education: [...current.education] };
          for (const item of incoming) {
            const currentClaims = [...next.skills.map((claim) => ({ kind: "skill", text: claim.name })), ...next.experience.map((claim) => ({ kind: "experience", text: "text" in claim ? claim.text : claim.role })), ...next.education.map((claim) => ({ kind: "education", text: claim.text }))];
            const duplicate = currentClaims.some((claim) => claim.kind === item.kind && claim.text.toLocaleLowerCase() === item.text.toLocaleLowerCase());
            if (duplicate) continue;
            if (item.kind === "skill") next.skills.push({ id: item.id, name: item.text, evidence: item.evidence, confirmed: false });
            else if (item.kind === "experience") next.experience.push({ id: item.id, text: item.text, evidence: [item.evidence], confirmed: false });
            else next.education.push({ id: item.id, text: item.text, evidence: item.evidence, confirmed: false });
          }
          return next;
        });
      }
      if (request.action !== "clarify") setMessage("");
      setCorrectionId(null);
      setAnnouncement(result.interview.status === "ended" ? "Interview ended. Your history is available for review." : result.toolTrace.selected ? `Gemini selected the profile update tool. ${result.toolTrace.arguments.length} validated suggestion${result.toolTrace.arguments.length === 1 ? " is" : "s are"} ready for your review.` : result.suggestions.length ? `A new AI question and ${result.suggestions.length} profile suggestion${result.suggestions.length === 1 ? "" : "s"} to review are ready.` : "A new AI question is ready.");
      messageInput.current?.focus();
    } catch (failure) {
      if (activeRequest.current !== controller) return;
      const text = controller.signal.aborted ? "The request took too long. Your story and answer are saved here. Please retry." : failure instanceof Error ? failure.message : "Could not reach the AI. Please retry.";
      setError(text); setFailedRequest(request); setAnnouncement(text);
    } finally {
      clearTimeout(timeout);
      if (activeRequest.current === controller) {
        activeRequest.current = null; setPending(false);
      }
    }
  }

  function begin() {
    const questionStyle = profile.preferences.questionStyle;
    if (!questionStyle) {
      setAnnouncement("Choose simple or standard question wording before you begin.");
      document.getElementById("question-style-simple")?.focus();
      return;
    }
    setStep("story");
    if (!chat.length && !activeRequest.current) void requestTurn({ action: "start", history: [], questionStyle });
  }

  function startNewInterview() {
    const questionStyle = profile.preferences.questionStyle;
    if (questionStyle) void requestTurn({ action: "start", history: [], questionStyle });
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const questionStyle = profile.preferences.questionStyle;
    if (!questionStyle || !message.trim() || pending || interview.status === "ended") return;
    void requestTurn(correctionId
      ? { action: "correct", history: chat, messageId: correctionId, answer: message.trim(), questionStyle }
      : { action: "answer", history: chat, answer: message.trim(), questionStyle });
  }

  function endInterview() {
    activeRequest.current?.abort(); activeRequest.current = null;
    setPending(false); setError(""); setFailedRequest(null); setCorrectionId(null);
    setInterview(progress(chat, true));
    setAnnouncement("Interview ended. Your conversation and unsent text remain here for review.");
  }

  function updateClaim(kind: ClaimKind, id: string, text: string) {
    setProfile((current) => {
      if (kind === "skill") return { ...current, skills: current.skills.map((item) => item.id === id ? { ...item, name: text } : item) };
      if (kind === "education") return { ...current, education: current.education.map((item) => item.id === id ? { ...item, text } : item) };
      return { ...current, experience: current.experience.map((item) => item.id !== id ? item : "text" in item ? { ...item, text } : { ...item, role: text }) };
    });
  }

  function confirmClaim(kind: ClaimKind, id: string) {
    setProfile((current) => {
      if (kind === "skill") return { ...current, skills: current.skills.map((item) => item.id === id ? { ...item, confirmed: true } : item) };
      if (kind === "education") return { ...current, education: current.education.map((item) => item.id === id ? { ...item, confirmed: true } : item) };
      return { ...current, experience: current.experience.map((item) => item.id === id ? { ...item, confirmed: true } : item) };
    });
    setAnnouncement("Suggestion confirmed and added to your profile.");
  }

  function removeClaim(kind: ClaimKind, id: string) {
    setProfile((current) => ({
      ...current,
      ...(kind === "skill" ? { skills: current.skills.filter((item) => item.id !== id) } : {}),
      ...(kind === "experience" ? { experience: current.experience.filter((item) => item.id !== id) } : {}),
      ...(kind === "education" ? { education: current.education.filter((item) => item.id !== id) } : {}),
    }));
  }

  function setPreference(name: keyof CandidateProfile["preferences"], checked: boolean) {
    setProfile((current) => ({ ...current, preferences: { ...current.preferences, [name]: checked } }));
  }

  function setQuestionStyle(questionStyle: "simple" | "standard") {
    setProfile((current) => ({ ...current, preferences: { ...current.preferences, questionStyle } }));
  }

  function navigateTo(nextStep: Step) {
    if (nextStep === "story") {
      begin();
      if (chat.length) setAnnouncement("Your story and career canvas are ready.");
      return;
    }
    setStep(nextStep);
    setAnnouncement(nextStep === "welcome" ? "Welcome. Choose how you want questions and display to work." : "Choose a fictional role and review your application draft.");
  }

  function clarifyQuestion() {
    const questionStyle = profile.preferences.questionStyle;
    if (!questionStyle || pending || !chat.length || chat.at(-1)?.role !== "assistant" || chat.at(-2)?.content === CLARIFICATION_REQUEST) return;
    void requestTurn({ action: "clarify", history: chat, questionStyle });
  }

  function addSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = skillDraft.trim();
    if (!text) return;
    setProfile((current) => ({ ...current, skills: [...current.skills, { id: crypto.randomUUID(), name: text, evidence: "Added by you", confirmed: true }] }));
    setSkillDraft("");
    setAnnouncement(`${text} added to your confirmed experience.`);
  }

  async function generateDraft() {
    if (applicationPending) return;
    setApplicationPending(true);
    setApplicationError("");
    setAnnouncement("Preparing an application from your confirmed work-related details.");
    try {
      const response = await fetch("/api/application", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, jobId: selectedJob }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const failure = ApplicationErrorSchema.safeParse(body);
        throw new Error(failure.success ? failure.data.error.message : "The application could not be prepared. Your current draft is unchanged. Please retry.");
      }
      const parsed = ApplicationPackageSchema.safeParse(body);
      if (!parsed.success) throw new Error("The AI returned an unusable draft. Your current draft is unchanged. Please retry.");
      const result: ApplicationPackage = parsed.data;
      setCv(result.cvText); setLetter(result.coverLetter); setDraftJobId(result.jobId); setUnverifiedClaims(result.unverifiedClaims);
      setAnnouncement("Your editable application draft is ready. Review and change every detail before using it.");
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : "Could not reach the AI. Your current draft is unchanged. Please retry.";
      setApplicationError(message); setAnnouncement(message);
    } finally {
      setApplicationPending(false);
    }
  }

  async function importCv(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = form.querySelector<HTMLInputElement>("#cv-file");
    if (!file?.files?.[0]) return;
    const selectedFile = file.files[0];
    if (selectedFile.type !== "application/pdf" || selectedFile.size > 5 * 1024 * 1024) {
      setCvImportError("Choose a PDF no larger than 5 MB. You can also enter your experience by text.");
      return;
    }
    setCvImportPending(true); setCvImportError("");
    const controller = new AbortController(); activeCvImport.current = controller;
    setAnnouncement("Sending your PDF to Gemini for native reading. It is not saved by Access.");
    try {
      const data = new FormData(); data.set("file", selectedFile);
      const response = await fetch("/api/cv-import", { method: "POST", body: data, signal: controller.signal });
      const body: unknown = await response.json();
      if (activeCvImport.current !== controller) return;
      if (!response.ok) {
        const failure = CvImportErrorSchema.safeParse(body);
        throw new Error(failure.success ? failure.data.error.message : "The PDF could not be read. Your profile is unchanged.");
      }
      const parsed = CvImportResponseSchema.safeParse(body);
      if (!parsed.success) throw new Error("Gemini returned an unusable result. Your profile is unchanged.");
      const suggestions = parsed.data.suggestions;
      setProfile((current) => {
        const next = { ...current, skills: [...current.skills], experience: [...current.experience], education: [...current.education] };
        for (const suggestion of suggestions) {
          const text = suggestion.text.trim();
          const existing = [...next.skills.map((item) => ({ kind: "skill", text: item.name })), ...next.experience.map((item) => ({ kind: "experience", text: "text" in item ? item.text : item.role })), ...next.education.map((item) => ({ kind: "education", text: item.text }))];
          if (existing.some((item) => item.kind === suggestion.kind && item.text.toLocaleLowerCase() === text.toLocaleLowerCase())) continue;
          const id = crypto.randomUUID();
          if (suggestion.kind === "skill") next.skills.push({ id, name: text, evidence: suggestion.evidence, confirmed: false });
          else if (suggestion.kind === "experience") next.experience.push({ id, text, evidence: [suggestion.evidence], confirmed: false });
          else next.education.push({ id, text, evidence: suggestion.evidence, confirmed: false });
        }
        return next;
      });
      setAnnouncement(suggestions.length ? `${suggestions.length} CV suggestion${suggestions.length === 1 ? " is" : "s are"} ready for your review. Nothing was confirmed.` : "The PDF was read, but no work-related suggestions were found.");
      form.reset();
    } catch (failure) {
      if (activeCvImport.current !== controller) return;
      const message = failure instanceof Error ? failure.message : "The PDF could not be read. Your profile is unchanged.";
      setCvImportError(message); setAnnouncement(message);
    } finally { if (activeCvImport.current === controller) { activeCvImport.current = null; setCvImportPending(false); } }
  }

  function downloadText(text: string, filename: string, label: string) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setAnnouncement(`${label} downloaded as ${filename}.`);
  }

  function reset() {
    deleteSavedProfile();
    skipNextPersist.current = true;
    activeRequest.current?.abort(); activeRequest.current = null;
    activeCvImport.current?.abort(); activeCvImport.current = null; setCvImportPending(false); setCvImportError("");
    setPending(false); setError(""); setFailedRequest(null); setCorrectionId(null); setInterview(EMPTY_INTERVIEW);
    setStep("welcome"); setChat([]); setProfile(emptyProfile()); setSelectedJob(DEMO_JOBS[0].id); setMessage(""); setSkillDraft(""); setMobilePanel("conversation"); setCv(""); setLetter(""); setDraftJobId(null); setUnverifiedClaims([]); setApplicationError(""); setAnnouncement("Your session has been reset.");
  }

  return (
    <main className={`app${profile.preferences.largeText ? " large-text" : ""}${profile.preferences.highContrast ? " high-contrast" : ""}${profile.preferences.reducedMotion ? " reduced-motion" : ""}`}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="topbar" id="top">
        <a className="brand" href="#top" aria-label="Access home"><Mark /><span>access</span></a>
        <p className="top-note">A little more room to tell your story.</p>
        <div className="top-actions">
          <button className="text-button reset-button" onClick={reset}>Reset &amp; delete</button>
          <details className="preferences">
            <summary aria-label="Communication and display preferences"><span className="settings-glyph" aria-hidden="true">Aa</span><span className="pref-label">Preferences</span></summary>
            <div className="pref-menu">
              <fieldset className="question-style question-style-menu"><legend>Question wording</legend>
                <label className={profile.preferences.questionStyle === "simple" ? "is-selected" : ""}><input type="radio" name="question-style-menu" value="simple" checked={profile.preferences.questionStyle === "simple"} onChange={() => setQuestionStyle("simple")} /> Simple</label>
                <label className={profile.preferences.questionStyle === "standard" ? "is-selected" : ""}><input type="radio" name="question-style-menu" value="standard" checked={profile.preferences.questionStyle === "standard"} onChange={() => setQuestionStyle("standard")} /> Standard</label>
              </fieldset>
              <label><input type="checkbox" checked={profile.preferences.largeText} onChange={(event) => setPreference("largeText", event.target.checked)} /> Larger text</label>
              <label><input type="checkbox" checked={profile.preferences.highContrast} onChange={(event) => setPreference("highContrast", event.target.checked)} /> Higher contrast</label>
              <label><input type="checkbox" checked={profile.preferences.reducedMotion} onChange={(event) => setPreference("reducedMotion", event.target.checked)} /> Reduce motion</label>
              <p>Saved on this device with your confirmed profile.</p>
            </div>
          </details>
        </div>
      </header>

      <nav className="journey" aria-label="Your progress">
        {[{ id: "welcome", name: "Start" }, { id: "story", name: "Your story" }, { id: "application", name: "Your draft" }].map((item, index) => (
          <button key={item.id} className={`journey-step${step === item.id ? " is-current" : ""}${(step === "application" || step === "story" && index === 0) && index < ["welcome", "story", "application"].indexOf(step) ? " is-done" : ""}`} onClick={() => navigateTo(item.id as Step)} aria-current={step === item.id ? "step" : undefined}>
            <span className="step-dot" aria-hidden="true">{index + 1}</span><span>{item.name}</span>
          </button>
        ))}
      </nav>

      <div id="main-content" tabIndex={-1}>
        {step === "welcome" && <section className="welcome" aria-labelledby="welcome-heading">
          <div className="welcome-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> YOUR NEXT CHAPTER, ON YOUR TERMS</p>
            <h1 id="welcome-heading">Your experience<br />is <span>more than</span><br />a résumé.</h1>
            <p className="welcome-intro">Accessibility-first career support for everyone. Tell your story by text, choose how we word questions, then shape an application that sounds like you.</p>
            <p className="welcome-friction">Instead of repeating your work history across long application forms, describe it once, review each detail, and reuse only what you confirm in an editable draft.</p>
            <fieldset className="question-style welcome-style" aria-describedby="question-style-help"><legend>How should we ask questions?</legend>
              <div className="question-style-choice">
                <label className={profile.preferences.questionStyle === "simple" ? "is-selected" : ""}><input id="question-style-simple" type="radio" name="question-style-welcome" value="simple" checked={profile.preferences.questionStyle === "simple"} onChange={() => setQuestionStyle("simple")} /><span><strong>Simple</strong><small>Short sentences, familiar words</small></span></label>
                <label className={profile.preferences.questionStyle === "standard" ? "is-selected" : ""}><input id="question-style-standard" type="radio" name="question-style-welcome" value="standard" checked={profile.preferences.questionStyle === "standard"} onChange={() => setQuestionStyle("standard")} /><span><strong>Standard</strong><small>Clear, natural conversation</small></span></label>
              </div>
              <p id="question-style-help">Choose one to begin. You can change this preference at any time.</p>
            </fieldset>
            <button className="button button-primary button-large" onClick={begin} disabled={!profile.preferences.questionStyle}>Start your interview <span aria-hidden="true">↗</span></button>
            <p className="sample-note"><span className="sample-dot" /> Text interview · you control what you share</p>
          </div>
          <div className="welcome-art" aria-label="Illustration of a growing career story">
            <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
            <div className="art-note note-top"><span className="note-spark" aria-hidden="true">✳</span><span>what you bring</span></div>
            <div className="art-center"><span className="art-flower" aria-hidden="true"><i /><i /><i /><i /><i /><b /></span><span className="art-center-label">your story,<br />taking shape</span></div>
            <div className="art-note note-bottom"><span className="note-check" aria-hidden="true">✓</span><span>on your terms</span></div>
            <span className="art-caption">A different way<br />to begin.</span>
          </div>
          <div className="welcome-footer"><div><span className="footer-icon">01</span><span>Start with what you’ve done</span></div><div><span className="footer-icon">02</span><span>Review every suggestion</span></div><div><span className="footer-icon">03</span><span>Keep the final say</span></div></div>
          <aside className="privacy-note"><span aria-hidden="true">◌</span><p><strong>Your story stays yours.</strong> Your interview text is sent to Google Gemini to generate questions. Access saves confirmed profile details, their short source evidence, and your chosen preferences on this device. Full conversation history and unapproved suggestions stay in memory only. Reset &amp; delete removes saved details. Nothing is sent to an employer.</p></aside>
        </section>}

        {step === "story" && <section className="workspace" aria-labelledby="story-heading">
          <div className="workspace-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> YOUR STORY</p><h1 id="story-heading">Let’s start with what you know.</h1><p>Write the way you’d tell a friend. We’ll help you find the words for your experience.</p></div><span className="demo-tag"><span /> Gemini interview</span></div>
          <div className="mobile-switch" role="group" aria-label="Workspace panel"><button aria-pressed={mobilePanel === "conversation"} onClick={() => setMobilePanel("conversation")}>Conversation</button><button aria-pressed={mobilePanel === "canvas"} onClick={() => setMobilePanel("canvas")}>Career canvas <span className="count-pill">{claims.length}</span></button></div>
          <div className="workspace-grid">
            <section className={`conversation-pane${mobilePanel === "canvas" ? " mobile-hidden" : ""}`} aria-labelledby="conversation-heading">
              <div className="pane-heading"><div><h2 id="conversation-heading">In your words</h2></div></div>
              <div ref={chatLog} className="chat-log" role="region" tabIndex={0} aria-label="Conversation history" aria-busy={pending}>
                {chat.map((line) => <div key={line.id} className={`chat-line ${line.role === "user" ? "you" : "access"}`}><div className="avatar" aria-hidden="true">{line.role === "user" ? (profile.name?.[0] || "Y") : <Mark small />}</div><div><span className="speaker">{line.role === "user" ? "You" : "Access · Gemini"}</span><p>{line.content === CLARIFICATION_REQUEST ? "Could you clarify this question?" : line.content}</p>{line.role === "user" && !["[Question skipped by candidate]", CLARIFICATION_REQUEST].includes(line.content) && <button className="text-button" disabled={pending || interview.status === "ended"} onClick={() => { setCorrectionId(line.id); setMessage(line.content); setError(""); setFailedRequest(null); messageInput.current?.focus(); }}>Correct this answer</button>}</div></div>)}
              </div>
              <p className="interview-status" role="status">{pending ? "Access is preparing a question…" : interview.status === "ended" ? "Interview ended. Your history is available above." : chat.length ? `Question ${interview.questions} of up to ${interview.limit} · ${interview.answered} answered` : "Start the interview to receive your first question."}</p>
              {error && <div className="interview-error"><p id="interview-error" role="alert">{error}</p><button className="button button-dark" disabled={pending || !failedRequest} onClick={() => failedRequest && void requestTurn(failedRequest)}>Retry</button></div>}
              {!chat.length && !pending && !error && interview.status !== "ended" && <button className="button button-primary" disabled={!profile.preferences.questionStyle} onClick={begin}>Start interview</button>}
              <form className="message-form" onSubmit={sendMessage}><label htmlFor="message">{correctionId ? "Correct your answer" : "Add to your story"}</label>{correctionId && <p id="correction-help">Updating this answer replaces the questions and answers that came after it.</p>}<textarea ref={messageInput} id="message" value={message} onChange={(event) => { setMessage(event.target.value); setError(""); setFailedRequest(null); }} placeholder="Tell us about something you’ve done." rows={3} maxLength={4000} readOnly={pending} aria-invalid={!!error} aria-describedby={error ? "interview-error" : correctionId ? "correction-help" : undefined} /><div className="form-bottom"><span>Share only what you’re comfortable sharing.</span><button className="button button-primary" type="submit" disabled={pending || !message.trim() || !chat.length || interview.status === "ended"}>{pending ? "Please wait…" : correctionId ? "Save correction" : "Send answer"} <span aria-hidden="true">↑</span></button></div></form>
              <div className="prompt-row">
                {interview.status !== "ended" ? <><button className="text-button" disabled={pending || !chat.length || !!correctionId} onClick={() => void requestTurn({ action: "skip", history: chat, questionStyle: profile.preferences.questionStyle! })}>Skip question</button><button className="text-button" disabled={pending || !chat.length || !!correctionId || chat.at(-1)?.role !== "assistant" || chat.at(-2)?.content === CLARIFICATION_REQUEST} onClick={clarifyQuestion}>Clarify question</button><button className="text-button" onClick={endInterview}>End interview</button></> : <button className="text-button" disabled={pending || !profile.preferences.questionStyle} onClick={startNewInterview}>Start a new interview</button>}
                {correctionId && <button className="text-button" disabled={pending} onClick={() => { setCorrectionId(null); setMessage(""); setError(""); setFailedRequest(null); }}>Cancel correction</button>}
              </div>
            </section>

            <section className={`canvas-pane${mobilePanel === "conversation" ? " mobile-hidden" : ""}`} aria-labelledby="canvas-heading">
              <div className="pane-heading canvas-title"><div><div><h2 id="canvas-heading">Career canvas</h2><p>A living draft of what you bring.</p></div></div></div>
              <div className="candidate-line"><span className="candidate-avatar" aria-hidden="true">{profile.name?.slice(0, 1).toUpperCase()}</span><span><label className="sr-only" htmlFor="candidate-name">Candidate name</label><input className="candidate-name" id="candidate-name" placeholder="Your name" value={profile.name ?? ""} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} /><small>Your name · optional</small></span><span className="edit-name">Editable</span></div>
              <form className="cv-import" onSubmit={importCv} aria-busy={cvImportPending}>
                <label htmlFor="cv-file">Optional: read a sample CV PDF</label>
                <p>Gemini reads the PDF itself. Access does not save the file. Review every suggestion before approving it. This is an optional input method; you can continue by text.</p>
                <div><input id="cv-file" name="cv-file" type="file" accept="application/pdf,.pdf" aria-describedby={cvImportError ? "cv-import-error" : "cv-import-help"} disabled={cvImportPending} /><button className="button button-dark" type="submit" disabled={cvImportPending}>{cvImportPending ? "Reading PDF…" : "Read PDF"}</button></div>
                <small id="cv-import-help">PDF only · 5 MB maximum · sent to Google Gemini for processing</small>
                {cvImportError && <p id="cv-import-error" className="cv-import-error" role="alert">{cvImportError}</p>}
              </form>
              <div className="section-label"><span>Profile suggestions</span><span>{confirmed.length} confirmed · {claims.length - confirmed.length} to review</span></div>
              <ul className="note-list">
                {!claims.length && <li>Add something yourself or continue your interview to see grounded suggestions here.</li>}
                {claims.map((claim) => <li key={`${claim.kind}-${claim.id}`} className={`note-item ${claim.confirmed ? "confirmed" : "pending"}`}>
                  <span className="note-status" aria-label={claim.confirmed ? "Confirmed" : "Needs your review"}>{claim.confirmed ? "✓" : "· · ·"}</span>
                  <div className="claim-content"><span className="claim-kind">{claim.kind}</span><label className="sr-only" htmlFor={`note-${claim.id}`}>{claim.confirmed ? "Confirmed" : "Suggested"} {claim.kind}</label><input id={`note-${claim.id}`} value={claim.text} onChange={(event) => updateClaim(claim.kind, claim.id, event.target.value)} /><p className="claim-evidence"><strong>From your answer:</strong> “{claim.evidence}”</p></div>
                  {!claim.confirmed ? <div className="note-actions"><button className="icon-action accept" onClick={() => confirmClaim(claim.kind, claim.id)}>Approve</button><button className="icon-action" onClick={() => removeClaim(claim.kind, claim.id)}>Remove</button></div> : <span className="confirmed-label">Confirmed</span>}
                </li>)}
              </ul>
              <form className="add-skill" onSubmit={addSkill}><label htmlFor="skill">Add something yourself</label><div><input id="skill" value={skillDraft} onChange={(event) => setSkillDraft(event.target.value)} placeholder="A skill or experience" /><button className="add-button" disabled={!skillDraft.trim()} aria-label="Add confirmed experience">+</button></div></form>
              <div className="canvas-footnote"><span aria-hidden="true">↳</span> Nothing is included in your draft until you confirm it.</div>
              <button className="button button-dark continue-button" onClick={() => { setStep("application"); setAnnouncement("Choose a fictional role to prepare your draft."); }}>Choose a role <span aria-hidden="true">→</span></button>
            </section>
          </div>
          <p className="demo-disclaimer">Interview questions and application drafts are generated by Gemini. Drafts use only confirmed work-related details that pass sensitive-information screening.</p>
        </section>}

        {step === "application" && <section className="application" aria-labelledby="application-heading">
          <div className="application-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> YOUR NEXT STEP</p><h1 id="application-heading">A draft you can make your own.</h1><p>Choose a fictional role. We’ll shape a starting point from the details you’ve confirmed.</p></div><span className="demo-tag"><span /> Fictional roles</span></div>
          <div className="job-layout"><section className="job-column" aria-labelledby="jobs-heading"><div className="section-title-row"><h2 id="jobs-heading">Choose a role</h2><span>3 sample listings</span></div><div className="job-list">{DEMO_JOBS.map((job, index) => <button key={job.id} className={`job-option${selectedJob === job.id ? " selected" : ""}`} aria-pressed={selectedJob === job.id} onClick={() => { setSelectedJob(job.id); setApplicationError(""); }}><span className={`job-symbol job-symbol-${index}`} aria-hidden="true">{["↗", "⌁", "＋"][index]}</span><span className="job-main"><strong>{job.title}</strong><span>{job.company} · {job.location}</span><small>{job.arrangement} <i>·</i> Fictional listing</small></span><span className="job-radio" aria-hidden="true">{selectedJob === job.id ? "✓" : ""}</span></button>)}</div><div className="job-description"><span className="small-label">ROLE SNAPSHOT</span><h3>{selected.title}</h3><p>{selected.description}</p><ul>{selected.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul></div><button className="button button-primary generate-button" onClick={generateDraft} disabled={applicationPending}>{applicationPending ? "Preparing your draft…" : "Prepare application draft"} <span aria-hidden="true">↗</span></button><p className="no-submit"><span aria-hidden="true">◎</span> This only prepares a draft. It never applies or contacts an employer.</p>{applicationError && <div className="application-error" role="alert"><p>{applicationError}</p><button className="text-button" onClick={generateDraft} disabled={applicationPending}>Retry draft</button></div>}</section>
            <section className="draft-column" aria-labelledby="draft-heading" aria-busy={applicationPending}><div className="draft-header"><div><span className="pane-index">C</span><div><h2 id="draft-heading">Your application draft</h2><p>{cv ? draftJobId === selectedJob ? "Ready for your review" : `Current draft: ${DEMO_JOBS.find((job) => job.id === draftJobId)?.title ?? "previous role"}` : "Your preview will appear here"}</p></div></div>{cv && <span className="draft-status"><i /> EDITABLE</span>}</div>{applicationPending && <p className="application-progress" role="status">Preparing your draft. Your existing text stays available while this runs.</p>}{cv ? <><div className="draft-editors"><div className="editor-block"><label htmlFor="cv-text">Curriculum vitae</label><textarea id="cv-text" value={cv} onChange={(event) => setCv(event.target.value)} rows={13} /></div><div className="editor-block"><label htmlFor="letter-text">Cover letter</label><textarea id="letter-text" value={letter} onChange={(event) => setLetter(event.target.value)} rows={12} /></div></div>{unverifiedClaims.length > 0 && <aside className="unverified-note" aria-labelledby="unverified-heading"><h3 id="unverified-heading">Details to check</h3><p>These details were uncertain, so Access left them out of your draft:</p><ul>{unverifiedClaims.map((claim, index) => <li key={`${index}-${claim}`}>{claim}</li>)}</ul></aside>}<div className="draft-actions"><p>Made from confirmed, work-related details. Read it through and change anything you like.</p><div className="export-actions"><button className="button button-dark" onClick={() => downloadText(cv, `access-${draftJobId ?? selected.id}-cv.txt`, "Your CV")}>Download CV (.txt) <span aria-hidden="true">↓</span></button><button className="button button-dark" onClick={() => downloadText(letter, `access-${draftJobId ?? selected.id}-cover-letter.txt`, "Your cover letter")}>Download cover letter (.txt) <span aria-hidden="true">↓</span></button></div></div></> : <div className="empty-draft"><div className="empty-mark" aria-hidden="true"><span>✳</span><i /><b /></div><h3>Your story will come through here.</h3><p>Prepare an application draft from the work-related details you have confirmed. You can edit every word before you download it.</p><span className="empty-rule" /></div>}</section></div>
          <button className="back-link" onClick={() => setStep("story")}>← Back to your story</button>
        </section>}
      </div>

      <footer className="site-footer"><span><Mark small /> ACCESS <span className="footer-separator">·</span> YOUR STORY, YOUR WAY</span><span>Independent prototype · Not an official ZEIL product</span></footer>
      <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
    </main>
  );
}
