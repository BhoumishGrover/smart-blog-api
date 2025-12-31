import { fetchOriginalArticle } from './fetchOriginalArticle.js';
import { searchGoogleForArticles } from './googleSearch.js';

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
    
    // Step 2: Search Google for reference articles
    const referenceArticles = await searchGoogleForArticles(article.title);
    
    console.log('\n--- Reference Articles ---');
    referenceArticles.forEach((ref, index) => {
      console.log(`\n${index + 1}. ${ref.title}`);
      console.log(`   URL: ${ref.url}`);
    });
    
    console.log('\n✓ Google search completed successfully');
    
  } catch (error) {
    console.error('\n✗ Pipeline failed:', error.message);
    process.exit(1);
  }
}

main();
