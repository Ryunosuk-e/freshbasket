const {
  getCartWithItems,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  findPurchasableProduct,
} = require('../models/cartModel');

const getCart = async (req, res) => {
  try {
    const cart = await getCartWithItems(req.user.userId);
    return res.status(200).json(cart);
  } catch (err) {
    console.error('getCart error:', err);
    return res.status(500).json({ message: 'Could not fetch your cart.' });
  }
};

const addItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = Number(quantity) || 1;

    if (!productId) return res.status(400).json({ message: 'productId is required.' });
    if (qty <= 0) return res.status(400).json({ message: 'quantity must be at least 1.' });

    const product = await findPurchasableProduct(productId);
    if (!product || !product.is_active || product.verification_status !== 'verified') {
      return res.status(404).json({ message: 'This product is not available.' });
    }
    if (qty > product.stock_quantity) {
      return res.status(400).json({ message: `Only ${product.stock_quantity} left in stock.` });
    }

    const cart = await addItemToCart(req.user.userId, productId, qty);
    return res.status(200).json(cart);
  } catch (err) {
    console.error('addItem error:', err);
    return res.status(500).json({ message: 'Could not add this item to your cart.' });
  }
};

const updateItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const qty = Number(req.body.quantity);
    if (Number.isNaN(qty) || qty < 0) {
      return res.status(400).json({ message: 'quantity must be 0 or more.' });
    }

    const cart = await updateItemQuantity(req.user.userId, productId, qty);
    return res.status(200).json(cart);
  } catch (err) {
    console.error('updateItem error:', err);
    return res.status(500).json({ message: 'Could not update this item.' });
  }
};

const removeItem = async (req, res) => {
  try {
    const cart = await removeItemFromCart(req.user.userId, req.params.productId);
    return res.status(200).json(cart);
  } catch (err) {
    console.error('removeItem error:', err);
    return res.status(500).json({ message: 'Could not remove this item.' });
  }
};

module.exports = { getCart, addItem, updateItem, removeItem };
