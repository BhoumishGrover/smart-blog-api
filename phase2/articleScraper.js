import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Scrapes the main readable content from an article URL.
 * Extracts headings, paragraphs, and list items as plain text.
 *
 * @param {string} url
 * @returns {Promise<{url: string, content: string, length: number}>}
 */
export async function scrapeArticleContent(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    // Remove non-content elements
    $('script, style, nav, footer, header, aside').remove();

    // Identify main content container (heuristic-based)
    let container =
      $('article').first().length
        ? $('article').first()
        : $('main').first().length
        ? $('main').first()
        : $('div[class*="content"]').first().length
        ? $('div[class*="content"]').first()
        : $('div[class*="post"]').first().length
        ? $('div[class*="post"]').first()
        : $('body');

    // Extract text blocks
    let textParts = [];
    container.find('h1, h2, h3, p, li').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text.length > 0) {
        textParts.push(text);
      }
    });

    if (textParts.length === 0) {
      throw new Error('No readable content found');
    }

    const content = textParts.join('\n\n');

    return {
      url,
      content,
      length: content.length,
    };
  } catch (error) {
    throw new Error(`Failed to fetch article (${error.response?.status || 'unknown error'})`);
  }
}
