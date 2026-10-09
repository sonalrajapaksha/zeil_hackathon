/** Fictional, CSS-only demonstration; never starts audio or a provider session. */
export function HeroPreview() {
  return <section className="hero-preview" aria-label="Fictional conversation example">
    <div className="preview-heading"><span className="preview-fictional">Fictional story</span></div>
    <div className="preview-scene">
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
