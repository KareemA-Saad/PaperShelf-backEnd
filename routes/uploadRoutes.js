const express = require('express');
const router = express.Router();

const {
  uploadBookCover,
  uploadBookImages,
  handleUploadError,
} = require('../middlewares/upload');

// ✅ API لرفع صورة الغلاف
router.post('/book-cover', uploadBookCover, handleUploadError, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const filePath = `uploads/book-covers/${req.file.filename}`;
  res.status(200).json({ success: true, path: filePath });
});

// ✅ API لرفع صور متعددة
router.post('/book-images', uploadBookImages, handleUploadError, (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }

  const paths = req.files.map(file => `uploads/book-covers/${file.filename}`);
  res.status(200).json({ success: true, paths });
});

module.exports = router;
