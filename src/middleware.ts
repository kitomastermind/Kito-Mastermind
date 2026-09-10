import { type NextRequest } from 'next/server';
import { updateSession } from '@/server/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|opengraph-image|twitter-image|og/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
