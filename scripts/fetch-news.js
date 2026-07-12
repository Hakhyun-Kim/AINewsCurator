#!/usr/bin/env node
// Fetches all RSS feeds server-side (no browser CORS restrictions) and writes
// public/news.json, which the built app serves same-origin. The deploy
// workflow runs this before `npm run build` on an hourly schedule, so the
// published site gets fresh news without relying on third-party CORS/RSS
// services at runtime. Requires Node 18+ (global fetch).

const fs = require('fs');
const path = require('path');
const NEWS_SOURCES = require('../src/newsSources.json');

const MAX_PER_SOURCE = 30;

function decodeEntities(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&');
}

function stripHtml(html) {
  return decodeEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function tagContent(item, name) {
  const m = item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  if (!m) return '';
  return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
}

function imageOf(item) {
  const m = item.match(/<(?:media:content|media:thumbnail|enclosure)[^>]*url=["']([^"']+)["']/i);
  return m ? m[1] : '';
}

async function fetchSource(source) {
  const response = await fetch(source.rss, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AINewsCurator snapshot fetcher)' },
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const xml = await response.text();
  const items = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) || [];
  return items
    .slice(0, MAX_PER_SOURCE)
    .map((item) => {
      const pubDate = tagContent(item, 'pubDate') || tagContent(item, 'dc:date');
      const date = new Date(pubDate);
      return {
        title: stripHtml(tagContent(item, 'title')),
        description: stripHtml(tagContent(item, 'description')).slice(0, 300),
        url: stripHtml(tagContent(item, 'link')),
        publishedAt: Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString(),
        source: source.name,
        imageUrl: imageOf(item)
      };
    })
    .filter((article) => article.title && article.url);
}

async function main() {
  const snapshot = { generatedAt: new Date().toISOString() };
  for (const [language, sources] of Object.entries(NEWS_SOURCES)) {
    const results = await Promise.allSettled(sources.map(fetchSource));
    const seen = new Set();
    const articles = [];
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        console.log(`${language}/${sources[i].name}: ${result.value.length} articles`);
        result.value.forEach((article) => {
          if (!seen.has(article.url)) {
            seen.add(article.url);
            articles.push(article);
          }
        });
      } else {
        // A failed source must not fail the run; the client's live-fetch
        // fallback covers the gap.
        console.error(`${language}/${sources[i].name}: FAILED — ${result.reason.message}`);
      }
    });
    snapshot[language] = articles;
  }
  const outPath = path.join(__dirname, '..', 'public', 'news.json');
  fs.writeFileSync(outPath, JSON.stringify(snapshot));
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
