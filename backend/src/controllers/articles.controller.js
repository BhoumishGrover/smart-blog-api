import { scrape } from '../services/scraper.service.js';
import pool from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

export const scrapeArticles = async (req, res) => {
  try {
    const articles = await scrape();
    let inserted = 0;
    for (const article of articles) {
      const existing = await pool.query('SELECT id FROM articles WHERE original_url = $1', [article.original_url]);
      if (existing.rows.length === 0) {
        await pool.query(
          'INSERT INTO articles (id, title, content, original_url, source) VALUES ($1, $2, $3, $4, $5)',
          [uuidv4(), article.title, article.content, article.original_url, 'original']
        );
        inserted++;
      }
    }
    res.status(200).json({ message: `${inserted} articles inserted` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createArticle = async (req, res) => {
  const { title, content, original_url, original_article_id, source } = req.body;
  if (!title || !content || !original_url) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    // If this is an updated article, make the operation idempotent
    if (source === 'updated' && original_article_id) {
      const existing = await pool.query(
        'SELECT id FROM articles WHERE original_article_id = $1 AND source = $2',
        [original_article_id, 'updated']
      );

      if (existing.rows.length > 0) {
        const updated = await pool.query(
          'UPDATE articles SET title = $1, content = $2, original_url = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
          [title, content, original_url, existing.rows[0].id]
        );

        return res.status(200).json({
          message: 'Updated existing rewritten article',
          article: updated.rows[0],
        });
      }
    }

    // Otherwise, insert a new article
    const result = await pool.query(
      'INSERT INTO articles (id, title, content, original_url, original_article_id, source) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [uuidv4(), title, content, original_url, original_article_id || null, source || 'original']
    );

    res.status(201).json({
      message: 'Article created',
      article: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') { // unique violation
      res.status(409).json({ error: 'Article with this URL already exists' });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const getArticles = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM articles ORDER BY created_at DESC');
    res.json(result.rows);
    console.log('Fetched articles:', result.rows.length);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getArticleById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM articles WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateArticle = async (req, res) => {
  const { id } = req.params;
  const { title, content, original_url } = req.body;
  if (!title || !content || !original_url) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const result = await pool.query(
      'UPDATE articles SET title = $1, content = $2, original_url = $3, source = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      [title, content, original_url, 'updated', id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'Article with this URL already exists' });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const deleteArticle = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM articles WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.status(200).json({ message: 'Article deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};