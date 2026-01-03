import 'dotenv/config';
import axios from 'axios';
import readline from 'readline';
import { fetchOriginalArticle } from './fetchOriginalArticle.js';
import { searchGoogleForArticles } from './googleSearch.js';
import { scrapeArticleContent } from './articleScraper.js';
import { rewriteArticle } from './llmRewrite.js';

async function main() {
  try {
    console.log('=== Phase 2: Content Automation Pipeline ===\n');

    // Step 1: Fetch all articles directly from backend
    const backendUrl = process.env.BASE_URL || 'http://localhost:3000';
    const response = await axios.get(`${backendUrl}/articles`);
    const articlesArray = response.data;

    if (!Array.isArray(articlesArray) || articlesArray.length === 0) {
      console.error('Backend response shape:', response.data);
      throw new Error('No articles found in backend');
    }

    console.log(`Fetched ${articlesArray.length} articles from backend`);

    console.log('\nSelect an article to rewrite:\n');
    articlesArray.forEach((art, idx) => {
      console.log(`[${idx + 1}] ${art.title}`);
    });

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const articleIndex = await new Promise((resolve) => {
      rl.question('\nEnter article number: ', (answer) => {
        rl.close();
        resolve(parseInt(answer, 10));
      });
    });

    if (
      isNaN(articleIndex) ||
      articleIndex < 1 ||
      articleIndex > articlesArray.length
    ) {
      throw new Error('Invalid article selection');
    }

    const article = articlesArray[articleIndex - 1];
    
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

    // Step 4: Rewrite the original article using reference insights
    console.log('\nRewriting article with LLM...');
    const { rewrittenContent, referenceUrls } = await rewriteArticle({
      originalArticle: { title: article.title, content: article.content },
      referenceArticles: successfulArticles.slice(0, 2)
    });

    console.log('\n--- Rewritten Article Preview ---');
    console.log('Length:', rewrittenContent.length, 'characters');
    console.log('Preview:', rewrittenContent.slice(0, 500));

    // Step 5: Append references to content and create new article via backend API
    console.log('\nAppending references and posting to backend...');
    const referencesSection = `\n\n## References\n${referenceUrls.map(url => `- ${url}`).join('\n')}`;
    const finalContent = rewrittenContent + referencesSection;

    const newArticlePayload = {
      title: `Updated: ${article.title}`,
      content: finalContent,
      original_url: `${article.original_url}-rewritten`,
      original_article_id: article.id,
      source: 'updated'
    };

    const postResponse = await axios.post(
      `${backendUrl}/articles`,
      newArticlePayload
    );

    const createdArticle = postResponse.data;
    console.log('\n✓ Success! New article created.');
    console.log(`Original Article ID: ${article.id}`);
    console.log(`Rewritten Article ID: ${createdArticle.id}`);
    console.log(`Title: ${createdArticle.title}`);
    console.log(`Source: ${createdArticle.source}`);
    
  } catch (error) {
    console.error('\n✗ Pipeline failed:', error.message);
    process.exit(1);
  }
}

main();
