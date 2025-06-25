import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const HISTORY_FILE = path.join(process.cwd(), 'data', 'states', 'searchHistory.json');

interface SearchHistory {
  query: string;
  timestamp: string;
}

interface SearchHistoryData {
  history: SearchHistory[];
}

async function ensureDirectoryExists(filePath: string) {
  const dir = path.dirname(filePath);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function readHistory(): Promise<SearchHistoryData> {
  try {
    await ensureDirectoryExists(HISTORY_FILE);
    const data = await fs.readFile(HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { history: [] };
  }
}

async function writeHistory(data: SearchHistoryData) {
  await ensureDirectoryExists(HISTORY_FILE);
  await fs.writeFile(HISTORY_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  try {
    const data = await readHistory();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to read search history:', error);
    return NextResponse.json({ error: 'Failed to read search history' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newEntry: SearchHistory = await request.json();
    const data = await readHistory();
    
    // Remove duplicate queries and add new entry at the beginning
    const filteredHistory = data.history.filter(h => h.query !== newEntry.query);
    const updatedHistory = [newEntry, ...filteredHistory].slice(0, 25);
    
    await writeHistory({ history: updatedHistory });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save search history:', error);
    return NextResponse.json({ error: 'Failed to save search history' }, { status: 500 });
  }
}