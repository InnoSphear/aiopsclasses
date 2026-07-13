import blogService from '../services/blog.service.js';
import courseRepository from '../repositories/course.repository.js';

const SITE_URL = process.env.CLIENT_URL || 'https://aiopsclasses.com';

const staticPages = [
  { url: '/', changefreq: 'daily', priority: '1.0' },
  { url: '/pricing', changefreq: 'weekly', priority: '0.9' },
  { url: '/blog', changefreq: 'daily', priority: '0.9' },
  { url: '/register', changefreq: 'monthly', priority: '0.8' },
  { url: '/login', changefreq: 'monthly', priority: '0.5' },
];

const escapeXml = (str) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

const sitemapController = {
  async generateSitemap(req, res) {
    try {
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
      xml += '  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n';
      xml += '  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

      const today = formatDate(new Date());

      // Static pages
      for (const page of staticPages) {
        xml += '  <url>\n';
        xml += `    <loc>${SITE_URL}${page.url}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += '  </url>\n';
      }

      // Published blogs
      try {
        const blogs = await blogService.getSitemapData();
        for (const blog of blogs) {
          const lastmod = formatDate(blog.publishedAt || blog.updatedAt);
          xml += '  <url>\n';
          xml += `    <loc>${SITE_URL}/blog/${escapeXml(blog.slug)}</loc>\n`;
          xml += `    <lastmod>${lastmod}</lastmod>\n`;
          xml += '    <changefreq>weekly</changefreq>\n';
          xml += '    <priority>0.8</priority>\n';
          xml += '  </url>\n';
        }
      } catch {
        // Blog collection may not exist yet
      }

      // Published courses
      try {
        const courses = await courseRepository.findPublished();
        for (const course of courses) {
          const lastmod = formatDate(course.updatedAt);
          xml += '  <url>\n';
          xml += `    <loc>${SITE_URL}/courses/${escapeXml(course.code?.toLowerCase() || course.name?.toLowerCase().replace(/\s+/g, '-'))}</loc>\n`;
          xml += `    <lastmod>${lastmod}</lastmod>\n`;
          xml += '    <changefreq>weekly</changefreq>\n';
          xml += '    <priority>0.7</priority>\n';
          xml += '  </url>\n';
        }
      } catch {
        // Course collection may not exist
      }

      xml += '</urlset>';

      res.set('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      res.status(500).send('Error generating sitemap');
    }
  },

  generateRobots(req, res) {
    const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /dashboard/
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`;
    res.set('Content-Type', 'text/plain');
    res.send(robots);
  },
};

export default sitemapController;
