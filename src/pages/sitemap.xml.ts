import type { APIRoute } from 'astro';

const routes = [
  '',
  'about/',
  'contact/',
  'privacy-policy/',
  'terms/',
];

export const GET: APIRoute = ({ site }) => {
  const siteUrl = site ? site.href.replace(/\/$/, '') : 'https://slopecalculator.pages.dev';
  const urls = routes
    .map(
      (path) => `  <url>
    <loc>${siteUrl}/${path}</loc>
    <changefreq>monthly</changefreq>
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
