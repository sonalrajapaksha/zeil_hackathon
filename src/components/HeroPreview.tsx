"use client";

import { useState } from 'react';

/** Fictional, CSS-only demonstration; never starts audio or a provider session. */
export function HeroPreview() {
  const [paused, setPaused] = useState(false);
  const [replay, setReplay] = useState(0);
  return <section className={`hero-preview${paused ? ' is-paused' : ''}`} aria-label="Fictional conversation example">
    <div className="preview-heading"><span>A little demonstration</span><span className="preview-fictional">Fictional story</span><button type="button" className="text-button preview-motion-control" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? 'Play example' : 'Pause example'}</button><button type="button" className="text-button preview-motion-control" onClick={() => { setReplay(replay + 1); setPaused(false); }}>Replay</button></div>
    <div key={replay} className="preview-scene">
      <div className="preview-conversation">
        <span>Access asks</span>
        <p>Tell me about a time you helped someone.</p>
        <span>You say</span>
        <blockquote>“I helped library visitors feel confident using computers.”</blockquote>
      </div>
      <p className="preview-story-cue"><span aria-hidden="true">↘</span> There’s more to that story…</p>
      <div className="preview-discovery">
        <span>A strength spotted</span>
        <strong>Customer assistance</strong>
        <p>Suggested from your experience. You decide what stays.</p>
      </div>
      <p className="preview-caption">The things you’ve done count for more than you think.</p>
    </div>
  </section>;
}
