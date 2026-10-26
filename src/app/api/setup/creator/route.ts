import { NextResponse } from 'next/server';
export async function POST() {
  return NextResponse.json({ error: 'Setup endpoint disabled. Use server-side administration.' }, { status: 410 });
}
