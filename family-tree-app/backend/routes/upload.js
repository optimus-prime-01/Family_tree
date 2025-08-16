const express = require('express');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const { uploadImage, deleteImage } = require('../config/cloudinary');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Upload profile picture for family member
router.post('/profile-picture', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Upload to Cloudinary
    const result = await uploadImage(req.file, 'family-tree-app/profile-pictures');

    res.json({
      message: 'Image uploaded successfully',
      imageUrl: result.url,
      publicId: result.publicId
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
});

// Upload family tree member photo
router.post('/member-photo', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Upload to Cloudinary
    const result = await uploadImage(req.file, 'family-tree-app/member-photos');

    res.json({
      message: 'Member photo uploaded successfully',
      imageUrl: result.url,
      publicId: result.publicId
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading member photo' });
  }
});

// Delete image from Cloudinary
router.delete('/:publicId', auth, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    // Delete from Cloudinary
    const result = await deleteImage(publicId);

    res.json({
      message: 'Image deleted successfully',
      result
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Error deleting image' });
  }
});

// Get image info
router.get('/info/:publicId', auth, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    // Get info from Cloudinary
    const { getImageInfo } = require('../config/cloudinary');
    const result = await getImageInfo(publicId);

    res.json({
      imageInfo: result
    });
  } catch (error) {
    console.error('Get info error:', error);
    res.status(500).json({ message: 'Error getting image info' });
  }
});

module.exports = router; 