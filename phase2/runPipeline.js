import { fetchOriginalArticle } from './fetchOriginalArticle.js';
import { searchGoogleForArticles } from './googleSearch.js';
import { scrapeArticleContent } from './articleScraper.js';

async function main() {
  try {
    console.log('=== Phase 2: Content Automation Pipeline ===\n');
    
    // Step 1: Fetch the most recent original article
    const article = await fetchOriginalArticle();
    
    console.log('\n--- Article Details ---');
    console.log('ID:', article.id);
    console.log('Title:', article.title);
    console.log('Content Length:', article.content.length, 'characters');
    console.log('Original URL:', article.original_url);
    
    console.log('\n✓ Article fetched successfully');
    
    // Step 2: Search Google for reference articles (get many candidates)
    const referenceArticles = await searchGoogleForArticles(article.title);
    console.log(`\n✓ Google search completed successfully with ${referenceArticles.length} candidates`);
    
    // Step 3: Scrape reference articles' content, stopping after 2 successes
    console.log('\nScraping reference articles (need 2 successes)...');
    const successfulArticles = [];
    let tried = 0;

    for (const ref of referenceArticles) {
      tried += 1;
      try {
        const articleContent = await scrapeArticleContent(ref.url);
        console.log('\n--- Scraped Article ---');
        console.log('URL:', articleContent.url);
        console.log('Content Length:', articleContent.length, 'characters');
        console.log('Preview:', articleContent.content.slice(0, 300));
        successfulArticles.push(articleContent);
      } catch (scrapeError) {
        console.error(`\nSkipping URL (scrape failed): ${ref.url}`);
        console.error('Reason:', scrapeError.message);
      }

      if (successfulArticles.length === 2) {
        break;
      }
    }

    if (successfulArticles.length < 2) {
      throw new Error(`Only scraped ${successfulArticles.length} articles after trying ${tried} URLs`);
    }

    console.log(`\n✓ Scraping complete. Tried ${tried} URLs, succeeded on ${successfulArticles.length}.`);
    console.log('\n--- Final Reference Articles ---');
    successfulArticles.slice(0, 2).forEach((art, idx) => {
      console.log(`\n${idx + 1}. ${art.url}`);
      console.log(`   Content Length: ${art.length}`);
    });
    
  } catch (error) {
    console.error('\n✗ Pipeline failed:', error.message);
    process.exit(1);
  }
}

main();
