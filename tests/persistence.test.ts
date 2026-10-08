import assert from 'node:assert/strict';
import test from 'node:test';
import { deleteSavedProfile, loadSavedProfile, saveProfile } from '../src/lib/persistence.ts';
import type { CandidateProfile } from '../src/lib/contracts.ts';

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

const profile: CandidateProfile = {
  name: 'Ari', skills: [
    { id: 'approved', name: 'Visitor support', evidence: 'Helped visitors', confirmed: true },
    { id: 'pending', name: 'Unreviewed claim', evidence: 'Unreviewed quote', confirmed: false },
  ],
  experience: [{ id: 'experience', text: 'Organised donations', evidence: ['At the library'], confirmed: true }],
  education: [{ id: 'education', text: 'Course proposal', evidence: 'Mentioned a course', confirmed: false }],
  preferences: { largeText: true, highContrast: false, reducedMotion: true, questionStyle: 'simple' },
};

test('saves only confirmed profile claims and explicit preferences, then restores them', () => {
  const storage = new MemoryStorage();
  assert.equal(saveProfile(profile, storage), true);
  const raw = storage.getItem('access-candidate-v1')!;
  assert.doesNotMatch(raw, /Unreviewed claim|Course proposal|Unreviewed quote/);
  assert.match(raw, /approved|Visitor support/);
  assert.match(raw, /simple/);
  assert.deepEqual(loadSavedProfile(storage), {
    name: 'Ari', skills: [profile.skills[0]], experience: profile.experience, education: [], preferences: profile.preferences,
  });
});

test('drops malformed or unsupported saved data and reset deletes it', () => {
  const storage = new MemoryStorage();
  storage.setItem('access-candidate-v1', '{broken');
  assert.equal(loadSavedProfile(storage), null);
  storage.setItem('access-candidate-v1', JSON.stringify({ version: 2, profile }));
  assert.equal(loadSavedProfile(storage), null);
  assert.equal(saveProfile(profile, storage), true);
  deleteSavedProfile(storage);
  assert.equal(storage.getItem('access-candidate-v1'), null);
});
