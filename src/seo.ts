import { LINKS, SITE_DESCRIPTION, SITE_TITLE } from './consts';

// What a search engine reads about a page beyond its tags: schema.org JSON-LD.
// Every page names the organisation and the site; a post adds a BlogPosting.
const SITE = 'https://integratn.io/';
const organization = {
  '@type': 'Organization',
  '@id': `${SITE}#organization`,
  name: SITE_TITLE,
  url: SITE,
  // Search engines want a raster logo; the PNG is the SVG mark at 512px.
  logo: `${SITE}brand/integratn-mark.png`,
  founder: { '@id': `${SITE}about/#person` },
  sameAs: [LINKS.github, LINKS.mastodon],
};
const person = {
  '@type': 'Person',
  '@id': `${SITE}about/#person`,
  name: 'James Dreier',
  url: `${SITE}about/`,
  sameAs: [LINKS.linkedin],
};
const website = {
  '@type': 'WebSite',
  '@id': `${SITE}#website`,
  name: SITE_TITLE,
  url: SITE,
  description: SITE_DESCRIPTION,
  publisher: { '@id': `${SITE}#organization` },
};

interface Page {
  url: URL;
  title?: string;
  description: string;
  image: URL;
  article?: { published: Date; modified?: Date; tags?: string[] };
}

export function structuredData({ url, title, description, image, article }: Page) {
  const graph: object[] = [organization, person, website];
  if (article) {
    graph.push({
      '@type': 'BlogPosting',
      '@id': `${url}#article`,
      mainEntityOfPage: url.href,
      headline: title,
      description,
      image: image.href,
      datePublished: article.published.toISOString(),
      dateModified: (article.modified ?? article.published).toISOString(),
      keywords: article.tags,
      author: { '@id': `${SITE}about/#person` },
      publisher: { '@id': `${SITE}#organization` },
      isPartOf: { '@id': `${SITE}#website` },
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}
