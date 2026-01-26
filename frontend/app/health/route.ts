import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'frontend',
      version: process.env.npm_package_version ?? 'unknown',
    },
    { status: 200 }
  );
}
