import { readSatZip } from './sat-zip';
import { parseSatText, SAT_IMPORT_MODULES } from './sat-text-import';

// Minimal stored ZIP fixture; deterministic and does not write/extract files on disk.
function archive(files: [string, Buffer][]): Buffer {
  const locals: Buffer[] = []; const central: Buffer[] = []; let offset = 0;
  for (const [name, data] of files) {
    const filename = Buffer.from(name);
    const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4);
    local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(filename.length, 26);
    const entry = Buffer.alloc(46); entry.writeUInt32LE(0x02014b50); entry.writeUInt16LE(20, 6);
    entry.writeUInt32LE(data.length, 20); entry.writeUInt32LE(data.length, 24); entry.writeUInt16LE(filename.length, 28); entry.writeUInt32LE(offset, 42);
    locals.push(local, filename, data); central.push(entry, filename); offset += local.length + filename.length + data.length;
  }
  const directory = Buffer.concat(central); const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}
const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
const source = SAT_IMPORT_MODULES.map(m => `[${m}]\n1. Solve $x^2=4$.\n[Image: images/q.png]\na. 2 [Image: images/q.png]\nb. 3\nc. 4\nd. 5\nAnswer: A`).join('\n');
test('Math ZIP validates only the two Math modules and preserves image references', async () => {
  const math = source.slice(source.indexOf('[math module 1]'));
  const zip = archive([['questions.txt', Buffer.from(math)], ['images/q.png', image]]);
  const result = await readSatZip(zip, 'MATH');
  expect(result.images.size).toBe(1);
  expect(parseSatText(result.text, { 'images/q.png': '/api/images/qa.png' }, 'MATH').errors).toEqual([]);
  await expect(readSatZip(zip)).rejects.toThrow();
});
test('ZIP loads all modules and binds question and choice images without changing LaTeX', async () => {
  const result = await readSatZip(archive([['questions.txt', Buffer.from(source)], ['images/q.png', image]]));
  expect(result.images.size).toBe(1);
  const parsed = parseSatText(result.text, { 'images/q.png': '/api/images/qa.png' });
  expect(parsed.errors).toEqual([]);
  expect(parsed.modules[0][0]).toMatchObject({ image: '/api/images/qa.png', prompt: { text: 'Solve $x^2=4$.' }, options: { choiceImages: ['/api/images/qa.png', '', '', ''] } });
});
test.each([
  ['traversal', [['../questions.txt', Buffer.from(source)]]],
  ['missing image', [['questions.txt', Buffer.from(source)]]],
  ['bad image', [['questions.txt', Buffer.from(source)], ['images/q.png', Buffer.from('<script>')]]],
  ['duplicate', [['questions.txt', Buffer.from(source)], ['questions.txt', Buffer.from(source)]]],
  ['oversized entry', [['questions.txt', Buffer.alloc(800001)]]],
  ['script', [['questions.txt', Buffer.from(source)], ['images/evil.svg', Buffer.from('<svg/>')]]],
] as [string, [string, Buffer][]][])('rejects %s before writing anything', async (_, files) => {
  await expect(readSatZip(archive(files))).rejects.toThrow();
});
test('text-only image placeholders produce actionable errors, not cascading module errors', () => {
  const result = parseSatText(source);
  expect(result.errors.some(e => e.includes('Image not uploaded'))).toBe(true);
  expect(result.errors.some(e => e.includes('Unknown module'))).toBe(false);
  expect(result.modules.map(m => m.length)).toEqual([1,1,1,1]);
});
