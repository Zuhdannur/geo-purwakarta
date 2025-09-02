import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function walkDir(dir: string, fileList: string[] = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, fileList);
    } else if (entry.isFile()) {
      fileList.push(full);
    }
  }
  return fileList;
}

export async function GET() {
  try {
    const basePublic = path.join(process.cwd(), 'public');
    const preparedRoot = path.join(basePublic, 'PERMINTAAN DATA PERTEK');
    if (!fs.existsSync(preparedRoot)) {
      return NextResponse.json({ items: [] });
    }

    const allFiles = walkDir(preparedRoot, []);
    const zipFiles = allFiles.filter((p) => p.toLowerCase().endsWith('.zip'));

    const items = zipFiles.map((absPath) => {
      const relToPublic = absPath.replace(basePublic + path.sep, '').split(path.sep).join('/');
      const segments = relToPublic.split('/');
      const year = segments.find((s) => /^(20\d{2})$/.test(s)) || '';
      const name = path.basename(absPath, '.zip');
      return { year, name, path: `/${relToPublic}` };
    });

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to list prepared files' }, { status: 500 });
  }
}


