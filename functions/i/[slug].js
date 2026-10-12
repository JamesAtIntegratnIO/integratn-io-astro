// Cloudflare Pages Function: Umami's tracking pixels, served from this site's
// own address as /i/<slug> (see ../go/[slug].js for links). Umami records the
// view at edge.integratn.io/p/<slug> and answers with a 1x1 GIF, passed on here
// uncached so every view reaches it. An unknown slug gets the site's 404 page.

const UMAMI = 'https://edge.integratn.io';

export async function onRequestGet({ request, params, next }) {
  const upstream = await fetch(`${UMAMI}/p/${encodeURIComponent(params.slug)}`, {
    headers: {
      'user-agent': request.headers.get('user-agent') || '',
      'accept-language': request.headers.get('accept-language') || '',
      referer: request.headers.get('referer') || '',
      'x-umami-client-ip': request.headers.get('cf-connecting-ip') || '',
    },
  });
  if (!upstream.ok) return next();
  return new Response(upstream.body, {
    headers: { 'content-type': 'image/gif', 'cache-control': 'no-cache, no-store, must-revalidate' },
  });
}
