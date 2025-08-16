const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dwyamwrzm',
  api_key: '262527919967674',
  api_secret: 'RSQVCZRtYHizds0acqeOkczpm4I'
});

// Upload image to Cloudinary
const uploadImage = async (file, folder = 'family-tree-app') => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto' }
      ]
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image');
  }
};

// Upload profile image to Cloudinary with specific transformations
const uploadProfileImage = async (file) => {
  try {
    console.log('Cloudinary config:', {
      cloud_name: cloudinary.config().cloud_name,
      api_key: cloudinary.config().api_key
    });
    console.log('Uploading file:', file.path);
    
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'family-tree-app/profile-images',
      resource_type: 'auto',
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face' },
        { quality: 'auto' },
        { format: 'auto' }
      ]
    });

    console.log('Cloudinary upload successful:', result);
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    console.error('Profile image upload error:', error);
    console.error('Error details:', error.message, error.http_code, error.response);
    throw new Error(`Failed to upload profile image: ${error.message}`);
  }
};

// Delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image');
  }
};

// Get image info from Cloudinary
const getImageInfo = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary get info error:', error);
    throw new Error('Failed to get image info');
  }
};

module.exports = {
  uploadImage,
  uploadProfileImage,
  deleteImage,
  getImageInfo
}; 