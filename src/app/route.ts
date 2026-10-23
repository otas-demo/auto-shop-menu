import { menuPageResponse } from '@/lib/menu/respond';

// Menu home page at the domain root — the link sent to customers.
export async function GET() {
  return menuPageResponse('index');
}
