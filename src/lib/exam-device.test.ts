import { isTabletDevice } from './exam-device';

test.each([
  ['Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)', 5, true],
  ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Safari', 5, true],
  ['Mozilla/5.0 (Linux; Android 14; SM-X700) Chrome Safari', 5, true],
  ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Safari', 0, false],
  ['Mozilla/5.0 (Windows NT 10.0) Chrome', 10, false],
  ['Mozilla/5.0 (Linux; Android 14) Chrome Mobile Safari', 5, false],
  ['Mozilla/5.0 (iPhone; CPU OS 17_0 like Mac OS X)', 5, false],
])('detects tablet from %s with %s touch points', (agent, touch, expected) => {
  expect(isTabletDevice(agent, touch)).toBe(expected);
});
