// scripts/generate-sitemap.js
import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Static routes
const staticRoutes = [
  '/',
  '/landing',
  '/explore',
  '/about-us',
  '/forgot-password',
  '/signin',
  '/signup',
];

// 2. Optional: dynamic slugs JSON (e.g. products/categories)
// route-list.json should be ["category/fruits-vegetables", "product/abc123", …]
let dynamicRoutes = [];
try {
  const raw = await readFile(
    path.resolve(__dirname, '../src/utils/route-list.json'),
    'utf8'
  );
  dynamicRoutes = JSON.parse(raw);
} catch {
  console.warn('No dynamic route list found; skipping dynamic URLs.');
}

async function buildSitemap() {
  const hostname = 'https://bellybasketstore.in';
  const sitemap = new SitemapStream({ hostname });
  const writeStream = createWriteStream(
    path.resolve(__dirname, '../public/sitemap.xml')
  );
  sitemap.pipe(writeStream);

  staticRoutes.forEach((url) =>
    sitemap.write({ url, changefreq: 'daily', priority: 0.9 })
  );
  dynamicRoutes.forEach((slug) =>
    sitemap.write({ url: `/${slug}`, changefreq: 'weekly', priority: 0.7 })
  );

  sitemap.end();
  await streamToPromise(sitemap);
  console.log('✅ public/sitemap.xml generated');
}

buildSitemap().catch(console.error);
