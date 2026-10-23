import { NextRequest } from 'next/server';
import { menuPageResponse } from '@/lib/menu/respond';
import { isMenuPageKey } from '@/lib/menu/render';

// Menu detail pages: /commercial, /custom, /hardware, /ai-viber, ...
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ page: string }> }
) {
  const { page } = await params;
  if (page === 'index' || !isMenuPageKey(page)) {
    return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  return menuPageResponse(page);
}
