/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import EditAccountModal from '@/components/modals/EditAccountModal';
jest.mock('@/components/coins/CoinStudentHistoryPanel', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/coins/ManualCoinModal', () => ({ __esModule: true, default: () => null }));
let root: Root; let host: HTMLDivElement;
const saved = jest.fn(); const closed = jest.fn();
beforeEach(() => {
  jest.clearAllMocks(); (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.fetch = jest.fn(async (_url: any, options: any) => ({ ok: true, json: async () => options?.method === 'PATCH' ? {} : { user: { firstName: 'Ali', lastName: 'Test', email: 'ali@example.com', role: 'CREATOR', approved: true } } } as Response));
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
test('full editor loads names, saves changed name, and preserves creator role', async () => {
  await act(async () => { root.render(<EditAccountModal open userId="user" branches={[]} onClose={closed} onSaved={saved} />); });
  const firstName = host.querySelectorAll<HTMLInputElement>('input[type=text]')[0];
  expect(firstName.value).toBe('Ali');
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(firstName, 'Updated');
    firstName.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await act(async () => { Array.from(host.querySelectorAll('button')).find(b => b.textContent?.includes('Save'))!.click(); });
  const call = (fetch as jest.Mock).mock.calls.find(c => c[1]?.method === 'PATCH');
  expect(call[0]).toBe('/api/admin/users/user');
  expect(JSON.parse(call[1].body)).toMatchObject({ firstName: 'Updated', lastName: 'Test', email: 'ali@example.com' });
  expect(JSON.parse(call[1].body)).not.toHaveProperty('role');
  expect(saved).toHaveBeenCalled(); expect(closed).toHaveBeenCalled();
});
test('failed account loading never permits saving stale form data', async () => {
  globalThis.fetch = jest.fn(async () => ({ ok: false, json: async () => ({ error: 'Unavailable' }) } as Response));
  await act(async () => { root.render(<EditAccountModal open userId="other" branches={[]} onClose={closed} onSaved={saved} />); });
  const save = Array.from(host.querySelectorAll('button')).find(b => b.textContent?.includes('Save'))!;
  expect(save.disabled).toBe(true); expect(host.textContent).toContain('Unavailable');
});
