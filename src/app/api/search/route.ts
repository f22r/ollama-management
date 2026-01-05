
import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: NextRequest) {
    try {
        const { query } = await req.json();
        if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

        // 1. Initial Search (DuckDuckGo HTML)
        const res = await fetch(`https://html.duckduckgo.com/html?q=${encodeURIComponent(query)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const html = await res.text();
        const $ = cheerio.load(html);
        const searchResults: { title: string; link: string; snippet: string }[] = [];

        $('.result').each((i, el) => {
            if (i >= 3) return; // Limit to 3 results for deep crawl
            const title = $(el).find('.result__title a').text().trim();
            const link = $(el).find('.result__title a').attr('href');
            const snippet = $(el).find('.result__snippet').text().trim();

            if (title && link) {
                searchResults.push({ title, link, snippet });
            }
        });

        // 2. Deep Crawl
        const detailedResults = await Promise.all(searchResults.map(async (result) => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

                const pageRes = await fetch(result.link, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!pageRes.ok) return result;

                const pageHtml = await pageRes.text();
                const $page = cheerio.load(pageHtml);

                // Cleanup
                $page('script, style, nav, footer, iframe, header, noscript, asid, .ad').remove();

                // Extract Main Text
                let text = '';
                $page('p, h1, h2, h3, li').each((_, el) => {
                    const t = $page(el).text().trim();
                    // heuristic: keep paragraphs with some length
                    if (t.length > 20) text += t + '\n';
                });

                // Limit content length
                const cleanedText = text.replace(/\n\s*\n/g, '\n').slice(0, 1500);

                return {
                    ...result,
                    content: cleanedText || result.snippet
                };
            } catch (e) {
                // Return original result on crawl failure
                return result;
            }
        }));

        return NextResponse.json({ results: detailedResults });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
