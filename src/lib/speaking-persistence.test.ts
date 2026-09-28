import { flushSpeakingRecordings, registerSpeakingRecorder } from './speaking-persistence';

test('navigation waits for recording persistence', async () => {
  let release!: () => void;
  const finish = jest.fn(() => new Promise<void>((resolve) => { release = resolve; }));
  const unregister = registerSpeakingRecorder('attempt', 'q1', finish);
  let advanced = false;
  const result = flushSpeakingRecordings('attempt').then(() => { advanced = true; });
  await Promise.resolve();
  expect(advanced).toBe(false);
  release();
  await result;
  expect(advanced).toBe(true);
  unregister();
});

test('failed persistence blocks navigation and can be retried', async () => {
  const finish = jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined);
  const unregister = registerSpeakingRecorder('retry', 'q', finish);
  await expect(flushSpeakingRecordings('retry')).rejects.toThrow('offline');
  await expect(flushSpeakingRecordings('retry')).resolves.toBeUndefined();
  unregister();
});

test('cleanup does not unregister a newer recorder; attempts stay isolated', async () => {
  const old = registerSpeakingRecorder('isolated', 'q', async () => {});
  const current = jest.fn().mockResolvedValue(undefined);
  const unregister = registerSpeakingRecorder('isolated', 'q', current);
  old();
  await flushSpeakingRecordings('other');
  expect(current).not.toHaveBeenCalled();
  await flushSpeakingRecordings('isolated');
  expect(current).toHaveBeenCalledTimes(1);
  unregister();
});
