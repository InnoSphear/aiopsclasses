import { Router } from 'express';
import sitemapController from '../controllers/sitemap.controller.js';

const router = Router();

router.get('/sitemap.xml', sitemapController.generateSitemap);
router.get('/robots.txt', sitemapController.generateRobots);

export default router;
