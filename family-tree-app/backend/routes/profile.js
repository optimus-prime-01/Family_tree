const express = require('express');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const { uploadProfileImage, deleteImage } = require('../config/cloudinary');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('File filter check:', file);
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      console.log('File type accepted:', file.mimetype);
      cb(null, true);
    } else {
      console.log('File type rejected:', file.mimetype);
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload profile image
router.post('/upload-image', auth, upload.single('profileImage'), (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    return res.status(400).json({ 
      message: 'File upload error', 
      error: err.message 
    });
  } else if (err) {
    console.error('Other upload error:', err);
    return res.status(400).json({ 
      message: 'File upload error', 
      error: err.message 
    });
  }
  next();
}, async (req, res) => {
  try {
    console.log('Profile image upload request received');
    console.log('File:', req.file);
    console.log('User:', req.user._id);

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const user = req.user;

    // Delete previous profile image if it exists
    if (user.profilePicture && user.profilePicture.publicId) {
      try {
        console.log('Deleting previous profile image:', user.profilePicture.publicId);
        await deleteImage(user.profilePicture.publicId);
      } catch (error) {
        console.error('Error deleting previous profile image:', error);
      }
    }

    // Convert buffer to temporary file path for Cloudinary
    const tempFilePath = `temp_${Date.now()}_${req.file.originalname}`;
    console.log('Creating temporary file:', tempFilePath);
    require('fs').writeFileSync(tempFilePath, req.file.buffer);

    // Upload to Cloudinary
    console.log('Uploading to Cloudinary...');
    const uploadResult = await uploadProfileImage({ path: tempFilePath });
    console.log('Cloudinary upload result:', uploadResult);

    // Clean up temporary file
    require('fs').unlinkSync(tempFilePath);
    console.log('Temporary file cleaned up');

    // Update user profile picture
    user.profilePicture = {
      url: uploadResult.url,
      publicId: uploadResult.publicId
    };

    console.log('Updating user profile picture:', user.profilePicture);
    await user.save();

    const publicProfile = user.getPublicProfile();
    console.log('Returning public profile:', publicProfile);
    console.log('Profile picture in response:', publicProfile.profilePicture);

    res.json({
      message: 'Profile image uploaded successfully',
      user: publicProfile
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({ 
      message: 'Failed to upload profile image',
      error: error.message 
    });
  }
});

// Delete profile image
router.delete('/delete-image', auth, async (req, res) => {
  try {
    const user = req.user;

    if (!user.profilePicture || !user.profilePicture.publicId) {
      return res.status(400).json({ message: 'No profile image to delete' });
    }

    // Delete from Cloudinary
    try {
      await deleteImage(user.profilePicture.publicId);
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
    }

    // Remove from user profile
    user.profilePicture = {
      url: null,
      publicId: null
    };

    await user.save();

    res.json({
      message: 'Profile image deleted successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Profile image deletion error:', error);
    res.status(500).json({ message: 'Failed to delete profile image' });
  }
});

// Get profile image
router.get('/image', auth, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      profilePicture: user.profilePicture
    });
  } catch (error) {
    console.error('Get profile image error:', error);
    res.status(500).json({ message: 'Failed to get profile image' });
  }
});

module.exports = router; 