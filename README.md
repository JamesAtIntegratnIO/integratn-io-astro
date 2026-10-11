# integratn.io

The Integratn site: a front page for the products (Specmarshal, Bosun) and the
blog behind it. Astro 5, static output, built on every pull request by the Build
workflow.

```sh
npm ci
npm run dev     # http://localhost:4321
npm run build   # astro check, then astro build into dist/
```

## Layout

| Path | What |
|---|---|
| `src/pages/index.astro` | The front page |
| `src/pages/products/specmarshal.astro` | Specmarshal's page (coming soon) |
| `src/pages/products/bosun.astro` | Bosun's page |
| `src/pages/blog/` | The blog, its posts, and the tag, series and category indexes |
| `src/content/posts/` | The posts, as markdown |
| `src/layouts/Base.astro` | The shell every page shares |
| `src/styles/site.css` | The site's layout |
| `src/styles/surface.css` | Specmarshal's stylesheet, generated (below) |
| `src/specmarshal/theme.ts` | Specmarshal's display-mode toggle, copied (below) |
| `public/brand/` | The Integratn, Specmarshal and Bosun marks |
| `public/og/` | The link-preview cards, generated (below) |

Old addresses (`/posts/...`, `/tags/...`, `/series/...`, `/categories/...`)
redirect to their `/blog/...` pages; the map is in `astro.config.mjs`.

## Link-preview cards

A shared link shows a 1200x630 card: `public/og/integratn.png` for most pages,
and one each for Specmarshal and Bosun (a page picks its card with `image` on
`Base`). `npm run og` draws them from `scripts/og.mjs` and the marks in
`public/brand/`; run it after changing a card's wording or a mark, and commit
the PNGs. The build itself does not draw them.

## Specmarshal's stylesheet

The site wears Specmarshal's design system: its tokens (colours for dark and
light, type, radius, spacing) and its components (chip, trigger, callout, prose,
phase strip, display-mode toggle) come from the product's own
`src/web/surface.css`, compiled by Tailwind against this site's sources so the
utilities the markup uses are included. `site.css` only arranges them and uses
nothing but tokens. Neither file is edited by hand.

To refresh both from a Specmarshal checkout (`$CORE`) after the design system
changes:

```sh
SITE=$PWD
cd "$CORE"
printf '@import "./surface.css";\n@source "%s/src";\n' "$SITE" > src/web/.site-entry.css
npx tailwindcss -i src/web/.site-entry.css -o "$SITE/src/styles/surface.css" --minify
rm src/web/.site-entry.css
```

`src/specmarshal/theme.ts` holds `themeToggle()`, `THEME_HEAD_SCRIPT` and
`THEME_TOGGLE_SCRIPT` from `$CORE/src/web/theme.ts`, as strings. Update the
commit noted at the top of each file when you regenerate them.

## Analytics

`src/analytics.ts` holds the analytics switch. While `ANALYTICS` is `null` the site loads no tracker and sends nothing; it is set to Umami, whose tracker the Pages Function `functions/c.js` serves at `/c` (a Function's route is its file name without the extension). To change tools, set `ANALYTICS` to one of Umami, Plausible or GoatCounter. All three are cookieless, so the site needs no consent banner. Only visits on `ANALYTICS_HOSTS` are counted; deploy previews and `astro dev` are not.

Page views come from the tool. The site adds three events:

- `click`: a link marked `data-track="<name>"`, such as a product page's buttons.
- `outbound`: a link to another site.
- `read`: a blog post read to its middle (`50`) and to its end (`100`).

To count a new button, give it a `data-track` name.
