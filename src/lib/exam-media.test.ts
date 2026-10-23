import { resolveExamImage } from './exam-image';
import limiter, { applyRateLimit, RateLimitPresets } from './rate-limiter-enhanced';

afterAll(() => limiter.destroy());
test('legacy uploaded question and answer image paths use dynamic serving', () => {
  expect(resolveExamImage('/images/new.png')).toBe('/api/images/new.png');
  expect(resolveExamImage('/api/images/new.png')).toBe('/api/images/new.png');
  expect(resolveExamImage('https://external.example/images/new.png')).toBe('https://external.example/images/new.png');
  expect(resolveExamImage('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
});
test('uploads cannot exhaust autosave quota and users on one IP do not share quotas', async () => {
  const request = new Request('http://localhost/api/admin/upload', { headers: { 'x-real-ip': '127.0.0.1' } });
  for (let i = 0; i < RateLimitPresets.UPLOAD.max; i++) expect(await applyRateLimit(request, 'UPLOAD', 'admin-a')).toBeNull();
  const limited = await applyRateLimit(request, 'UPLOAD', 'admin-a');
  expect(limited?.status).toBe(429);
  expect(Number(limited?.headers.get('Retry-After'))).toBeGreaterThan(0);
  expect(await applyRateLimit(request, 'API', 'admin-a')).toBeNull();
  expect(await applyRateLimit(request, 'UPLOAD', 'admin-b')).toBeNull();
});
