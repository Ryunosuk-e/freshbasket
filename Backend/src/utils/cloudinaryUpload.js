const cloudinary = require('../config/cloudinary');

const isCloudinaryConfigured = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

// Takes an in-memory file buffer (from multer) and returns a hosted URL.
// Uses a base64 data URI rather than a stream — fewer moving parts, and
// product photos are small enough that the size difference doesn't matter.
const uploadBufferToCloudinary = async (file) => {
  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'grocery-market/products',
  });
  return result.secure_url;
};

// Uploads whatever files were provided; returns [] (not an error) if
// Cloudinary isn't configured yet, so product creation still succeeds
// without photos rather than failing the whole request.
const uploadProductImages = async (files = []) => {
  if (!files.length) return [];
  if (!isCloudinaryConfigured()) {
    console.warn('Cloudinary is not configured (see .env.example) — skipping image upload.');
    return [];
  }
  const uploads = files.map((file) => uploadBufferToCloudinary(file));
  return Promise.all(uploads);
};

module.exports = { isCloudinaryConfigured, uploadProductImages };
