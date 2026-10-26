import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';
export default async function AuthErrorPage({searchParams}:{searchParams:Promise<{error?:string}>}) {
 const {error}=await searchParams;
 const credentials=error==='CredentialsSignin' || error==='Invalid email or password' || error==='Invalid email format';
 return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#303380] via-[#252a6b] to-[#1a1f4a] px-4 py-8"><section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl"><div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600"><AlertCircle size={28}/></div><h1 className="text-2xl font-semibold text-slate-900">{credentials?'Account not found or incorrect password':'Unable to sign in'}</h1><p className="mt-3 text-sm leading-6 text-slate-600">{credentials?'Please check your email and password and try again.':'We could not complete your sign-in. Please return to the login page and try again.'}</p><Link href="/auth/login" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#303380] px-4 py-3 font-medium text-white hover:bg-[#252a6b]"><ArrowLeft size={18}/>Back to login</Link></section></main>;
}
