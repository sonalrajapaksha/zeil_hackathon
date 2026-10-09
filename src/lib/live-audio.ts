// Gemini audio is little-endian signed 16-bit PCM, not a WAV container.
export function encodePcm(samples: Float32Array): string {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(i * 2, Math.round(sample * (sample < 0 ? 32768 : 32767)), true);
  }
  return btoa(String.fromCharCode(...bytes));
}
export function decodePcm(data: string): Float32Array<ArrayBuffer> {
  const bytes = Uint8Array.from(atob(data), (character) => character.charCodeAt(0));
  if (!bytes.length || bytes.length % 2) throw new Error('Invalid PCM frame');
  const view = new DataView(bytes.buffer);
  const samples = new Float32Array(bytes.length / 2);
  for (let i = 0; i < samples.length; i++) samples[i] = view.getInt16(i * 2, true) / 32768;
  return samples;
}
