import { z } from "zod";
import { CandidateProfileSchema, type CandidateProfile } from "./contracts.ts";

const STORAGE_KEY = "access-candidate-v1";
const StoredStateSchema = z.object({ version: z.literal(1), profile: CandidateProfileSchema }).strict();

type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function browserStorage(): StoragePort | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function approvedProfile(profile: CandidateProfile): CandidateProfile {
  return {
    ...(profile.name !== undefined ? { name: profile.name } : {}),
    ...(profile.summary !== undefined ? { summary: profile.summary } : {}),
    skills: profile.skills.filter((item) => item.confirmed),
    experience: profile.experience.filter((item) => item.confirmed),
    education: profile.education.filter((item) => item.confirmed),
    preferences: { ...profile.preferences },
  };
}

export function loadSavedProfile(storage = browserStorage()): CandidateProfile | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw || raw.length > 128_000) return null;
    const result = StoredStateSchema.safeParse(JSON.parse(raw));
    if (!result.success) {
      storage.removeItem(STORAGE_KEY);
      return null;
    }
    return approvedProfile(result.data.profile);
  } catch {
    return null;
  }
}

export function saveProfile(profile: CandidateProfile, storage = browserStorage()): boolean {
  if (!storage) return false;
  try {
    const state = StoredStateSchema.parse({ version: 1, profile: approvedProfile(profile) });
    const serialized = JSON.stringify(state);
    if (serialized.length > 128_000) return false;
    storage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch {
    return false;
  }
}

export function deleteSavedProfile(storage = browserStorage()): void {
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    // Storage may be disabled; in-memory reset still proceeds.
  }
}
