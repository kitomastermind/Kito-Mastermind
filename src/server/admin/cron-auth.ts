import { NextResponse } from 'next/server';

export function cronUnauthorized(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not set' }, { status: 500 });
  }
  const header = request.headers.get('authorization');
  if (header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
