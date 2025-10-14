import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: "Server is working!",
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  return NextResponse.json({ 
    success: true, 
    message: "POST endpoint is working!",
    timestamp: new Date().toISOString()
  });
}
