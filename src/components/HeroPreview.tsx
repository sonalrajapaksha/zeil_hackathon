"use client";

import { useState } from 'react';

/** Fictional, CSS-only demonstration; never starts audio or a provider session. */
export function HeroPreview() {
  const [paused, setPaused] = useState(false);
  const [replay, setReplay] = useState(0);
  return <section className={`hero-preview${paused ? ' is-paused' : ''}`} aria-label="Fictional conversation example">
    <div className="preview-heading"><span>Fictional example · no microphone</span><button type="button" className="text-button preview-motion-control" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? 'Play example' : 'Pause example'}</button><button type="button" className="text-button preview-motion-control" onClick={() => { setReplay(replay + 1); setPaused(false); }}>Replay</button></div>
    <div key={replay} className="preview-scene">
      <div className="preview-conversation"><span>Access asks</span><p>Tell me about a time you helped someone.</p><span>You share · fictional example</span><p>“I helped library visitors feel confident using computers.”</p></div>
      <div className="preview-discovery"><p><span>What you did</span><strong>Helped library visitors</strong></p><p><span>Potential strength · your choice to confirm</span><strong>Customer assistance</strong><small>Example suggestion · needs your review</small></p><p><span>Where it could apply</span><strong>Customer support</strong><small>Example career direction, not a job offer</small></p></div>
    </div>
  </section>;
}
