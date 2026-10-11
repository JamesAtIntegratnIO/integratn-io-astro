// Cloudflare Pages Function: the analytics events, passed through to Umami on
// the homelab (see ../c.js). Umami would otherwise see this Function's address,
// not the visitor's, so the visitor's address goes in x-umami-client-ip, which
// Umami is configured to read (CLIENT_IP_HEADER). Umami derives a rough location
// from it and does not store it.

const UMAMI = 'https://edge.integratn.io';

export async function onRequestPost({ request }) {
  const upstream = await fetch(`${UMAMI}/api/c`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': request.headers.get('user-agent') || '',
      'x-umami-client-ip': request.headers.get('cf-connecting-ip') || '',
    },
    body: await request.text(),
  });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' },
  });
}
