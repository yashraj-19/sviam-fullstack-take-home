import fs from 'fs/promises';
import path from 'path';
import type { Session, IntegrityLabel } from '@/lib/types';

const DATA_DIR = path.join(process.cwd(), 'data', 'sessions');

export async function getAllSessions(): Promise<Session[]> {
  const files = await fs.readdir(DATA_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json')).sort();

  const sessions = await Promise.all(
    jsonFiles.map(async (file) => {
      const raw = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
      return JSON.parse(raw) as Session;
    })
  );

  return sessions;
}

export async function getSession(id: string): Promise<Session | null> {
  try {
    const filePath = path.join(DATA_DIR, `${id}.json`);
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export async function getLabels(): Promise<Record<string, IntegrityLabel>> {
  const filePath = path.join(process.cwd(), 'data', 'labels.json');
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw) as Record<string, IntegrityLabel>;
}
