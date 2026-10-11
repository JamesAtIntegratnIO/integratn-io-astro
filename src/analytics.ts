// Engagement analytics: which tool counts visits, and the events the site sends it.
//
// ANALYTICS is null until a tool is chosen, and while it is null the site loads
// nothing and sends nothing. Every supported tool is cookieless, so no consent
// banner is needed. The loader only runs on the production hosts, so deploy
// previews and `astro dev` never add to the numbers.
//
// What is counted beyond page views (the same names on bosun.integratn.io):
//   click     an element marked data-track="<name>", e.g. a product card's button
//   outbound  any link to another site, with its host and path
//   read      on a post, the reader reached half-way (50) or the end (100)

type Analytics =
  | { tool: 'umami'; src: string; websiteId: string }
  | { tool: 'plausible'; src?: string; domain: string }
  | { tool: 'goatcounter'; endpoint: string };

export const ANALYTICS: Analytics | null = null;

/** The hosts whose visits count. Anything else (previews, localhost) loads nothing. */
export const ANALYTICS_HOSTS = ['integratn.io', 'www.integratn.io'];

/** The script for the page's head, or '' while analytics is off. */
export function analyticsScript(): string {
  const config = ANALYTICS as Analytics | null;
  if (!config) return '';
  return `<script>\n(${tracker.toString()})(${JSON.stringify(config)},${JSON.stringify(ANALYTICS_HOSTS)});\n</script>`;
}

// Runs in the browser. Kept free of imports and of anything outside its own
// body, because it is shipped as its source text.
function tracker(config: Analytics, hosts: string[]) {
  if (hosts.indexOf(location.hostname) < 0) return;

  const s = document.createElement('script');
  s.defer = true;
  if (config.tool === 'umami') {
    s.src = config.src;
    s.setAttribute('data-website-id', config.websiteId);
  } else if (config.tool === 'plausible') {
    s.src = config.src || 'https://plausible.io/js/script.js';
    s.setAttribute('data-domain', config.domain);
  } else {
    s.src = 'https://gc.zgo.at/count.js';
    s.setAttribute('data-goatcounter', config.endpoint);
  }
  document.head.appendChild(s);

  // Events wait in a queue until the tool's script has loaded.
  const queue: [string, Record<string, string>][] = [];
  const w = window as any;
  function send(name: string, data: Record<string, string>) {
    if (config.tool === 'umami' && w.umami) w.umami.track(name, data);
    else if (config.tool === 'plausible' && w.plausible) w.plausible(name, { props: data });
    else if (config.tool === 'goatcounter' && w.goatcounter && w.goatcounter.count)
      w.goatcounter.count({ path: name + ':' + Object.values(data).join(':'), title: name, event: true });
    else return false;
    return true;
  }
  function track(name: string, data: Record<string, string>) {
    if (!send(name, data)) queue.push([name, data]);
  }
  s.addEventListener('load', () => {
    queue.splice(0).forEach(([name, data]) => send(name, data));
  });

  document.addEventListener(
    'click',
    (e) => {
      const target = e.target as Element | null;
      const marked = target && target.closest('[data-track]');
      if (marked) track('click', { name: marked.getAttribute('data-track') || '', page: location.pathname });
      const link = target && (target.closest('a[href]') as HTMLAnchorElement | null);
      if (link && link.host && link.host !== location.host)
        track('outbound', { url: link.host + link.pathname.replace(/\/$/, ''), page: location.pathname });
    },
    true,
  );

  // Read depth: posts only, once per mark per page view. This script runs in
  // the head, so the post is looked for once the page has been parsed.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', readDepth);
  else readDepth();
  function readDepth() {
    const article = document.querySelector('[data-read-depth]');
    if (!article || !('IntersectionObserver' in window)) return;
    const marks: [number, Element][] = [];
    for (const depth of [50, 100]) {
      const mark = document.createElement('span');
      mark.setAttribute('aria-hidden', 'true');
      mark.style.cssText = 'display:block;height:1px;margin:0;';
      if (depth === 100) article.appendChild(mark);
      else {
        const blocks = article.children;
        const half = blocks[Math.floor(blocks.length / 2)];
        if (!half) continue;
        article.insertBefore(mark, half);
      }
      marks.push([depth, mark]);
    }
    const seen = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const found = marks.find(([, m]) => m === entry.target);
        if (found) track('read', { depth: String(found[0]), page: location.pathname });
        seen.unobserve(entry.target);
      }
    });
    marks.forEach(([, m]) => seen.observe(m));
  }
}
