// Cloudflare Pages Function: Umami's tracked links, served from this site's own
// address as /go/<slug>, so a link shared with someone names integratn.io, not
// the stats host. Umami looks the slug up at edge.integratn.io/q/<slug>, records
// the click and answers with a redirect to the link's target; this passes that
// redirect on. An unknown slug gets the site's own 404 page.
//
// Like api/c.js, the visitor's address goes in x-umami-client-ip, since Umami
// would otherwise see this Function's.

const UMAMI = 'https://edge.integratn.io';

export async function onRequestGet({ request, params, next }) {
  const upstream = await fetch(`${UMAMI}/q/${encodeURIComponent(params.slug)}`, {
    redirect: 'manual',
    headers: {
      'user-agent': request.headers.get('user-agent') || '',
      'accept-language': request.headers.get('accept-language') || '',
      referer: request.headers.get('referer') || '',
      'x-umami-client-ip': request.headers.get('cf-connecting-ip') || '',
    },
  });
  const location = upstream.headers.get('location');
  if (upstream.status >= 300 && upstream.status < 400 && location) {
    return new Response(null, { status: 302, headers: { location, 'cache-control': 'no-store' } });
  }
  return next();
}
