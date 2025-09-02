import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (username === 'admin' && password === 'password') {
      const oneDay = 24 * 60 * 60; // seconds
      const response = NextResponse.json({ ok: true, token: 'ok' });
      response.cookies.set('auth', 'ok', {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        maxAge: oneDay,
        path: '/'
      });
      return response;
    }
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Bad request' }, { status: 400 });
  }
}


