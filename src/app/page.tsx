"use client";

import { FormEvent, useMemo, useState } from "react";
import { DEMO_JOBS } from "@/lib/jobs";

type Step = "welcome" | "story" | "application";
type Note = { id: number; text: string; status: "pending" | "confirmed" };
type ChatLine = { from: "you" | "access"; text: string };

const initialChat: ChatLine[] = [
  { from: "you", text: "I volunteer at the Glenfield community library on Saturdays. I help visitors find books and keep the children's area organised." },
  { from: "access", text: "That sounds like a lot of thoughtful, practical work. What do you enjoy most about helping visitors?" },
];

function Mark({ small = false }: { small?: boolean }) {
  return <span className={`mark${small ? " mark-small" : ""}`} aria-hidden="true"><span /><span /><span /></span>;
}

export default function Home() {
  const [step, setStep] = useState<Step>("welcome");
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"conversation" | "canvas">("conversation");
  const [chat, setChat] = useState(initialChat);
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState<Note[]>([
    { id: 1, text: "Volunteering at Glenfield Community Library on Saturdays", status: "pending" },
    { id: 2, text: "Welcoming visitors and helping them find what they need", status: "pending" },
    { id: 3, text: "Keeping a shared space organised", status: "pending" },
  ]);
  const [skillDraft, setSkillDraft] = useState("");
  const [candidateName, setCandidateName] = useState("Maya Chen");
  const [selectedJob, setSelectedJob] = useState(DEMO_JOBS[0].id);
  const [cv, setCv] = useState("");
  const [letter, setLetter] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const selected = DEMO_JOBS.find((job) => job.id === selectedJob)!;
  const confirmed = useMemo(() => notes.filter((note) => note.status === "confirmed"), [notes]);

  function begin() {
    setStep("story");
    setAnnouncement("Your story workspace is ready. Three ideas from the sample story need your review.");
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = message.trim();
    if (!value) return;
    setChat((lines) => [...lines, { from: "you", text: value }, { from: "access", text: "Thanks for sharing that. I’ve noted a possible strength below. Please review it and change anything that doesn’t sound like you." }]);
    setNotes((items) => items.some((item) => item.text.toLowerCase().includes("communicating with visitors")) ? items : [...items, { id: Date.now(), text: "Communicating with visitors in a helpful way", status: "pending" }]);
    setMessage("");
    setAnnouncement("Demo response added. A new suggestion is ready for review.");
  }

  function updateNote(id: number, change: Partial<Note>) {
    setNotes((items) => items.map((item) => item.id === id ? { ...item, ...change } : item));
  }

  function addSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = skillDraft.trim();
    if (!text) return;
    setNotes((items) => [...items, { id: Date.now(), text, status: "confirmed" }]);
    setSkillDraft("");
    setAnnouncement(`${text} added to your confirmed experience.`);
  }

  function generateDraft() {
    const evidence = confirmed.map((item) => `• ${item.text}`).join("\n");
    const confirmedSection = confirmed.length ? `\n\nCONFIRMED EXPERIENCE & STRENGTHS\n${evidence}` : "\n\nNo experience details have been confirmed yet. Add or confirm details in your career canvas to include them here.";
    setCv(`${candidateName}\n\nAPPLICATION PROFILE${confirmedSection}`);
    setLetter(`Kia ora ${selected.company} team,\n\nI’m interested in the ${selected.title} role.${confirmed.length ? ` Details I’ve confirmed about my experience include: ${confirmed.map((item) => item.text).join("; ")}.` : " I’m preparing my application and will add my relevant experience after reviewing my career canvas."}\n\nThank you for considering my application.\n\nNgā mihi,\n${candidateName}`);
    setAnnouncement("A demo draft is ready. It uses confirmed details and is yours to edit.");
  }

  function downloadDraft() {
    const blob = new Blob([`CURRICULUM VITAE\n\n${cv}\n\nCOVER LETTER\n\n${letter}\n\nDraft for ${selected.title} at ${selected.company}. Please review before use.`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "maya-chen-application-draft.txt";
    link.click();
    URL.revokeObjectURL(url);
    setAnnouncement("Your application draft has been downloaded.");
  }

  function reset() {
    setStep("welcome"); setChat(initialChat); setCandidateName("Maya Chen"); setSelectedJob(DEMO_JOBS[0].id); setMessage(""); setSkillDraft(""); setMobilePanel("conversation"); setNotes([
      { id: 1, text: "Volunteering at Glenfield Community Library on Saturdays", status: "pending" },
      { id: 2, text: "Welcoming visitors and helping them find what they need", status: "pending" },
      { id: 3, text: "Keeping a shared space organised", status: "pending" },
    ]); setCv(""); setLetter(""); setAnnouncement("Your demo session has been reset.");
  }

  return (
    <main className={`app${largeText ? " large-text" : ""}${highContrast ? " high-contrast" : ""}${reducedMotion ? " reduced-motion" : ""}`}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="topbar" id="top">
        <a className="brand" href="#top" aria-label="Access home"><Mark /><span>access</span></a>
        <p className="top-note">A little more room to tell your story.</p>
        <div className="top-actions">
          {step !== "welcome" && <button className="text-button reset-button" onClick={reset}>Reset demo</button>}
          <details className="preferences">
            <summary aria-label="Display preferences"><span className="settings-glyph" aria-hidden="true">Aa</span><span className="pref-label">Display</span></summary>
            <div className="pref-menu">
              <label><input type="checkbox" checked={largeText} onChange={(event) => setLargeText(event.target.checked)} /> Larger text</label>
              <label><input type="checkbox" checked={highContrast} onChange={(event) => setHighContrast(event.target.checked)} /> Higher contrast</label>
              <label><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} /> Reduce motion</label>
              <p>These preferences apply to this page only.</p>
            </div>
          </details>
        </div>
      </header>

      <nav className="journey" aria-label="Your progress">
        {[{ id: "welcome", name: "Start" }, { id: "story", name: "Your story" }, { id: "application", name: "Your draft" }].map((item, index) => (
          <button key={item.id} className={`journey-step${step === item.id ? " is-current" : ""}${(step === "application" || step === "story" && index === 0) && index < ["welcome", "story", "application"].indexOf(step) ? " is-done" : ""}`} onClick={() => item.id === "welcome" ? setStep("welcome") : item.id === "story" ? setStep("story") : setStep("application")} aria-current={step === item.id ? "step" : undefined}>
            <span className="step-dot" aria-hidden="true">{index + 1}</span><span>{item.name}</span>
          </button>
        ))}
      </nav>

      <div id="main-content" tabIndex={-1}>
        {step === "welcome" && <section className="welcome" aria-labelledby="welcome-heading">
          <div className="welcome-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> YOUR NEXT CHAPTER, ON YOUR TERMS</p>
            <h1 id="welcome-heading">Your experience<br />is <span>more than</span><br />a résumé.</h1>
            <p className="welcome-intro">A conversation can make room for the things a form leaves out. Tell your story in your own words, then shape it into an application that sounds like you.</p>
            <button className="button button-primary button-large" onClick={begin}>Start with a sample story <span aria-hidden="true">↗</span></button>
            <p className="sample-note"><span className="sample-dot" /> Sample candidate · fictional details</p>
          </div>
          <div className="welcome-art" aria-label="Illustration of a growing career story">
            <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
            <div className="art-note note-top"><span className="note-spark" aria-hidden="true">✳</span><span>what you bring</span></div>
            <div className="art-center"><span className="art-flower" aria-hidden="true"><i /><i /><i /><i /><i /><b /></span><span className="art-center-label">your story,<br />taking shape</span></div>
            <div className="art-note note-bottom"><span className="note-check" aria-hidden="true">✓</span><span>on your terms</span></div>
            <span className="art-caption">A different way<br />to begin.</span>
          </div>
          <div className="welcome-footer"><div><span className="footer-icon">01</span><span>Start with what you’ve done</span></div><div><span className="footer-icon">02</span><span>Review every suggestion</span></div><div><span className="footer-icon">03</span><span>Keep the final say</span></div></div>
          <aside className="privacy-note"><span aria-hidden="true">◌</span><p><strong>Your story stays yours.</strong> This demo uses prepared sample content. In a finished version, AI suggestions are only drafts for you to review. Nothing is sent to an employer.</p></aside>
        </section>}

        {step === "story" && <section className="workspace" aria-labelledby="story-heading">
          <div className="workspace-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> YOUR STORY</p><h1 id="story-heading">Let’s start with what you know.</h1><p>Write the way you’d tell a friend. We’ll help you find the words for your experience.</p></div><span className="demo-tag"><span /> Prepared demo</span></div>
          <div className="mobile-switch" role="group" aria-label="Workspace panel"><button aria-pressed={mobilePanel === "conversation"} onClick={() => setMobilePanel("conversation")}>Conversation</button><button aria-pressed={mobilePanel === "canvas"} onClick={() => setMobilePanel("canvas")}>Career canvas <span className="count-pill">{notes.length}</span></button></div>
          <div className="workspace-grid">
            <section className={`conversation-pane${mobilePanel === "canvas" ? " mobile-hidden" : ""}`} aria-labelledby="conversation-heading">
              <div className="pane-heading"><div><span className="pane-index">A</span><h2 id="conversation-heading">In your words</h2></div><span className="small-label">SAMPLE CONVERSATION</span></div>
              <div className="chat-log" aria-label="Conversation">
                {chat.map((line, index) => <div key={index} className={`chat-line ${line.from}`}><div className="avatar" aria-hidden="true">{line.from === "you" ? "M" : <Mark small />}</div><div><span className="speaker">{line.from === "you" ? "Maya" : "Access · demo response"}</span><p>{line.text}</p></div></div>)}
              </div>
              <form className="message-form" onSubmit={sendMessage}><label htmlFor="message">Add to your story</label><textarea id="message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="For example, what do you enjoy about volunteering?" rows={3} /><div className="form-bottom"><span>Share only what you’re comfortable sharing.</span><button className="button button-primary" type="submit" disabled={!message.trim()}>Add to story <span aria-hidden="true">↑</span></button></div></form>
              <div className="prompt-row"><span>Not sure where to start?</span><button className="prompt-chip" onClick={() => setMessage("I enjoy helping people feel welcome and find what they need.")}>“I enjoy…”</button><button className="prompt-chip" onClick={() => setMessage("A moment I felt proud was when I helped a visitor find the right book for their child.")}>“I felt proud when…”</button></div>
            </section>

            <section className={`canvas-pane${mobilePanel === "conversation" ? " mobile-hidden" : ""}`} aria-labelledby="canvas-heading">
              <div className="pane-heading canvas-title"><div><span className="pane-index">B</span><div><h2 id="canvas-heading">Career canvas</h2><p>A living draft of what you bring.</p></div></div><span className="canvas-glyph" aria-hidden="true">✳</span></div>
              <div className="candidate-line"><span className="candidate-avatar" aria-hidden="true">{candidateName.slice(0, 1).toUpperCase()}</span><span><label className="sr-only" htmlFor="candidate-name">Candidate name</label><input className="candidate-name" id="candidate-name" value={candidateName} onChange={(event) => setCandidateName(event.target.value)} /><small>Sample candidate · fictional</small></span><span className="edit-name">Editable</span></div>
              <div className="section-label"><span>EXPERIENCE & STRENGTHS</span><span>{confirmed.length} confirmed</span></div>
              <ul className="note-list">
                {notes.map((note) => <li key={note.id} className={`note-item ${note.status}`}>
                  <span className="note-status" aria-label={note.status === "confirmed" ? "Confirmed" : "Needs your review"}>{note.status === "confirmed" ? "✓" : "· · ·"}</span>
                  <label className="sr-only" htmlFor={`note-${note.id}`}>{note.status === "confirmed" ? "Confirmed experience" : "Suggested experience"}</label>
                  <input id={`note-${note.id}`} value={note.text} onChange={(event) => updateNote(note.id, { text: event.target.value })} />
                  {note.status === "pending" ? <div className="note-actions"><button className="icon-action accept" onClick={() => { updateNote(note.id, { status: "confirmed" }); setAnnouncement("Suggestion confirmed and added to your profile."); }}>Confirm</button><button className="icon-action" onClick={() => setNotes((items) => items.filter((item) => item.id !== note.id))}>Remove</button></div> : <span className="confirmed-label">YOURS</span>}
                </li>)}
              </ul>
              <form className="add-skill" onSubmit={addSkill}><label htmlFor="skill">Add something yourself</label><div><input id="skill" value={skillDraft} onChange={(event) => setSkillDraft(event.target.value)} placeholder="A skill or experience" /><button className="add-button" disabled={!skillDraft.trim()} aria-label="Add confirmed experience">+</button></div></form>
              <div className="canvas-footnote"><span aria-hidden="true">↳</span> Nothing is included in your draft until you confirm it.</div>
              <button className="button button-dark continue-button" onClick={() => { setStep("application"); setAnnouncement("Choose a fictional role to prepare your draft."); }}>Choose a role <span aria-hidden="true">→</span></button>
            </section>
          </div>
          <p className="demo-disclaimer">AI responses in this preview are prepared examples, not live AI output.</p>
        </section>}

        {step === "application" && <section className="application" aria-labelledby="application-heading">
          <div className="application-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> YOUR NEXT STEP</p><h1 id="application-heading">A draft you can make your own.</h1><p>Choose a fictional role. We’ll shape a starting point from the details you’ve confirmed.</p></div><span className="demo-tag"><span /> Fictional roles</span></div>
          <div className="job-layout"><section className="job-column" aria-labelledby="jobs-heading"><div className="section-title-row"><h2 id="jobs-heading">Choose a role</h2><span>3 sample listings</span></div><div className="job-list">{DEMO_JOBS.map((job, index) => <button key={job.id} className={`job-option${selectedJob === job.id ? " selected" : ""}`} aria-pressed={selectedJob === job.id} onClick={() => { setSelectedJob(job.id); setCv(""); setLetter(""); }}><span className={`job-symbol job-symbol-${index}`} aria-hidden="true">{["↗", "⌁", "＋"][index]}</span><span className="job-main"><strong>{job.title}</strong><span>{job.company} · {job.location}</span><small>{job.arrangement} <i>·</i> Fictional listing</small></span><span className="job-radio" aria-hidden="true">{selectedJob === job.id ? "✓" : ""}</span></button>)}</div><div className="job-description"><span className="small-label">ROLE SNAPSHOT</span><h3>{selected.title}</h3><p>{selected.description}</p><ul>{selected.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul></div><button className="button button-primary generate-button" onClick={generateDraft}>Prepare a demo draft <span aria-hidden="true">↗</span></button><p className="no-submit"><span aria-hidden="true">◎</span> This only prepares a draft. It never applies or contacts an employer.</p></section>
            <section className="draft-column" aria-labelledby="draft-heading"><div className="draft-header"><div><span className="pane-index">C</span><div><h2 id="draft-heading">Your application draft</h2><p>{cv ? "Ready for your review · demo content" : "Your preview will appear here"}</p></div></div>{cv && <span className="draft-status"><i /> EDITABLE</span>}</div>{cv ? <><div className="draft-editors"><div className="editor-block"><label htmlFor="cv-text">Curriculum vitae</label><textarea id="cv-text" value={cv} onChange={(event) => setCv(event.target.value)} rows={13} /></div><div className="editor-block"><label htmlFor="letter-text">Cover letter</label><textarea id="letter-text" value={letter} onChange={(event) => setLetter(event.target.value)} rows={12} /></div></div><div className="draft-actions"><p>Made from confirmed details. Read it through and change anything you like.</p><button className="button button-dark" onClick={downloadDraft}>Download .txt <span aria-hidden="true">↓</span></button></div></> : <div className="empty-draft"><div className="empty-mark" aria-hidden="true"><span>✳</span><i /><b /></div><h3>Your story will come through here.</h3><p>When you’re ready, prepare a demo draft. You can edit every word before you download it.</p><span className="empty-rule" /></div>}</section></div>
          <button className="back-link" onClick={() => setStep("story")}>← Back to your story</button>
        </section>}
      </div>

      <footer className="site-footer"><span><Mark small /> ACCESS <span className="footer-separator">·</span> YOUR STORY, YOUR WAY</span><span>Independent prototype · Not an official ZEIL product</span></footer>
      <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
    </main>
  );
}
