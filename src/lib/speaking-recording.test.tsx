/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { QSpeakingRecording } from '@/components/questions/QSpeakingRecording';
import { flushSpeakingRecordings, pendingRecording } from './speaking-persistence';

jest.mock('./speaking-persistence', () => ({
  ...jest.requireActual('./speaking-persistence'),
  pendingRecording: jest.fn(async () => undefined),
}));

class Recorder {
  static isTypeSupported = () => false;
  mimeType = 'audio/mp4';
  state = 'inactive';
  ondataavailable?: (event: { data: Blob }) => void;
  onstop?: () => void;
  start() { this.state = 'recording'; }
  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['recorded audio'], { type: this.mimeType }) });
    this.onstop?.();
  }
}
let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  (globalThis as any).MediaRecorder = Recorder;
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: {
    getUserMedia: jest.fn(async () => ({ getTracks: () => [{ stop: jest.fn() }] })),
  } });
  Object.defineProperty(navigator, 'permissions', { configurable: true, value: {
    query: jest.fn(async () => ({ state: 'granted', onchange: null })),
  } });
  (AbortSignal as any).timeout = () => new AbortController().signal;
  (globalThis as any).fetch = jest.fn();
  (pendingRecording as jest.Mock).mockReset().mockResolvedValue(undefined);
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});
async function mount(onChange: jest.Mock) {
  await act(async () => { root.render(<QSpeakingRecording question={{ id: 'q', prompt: { text: 'Speak', part: 1 } }} attemptId="attempt" questionSecondsLeft={40} onChange={onChange} />); });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 650)); });
  await act(async () => { await Promise.resolve(); });
}
test('Next stops recording, sends real MP4 format, waits for durable upload; AI failure retains audio', async () => {
  const changed = jest.fn();
  (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ url: '/api/audio/answer.mp4' }) })
    .mockResolvedValueOnce({ ok: false, status: 503 });
  await mount(changed);
  await act(async () => { await flushSpeakingRecordings('attempt'); });
  expect(fetch).toHaveBeenCalledTimes(2);
  const body = (fetch as jest.Mock).mock.calls[0][1].body as FormData;
  expect((body.get('file') as File).name).toBe('speaking-q.mp4');
  expect((body.get('file') as File).type).toBe('audio/mp4');
  expect(changed).toHaveBeenCalledWith({ text: '', audioUrl: '/api/audio/answer.mp4' });
  expect(host.textContent).toContain('Recording completed and saved');
});
test('upload failure blocks navigation and retains recording for retry', async () => {
  const changed = jest.fn();
  const quiet = jest.spyOn(console, 'error').mockImplementation(() => {});
  (fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'));
  await mount(changed);
  await act(async () => { await expect(flushSpeakingRecordings('attempt')).rejects.toThrow('offline'); });
  expect(changed).not.toHaveBeenCalled();
  expect(pendingRecording).toHaveBeenCalledWith('attempt:q', 'put', expect.any(Blob));
  (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ url: '/api/audio/retry.mp4' }) })
    .mockResolvedValueOnce({ ok: false });
  await act(async () => { await flushSpeakingRecordings('attempt'); });
  expect(changed).toHaveBeenCalledWith({ text: '', audioUrl: '/api/audio/retry.mp4' });
  quiet.mockRestore();
});

test('a recording recovered after reload is uploaded without recording again', async () => {
  const changed = jest.fn();
  (pendingRecording as jest.Mock).mockResolvedValueOnce(new Blob(['recovered'], { type: 'audio/webm' }));
  (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ url: '/api/audio/recovered.webm' }) })
    .mockResolvedValueOnce({ ok: false });
  await mount(changed);
  await act(async () => { await flushSpeakingRecordings('attempt'); });
  const file = (fetch as jest.Mock).mock.calls[0][1].body.get('file') as File;
  expect(file.name).toBe('speaking-q.webm');
  expect(file.size).toBe(9);
  expect(changed).toHaveBeenCalledWith({ text: '', audioUrl: '/api/audio/recovered.webm' });
});
