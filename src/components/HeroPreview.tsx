"use client";

import { useState } from 'react';

/** Fictional, CSS-only demonstration; never starts audio or a provider session. */
export function HeroPreview() {
  const [paused, setPaused] = useState(false);
  const [replay, setReplay] = useState(0);
  return <section className={`hero-preview${paused ? ' is-paused' : ''}`} aria-label="Fictional conversation example">
    <div className="preview-heading"><span>Fictional example · no microphone</span><button type="button" className="text-button preview-motion-control" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? 'Play example' : 'Pause example'}</button><button type="button" className="text-button preview-motion-control" onClick={() => { setReplay(replay + 1); setPaused(false); }}>Replay</button></div>
    <div key={replay} className="preview-scene">
      <div className="preview-conversation"><span>Access</span><p>Tell me about a time you helped someone.</p><div className="preview-signal" aria-hidden="true"><span /><span /><span /></div><span>You · fictional candidate</span><p>“I helped library visitors feel confident using computers.”</p></div>
      <div className="preview-discovery"><span className="preview-connector" aria-hidden="true">↓</span><p>What you did <strong>Helped library visitors</strong></p><span className="preview-connector" aria-hidden="true">↓</span><p>What it demonstrates <strong>Customer assistance</strong><small>Example suggestion · needs your review</small></p><span className="preview-connector" aria-hidden="true">↓</span><p>Where it applies <strong>Customer support</strong><small>Example career direction, not a job offer</small></p></div>
    </div>
    <p className="preview-caption">A conversation. A discovery. A next step.</p>
  </section>;
}
