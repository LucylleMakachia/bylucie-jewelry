import express from 'express';
import fs from 'fs/promises'; // Use promises version
import fsSync from 'fs'; // For sync operations where needed
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateClerk, requireAdmin } from '../middleware/clerkAuth.js';

// Initialize router
const router = express.Router();

// --- SAFE PATH RESOLUTION ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');
const dataFilePath = path.join(dataDir, 'pagesContent.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Helper to read pages content JSON file
async function readPages() {
  try {
    await ensureDataDir();

    try {
      await fs.access(dataFilePath);
    } catch {
      const defaultPages = {
        about: 'About us content goes here',
        contact: 'Contact us content goes here',
        terms: 'Terms and conditions go here',
      };
      await fs.writeFile(dataFilePath, JSON.stringify(defaultPages, null, 2));
      return defaultPages;
    }

    const data = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading pages content:', err);
    throw new Error('Failed to read pages content');
  }
}

// Helper to write pages content JSON file
async function writePages(pages) {
  try {
    await ensureDataDir();
    await fs.writeFile(dataFilePath, JSON.stringify(pages, null, 2));
  } catch (err) {
    console.error('Error writing pages content:', err);
    throw new Error('Failed to write pages content');
  }
}

// --- ROUTES ---

// GET specific static pages
router.get('/about', async (req, res, next) => {
  try {
    const pages = await readPages();
    res.json({ content: pages.about || 'About page content' });
  } catch (err) {
    next(err);
  }
});

router.get('/terms', async (req, res, next) => {
  try {
    const pages = await readPages();
    res.json({ content: pages.terms || 'Terms page content' });
  } catch (err) {
    next(err);
  }
});

router.get('/contact', async (req, res, next) => {
  try {
    const pages = await readPages();
    res.json({ content: pages.contact || 'Contact page content' });
  } catch (err) {
    next(err);
  }
});

// GET any dynamic page by name
router.get('/:page', async (req, res, next) => {
  try {
    const pages = await readPages();
    const pageName = req.params.page.toLowerCase();

    if (!pages[pageName]) {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json({ content: pages[pageName] });
  } catch (err) {
    next(err);
  }
});

// PUT (admin-only) update page content
router.put(
  '/:page',
  authenticateClerk,
  requireAdmin,
  express.json(),
  async (req, res, next) => {
    try {
      const pages = await readPages();
      const pageName = req.params.page.toLowerCase();
      const { content } = req.body;

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: 'Invalid content' });
      }

      pages[pageName] = content;
      await writePages(pages);

      res.json({
        message: 'Page content updated successfully',
        page: pageName,
        content: pages[pageName],
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET all pages (for admin dashboard)
router.get('/', async (req, res, next) => {
  try {
    const pages = await readPages();
    res.json({ pages });
  } catch (err) {
    next(err);
  }
});

export default router;
