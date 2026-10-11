// Cloudflare Pages Function: the analytics tracker, served from this site's own
// address. Umami runs on the homelab behind a Cloudflare Tunnel at UMAMI; serving
// its script from here, under a bland name, keeps it first-party, so blockers
// that match on third-party hosts or on "analytics" and "umami" in a name let it
// through. Its partner, api/c.js, carries the events back.
//
// While the site's analytics switch is off nothing loads this, and a request to
// it costs one Worker invocation of the free plan's 100,000 a day.

const UMAMI = 'https://edge.integratn.io';

export async function onRequestGet() {
  const upstream = await fetch(`${UMAMI}/c.js`, { cf: { cacheEverything: true, cacheTtl: 3600 } });
  if (!upstream.ok) return new Response('', { status: 502 });
  return new Response(upstream.body, {
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
