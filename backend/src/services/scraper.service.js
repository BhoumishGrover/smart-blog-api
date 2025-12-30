import axios from 'axios';
import * as cheerio from 'cheerio';

const MAX_ARTICLES = 5;

function extractReadableContent($, $container) {
  const allowedTags = ['p', 'h2', 'h3', 'li'];
  const blocks = [];
  $container.find(allowedTags.join(',')).each((i, el) => {
    const text = $(el).text().trim();
    if (text) {
      blocks.push(text);
    }
  });
  return blocks.join('\n\n');
}

async function scrape() {
  try {
    // Scrape main page for latest articles (collect more candidates)
    const baseUrl = 'https://beyondchats.com/blogs/';
    const response = await axios.get(baseUrl);
    const $ = cheerio.load(response.data);
    const articles = [];
    // Assuming articles are in h2 a
    $('h2 a').each((i, el) => {
      const title = $(el).text().trim();
      const url = $(el).attr('href');
      if (title && url) {
        articles.push({ title, url });
      }
    });
    const scrapedArticles = [];
    for (const art of articles) {
      if (scrapedArticles.length === MAX_ARTICLES) {
        console.log('Reached max article limit, stopping scrape');
        break;
      }
      try {
        const artResponse = await axios.get(art.url);
        const $art = cheerio.load(artResponse.data);
        const fullTitle = $art('h1').first().text().trim();

        // Remove noisy elements aggressively
        $art('nav, footer, header, aside, .comments, .comment, .related-posts, .author, .share, .breadcrumb, .cta, script, style').remove();

        // Select main content container - hard target Elementor container
        const $contentContainer = $art('.elementor-widget-theme-post-content');
        const usedSelector = 'elementor-widget-theme-post-content';

        if ($contentContainer.length === 0) {
          console.warn(`Warning: Elementor content container not found for article: ${art.url}`);
          continue; // Skip this article
        }

        const content = extractReadableContent($art, $contentContainer);

        console.log(`Scraped: ${fullTitle} | Content length: ${content.length} | Selector used: ${usedSelector}`);

        scrapedArticles.push({
          title: fullTitle || art.title,
          content,
          original_url: art.url
        });
      } catch (error) {
        console.error('Error scraping article:', art.url, error.message);
      }
    }
    return scrapedArticles;
  } catch (error) {
    console.error('Error scraping:', error.message);
    return [];
  }
}

export { scrape };