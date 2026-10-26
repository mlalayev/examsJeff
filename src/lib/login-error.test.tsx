/** @jest-environment jsdom */
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import LoginPage from '@/app/auth/login/page';
import AuthErrorPage from '@/app/auth/error/page';
import {signIn} from 'next-auth/react';
jest.mock('next-auth/react',()=>({signIn:jest.fn()}));
jest.mock('next/navigation',()=>({useSearchParams:()=>new URLSearchParams()}));
jest.mock('next/link',()=>({__esModule:true,default:({children,...props}:any)=><a {...props}>{children}</a>}));
let root:ReturnType<typeof createRoot>;let host:HTMLDivElement;
beforeEach(()=>{(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;host=document.createElement('div');root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());});
test('wrong credentials stay on the form and allow retry',async()=>{
 (signIn as jest.Mock).mockResolvedValue({ok:false,status:401,error:'CredentialsSignin'});
 await act(async()=>root.render(<LoginPage/>));
 await act(async()=>{host.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
 expect(host.querySelector('[role="alert"]')?.textContent).toContain('Account not found or incorrect password');
 expect(host.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(false);
 expect(signIn).toHaveBeenCalledWith('credentials',expect.objectContaining({redirect:false}));
});
test('error fallback provides a fixed safe login link and no raw error details',async()=>{
 const page=await AuthErrorPage({searchParams:Promise.resolve({error:'internal secret details'})});
 await act(async()=>root.render(page));
 expect(host.textContent).not.toContain('internal secret details');
 expect(host.querySelector('a')?.getAttribute('href')).toBe('/auth/login');
});
