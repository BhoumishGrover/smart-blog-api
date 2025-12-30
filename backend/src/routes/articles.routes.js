import express from 'express';
import * as articlesController from '../controllers/articles.controller.js';

const router = express.Router();

router.post('/scrape', articlesController.scrapeArticles);
router.post('/', articlesController.createArticle);
router.get('/', articlesController.getArticles);
router.get('/:id', articlesController.getArticleById);
router.put('/:id', articlesController.updateArticle);
router.delete('/:id', articlesController.deleteArticle);

export default router;