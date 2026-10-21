const {
  createProduct,
  findProductById,
  listProductsByVendor,
  updateProduct,
  listPublicProducts,
  findPublicProductById,
} = require('../models/productModel');
const { uploadProductImages } = require('../utils/cloudinaryUpload');

const UNITS = ['kg', 'g', 'litre', 'ml', 'piece', 'dozen', 'pack'];

function validateProductFields({ name, price, unit, stockQuantity, categoryId }) {
  if (!name || !name.trim()) return 'Product name is required.';
  const priceNumber = Number(price);
  if (!price || Number.isNaN(priceNumber) || priceNumber <= 0) return 'Price must be a positive number.';
  if (!unit || !UNITS.includes(unit)) return `unit must be one of: ${UNITS.join(', ')}.`;
  const stockNumber = Number(stockQuantity);
  if (stockQuantity === undefined || Number.isNaN(stockNumber) || stockNumber < 0 || !Number.isInteger(stockNumber)) {
    return 'stockQuantity must be a whole number of 0 or more.';
  }
  if (!categoryId || Number.isNaN(Number(categoryId))) return 'categoryId is required.';
  return null;
}

// FR02 — Product Catalogue Management (vendor side).
const getMyProducts = async (req, res) => {
  try {
    const products = await listProductsByVendor(req.user.userId);
    return res.status(200).json({ products });
  } catch (err) {
    console.error('getMyProducts error:', err);
    return res.status(500).json({ message: 'Could not fetch your products.' });
  }
};

const addProduct = async (req, res) => {
  try {
    const { name, description, price, unit, stockQuantity, categoryId } = req.body;
    const validationError = validateProductFields({ name, price, unit, stockQuantity, categoryId });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    // Uploads whatever images came with the request; resolves to [] (not
    // an error) if Cloudinary isn't configured yet, so the product still
    // gets created without photos rather than the request failing outright.
    const imageUrls = await uploadProductImages(req.files);

    const productId = await createProduct({
      vendorId: req.user.userId,
      categoryId: Number(categoryId),
      name,
      description: description || null,
      price: Number(price),
      unit,
      stockQuantity: Number(stockQuantity),
      imageUrls,
    });

    const product = await findProductById(productId);
    return res.status(201).json({ message: 'Product added.', product });
  } catch (err) {
    console.error('addProduct error:', err);
    return res.status(500).json({ message: 'Could not add the product.' });
  }
};

const editProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, description, price, unit, stockQuantity, categoryId, isActive } = req.body;

    const validationError = validateProductFields({ name, price, unit, stockQuantity, categoryId });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const newImageUrls = await uploadProductImages(req.files);

    const updatedId = await updateProduct({
      productId,
      vendorId: req.user.userId,
      categoryId: Number(categoryId),
      name,
      description: description || null,
      price: Number(price),
      unit,
      stockQuantity: Number(stockQuantity),
      isActive: isActive === undefined ? true : isActive === 'true' || isActive === true,
      newImageUrls,
    });

    if (!updatedId) {
      return res.status(404).json({ message: 'Product not found, or does not belong to you.' });
    }

    const product = await findProductById(updatedId);
    return res.status(200).json({ message: 'Product updated.', product });
  } catch (err) {
    console.error('editProduct error:', err);
    return res.status(500).json({ message: 'Could not update the product.' });
  }
};

// FR04 — Product Search & Browse (customer side, public — no login needed).
const getProducts = async (req, res) => {
  try {
    const { category, vendor, q, page, limit } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));

    const { products, total } = await listPublicProducts({
      categorySlug: category,
      vendorId: vendor,
      q,
      page: pageNum,
      limit: limitNum,
    });

    return res.status(200).json({ products, total, page: pageNum, limit: limitNum });
  } catch (err) {
    console.error('getProducts error:', err);
    return res.status(500).json({ message: 'Could not fetch products.' });
  }
};

const getProductDetail = async (req, res) => {
  try {
    const product = await findPublicProductById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    return res.status(200).json({ product });
  } catch (err) {
    console.error('getProductDetail error:', err);
    return res.status(500).json({ message: 'Could not fetch this product.' });
  }
};

module.exports = { getMyProducts, addProduct, editProduct, getProducts, getProductDetail };
