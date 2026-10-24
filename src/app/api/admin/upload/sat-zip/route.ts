import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { requireAdminOrBranchAdmin } from '@/lib/auth-utils';
import { applyRateLimit } from '@/lib/rate-limiter-enhanced';
import { MAX_SAT_ZIP, readSatZip } from '@/lib/sat-zip';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    await requireAdminOrBranchAdmin();
  } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }); }
  const limited = await applyRateLimit(request, 'UPLOAD');
  if (limited) return limited;
  const written: string[] = [];
  try {
    if (Number(request.headers.get('content-length')) > MAX_SAT_ZIP + 65536) return NextResponse.json({ error: 'ZIP exceeds 20 MB.' }, { status: 413 });
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith('.zip') || file.size > MAX_SAT_ZIP) return NextResponse.json({ error: 'Select a ZIP file up to 20 MB.' }, { status: 400 });
    const category = form.get('category') || 'SAT';
    if (category !== 'SAT' && category !== 'MATH') return NextResponse.json({ error: 'Invalid exam category.' }, { status: 400 });
    const archive = await readSatZip(Buffer.from(await file.arrayBuffer()), category);
    const directory = join(process.cwd(), 'public', 'images');
    await mkdir(directory, { recursive: true });
    const paths: Record<string, string> = {};
    for (const [name, bytes] of archive.images) {
      const filename = `sat-${randomUUID()}.${name.split('.').pop()}`;
      const path = join(directory, filename);
      await writeFile(path, bytes, { flag: 'wx' });
      written.push(path); paths[name] = `/api/images/${filename}`;
    }
    // Durable URLs are kept in the draft, never temporary blob URLs or local ZIP paths.
    const text = archive.text.replace(/\[Image:\s*([^\]]+)\]/gi, (_, name: string) => `[Image: ${paths[name.trim()]}]`);
    return NextResponse.json({ text, imageCount: archive.images.size });
  } catch (error) {
    await Promise.all(written.map(path => unlink(path).catch(() => {})));
    return NextResponse.json({ error: error instanceof Error ? error.message : 'ZIP import failed.' }, { status: 400 });
  }
}
