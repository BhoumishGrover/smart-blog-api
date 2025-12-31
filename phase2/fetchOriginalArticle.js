import axios from 'axios';
import 'dotenv/config';

/**
 * Fetches the most recent original article from the backend API
 * @returns {Promise<Object>} Article object with id, title, content, original_url
 * @throws {Error} If no original articles exist or API request fails
 */
export async function fetchOriginalArticle() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  try {
    console.log('Fetching articles from API...');
    const response = await axios.get(`${baseUrl}/articles`);
    const articles = response.data;
    
    // Filter for original articles only
    const originalArticles = articles.filter(article => article.source === 'original');
    
    if (originalArticles.length === 0) {
      throw new Error('No original articles found in the database');
    }
    
    // Sort by created_at descending and get the most recent
    const mostRecent = originalArticles.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    )[0];
    
    console.log(`Found article: "${mostRecent.title}"`);
    
    return {
      id: mostRecent.id,
      title: mostRecent.title,
      content: mostRecent.content,
      original_url: mostRecent.original_url
    };
  } catch (error) {
    if (error.response) {
      throw new Error(`API request failed: ${error.response.status} ${error.response.statusText}`);
    } else if (error.request) {
      throw new Error('No response from API. Is the backend server running?');
    } else {
      throw error;
    }
  }
}
