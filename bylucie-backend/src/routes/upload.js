import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Needed to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Setup multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Create the multer instance with limits
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 5, // Max number of files
  },
  fileFilter: function (req, file, cb) {
    // Limit to images/videos based on mime type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Unsupported file type'), false);
    }
    cb(null, true);
  }
});

// POST /api/upload - upload files
router.post('/', upload.array('files'), (req, res) => {
  if (!req.files) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  // Return array of uploaded file info (you could add URLs or process more)
  const uploadedFiles = req.files.map(file => ({
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  }));

  res.status(200).json({ success: true, files: uploadedFiles });
});

export default router;
