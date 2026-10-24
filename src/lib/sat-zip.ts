import { fromBuffer, type Entry } from 'yauzl';
import { parseSatText, type ModuleExamCategory } from './sat-text-import';

export const MAX_SAT_ZIP = 20 * 1024 * 1024;
const MAX_TOTAL = 50 * 1024 * 1024;

/** Bounded, sequential extraction into memory; archive paths are never used as disk paths. */
export async function readSatZip(buffer: Buffer, category: ModuleExamCategory = 'SAT'): Promise<{ text: string; images: Map<string, Buffer> }> {
  if (buffer.length > MAX_SAT_ZIP) throw new Error('ZIP exceeds 20 MB.');
  const files = await new Promise<Map<string, Buffer>>((resolve, reject) => {
    fromBuffer(buffer, { lazyEntries: true, validateEntrySizes: true, strictFileNames: true }, (error, zip) => {
      if (error || !zip) { reject(new Error('Invalid ZIP archive.')); return; }
      let total = 0; let count = 0; let stopped = false;
      const entries = new Map<string, Buffer>();
      const fail = (e: Error) => { stopped = true; zip.close(); reject(e); };
      zip.on('error', fail);
      zip.on('end', () => { if (!stopped) resolve(entries); });
      zip.on('entry', (entry: Entry) => {
        if (stopped) return;
        const name = entry.fileName;
        if (++count > 301) return fail(new Error('Too many ZIP entries (maximum 300 files).'));
        if (name === 'images/') { zip.readEntry(); return; }
        if (name !== 'questions.txt' && !/^images\/[a-z0-9_-]+\.(png|jpg|jpeg|webp)$/.test(name)) return fail(new Error(`Unsupported ZIP entry: ${name}. Use questions.txt and images/ at the root.`));
        if (entries.has(name)) return fail(new Error(`Duplicate ZIP filename: ${name}`));
        const mode = (entry.externalFileAttributes >>> 16) & 0xf000;
        if (mode === 0xa000 || entry.generalPurposeBitFlag & 1) return fail(new Error('Symlinks and encrypted files are not allowed.'));
        const limit = name === 'questions.txt' ? 800000 : 5 * 1024 * 1024;
        total += entry.uncompressedSize;
        if (entry.uncompressedSize > limit || total > MAX_TOTAL) return fail(new Error('ZIP exceeds uncompressed size limits (5 MB/image, 50 MB total).'));
        zip.openReadStream(entry, (err, stream) => {
          if (err || !stream) return fail(new Error(`Cannot read ${name}.`));
          const chunks: Buffer[] = []; let bytes = 0;
          stream.on('error', fail);
          stream.on('data', (chunk: Buffer) => {
            bytes += chunk.length;
            if (bytes > limit) { stream.destroy(); fail(new Error(`File too large: ${name}`)); return; }
            chunks.push(chunk);
          });
          stream.on('end', () => {
            if (stopped) return;
            entries.set(name, Buffer.concat(chunks)); zip.readEntry();
          });
        });
      });
      zip.readEntry();
    });
  });
  const source = files.get('questions.txt');
  if (!source) throw new Error('ZIP must contain questions.txt at its root.');
  const text = new TextDecoder('utf-8', { fatal: true }).decode(source);
  if (text.includes('\0') || text.length > 200000) throw new Error('Invalid questions.txt (maximum 200,000 characters).');
  files.delete('questions.txt');
  for (const [name, bytes] of files) {
    const valid = name.endsWith('.png') ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
      : name.endsWith('.webp') ? bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
      : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    if (!valid) throw new Error(`Invalid image format: ${name}`);
  }
  const references = [...text.matchAll(/\[Image:\s*([^\]]+)\]/gi)].map(m => m[1].trim());
  for (const ref of references) if (!files.has(ref)) throw new Error(`Missing ZIP image: ${ref}`);
  const placeholders = Object.fromEntries([...files.keys()].map((name, i) => [name, `/api/images/check-${i}.${name.split('.').pop()}`]));
  const parsed = parseSatText(text, placeholders, category);
  if (parsed.errors.length) throw new Error(parsed.errors.slice(0, 10).join('\n'));
  // Unreferenced files are neither written nor exposed.
  return { text, images: new Map([...files].filter(([name]) => references.includes(name))) };
}
