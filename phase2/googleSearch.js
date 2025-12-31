import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Searches Google for articles related to the given query
 * Returns the top 2 organic blog/article URLs
 * @param {string} query - The search query (typically an article title)
 * @returns {Promise<Array<{title: string, url: string}>>} Top 2 organic results
 * @throws {Error} If fewer than 2 valid results are found
 */
export async function searchGoogleForArticles(query) {
  try {
    console.log(`\nSearching Google for: "${query}"`);

    const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9'
    };

    const response = await axios.get(searchUrl, {
      headers,
      timeout: 30000
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Select result containers from both selectors
    const resultContainers = $('div.result').toArray().concat($('div.results > div').toArray());
    console.log(`Found ${resultContainers.length} raw result containers`);

    const results = [];

    for (let i = 0; i < resultContainers.length; i++) {
      const element = resultContainers[i];
      const anchorTags = $(element).find('a').toArray();

      // Granular debug logging for first 3 containers
      if (i < 3) {
        const hrefs = anchorTags.map(a => $(a).attr('href')).filter(Boolean);
        console.log(`Result container ${i + 1}: Found ${anchorTags.length} anchor tags`);
        console.log(`Result container ${i + 1}: hrefs:`, hrefs);
      }

      let linkElement = null;

      for (const a of anchorTags) {
        let href = $(a).attr('href');
        if (!href) continue;

        // Normalize protocol-relative URLs
        if (href.startsWith('//')) {
          href = 'https:' + href;
        }

        if (href.startsWith('http') || href.startsWith('https://duckduckgo.com/l/?uddg=')) {
          linkElement = $(a);
          break;
        }
      }

      if (linkElement) {
        let url = linkElement.attr('href');

        // Normalize protocol-relative URLs
        if (url && url.startsWith('//')) {
          url = 'https:' + url;
        }

        let title = linkElement.text().trim();

        if (!title) {
          // Fallback to container text if anchor text is empty
          title = $(element).text().trim();
        }

        if (url && url.startsWith('https://duckduckgo.com/l/?uddg=')) {
          try {
            const urlObj = new URL(url);
            const uddgParam = urlObj.searchParams.get('uddg');
            if (uddgParam) {
              url = decodeURIComponent(uddgParam);
            } else {
              // Skip if uddg param missing
              continue;
            }
          } catch {
            // Skip if decoding fails
            continue;
          }
        }

        // Normalize and validate URL
        if (url && url.startsWith('http')) {
          const lowerUrl = url.toLowerCase();
          if (!lowerUrl.includes('duckduckgo.com') && !lowerUrl.includes('beyondchats.com')) {
            results.push({ title, url });
          }
        }
      }
    }

    console.log(`Extracted ${results.length} links before filtering`);

    const filteredResults = results;

    console.log(`Found ${filteredResults.length} search results`);

    const topResults = filteredResults.slice(0, 2);

    if (topResults.length < 2) {
      throw new Error(`Only found ${topResults.length} valid results, need at least 2`);
    }

    console.log(`Selected top ${topResults.length} reference articles:`);
    topResults.forEach((res, idx) => {
      console.log(`  ${idx + 1}. ${res.url}`);
    });

    return topResults;

  } catch (error) {
    if (error.message.includes('valid results')) {
      throw error;
    }
    throw new Error(`Google search failed: ${error.message}`);
  }
}
