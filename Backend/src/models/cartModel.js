const pool = require('../config/db');

const getOrCreateCart = async (customerId) => {
  const existing = await pool.query('SELECT cart_id FROM carts WHERE customer_id = $1', [customerId]);
  if (existing.rows[0]) return existing.rows[0].cart_id;

  const created = await pool.query('INSERT INTO carts (customer_id) VALUES ($1) RETURNING cart_id', [customerId]);
  return created.rows[0].cart_id;
};

const CART_ITEMS_SELECT = `
  SELECT ci.cart_item_id, ci.product_id, ci.quantity, ci.added_at,
         p.name, p.price, p.unit, p.stock_quantity, p.is_active,
         v.vendor_id, v.shop_name, v.verification_status,
         (
           SELECT pi.image_url FROM product_images pi
           WHERE pi.product_id = p.product_id
           ORDER BY pi.is_primary DESC, pi.image_id ASC LIMIT 1
         ) AS image_url
  FROM cart_items ci
  JOIN products p ON p.product_id = ci.product_id
  JOIN vendors v ON v.vendor_id = p.vendor_id
  WHERE ci.cart_id = $1
  ORDER BY ci.added_at ASC
`;

const getCartWithItems = async (customerId) => {
  const cartId = await getOrCreateCart(customerId);
  const items = await pool.query(CART_ITEMS_SELECT, [cartId]);
  return { cartId, items: items.rows };
};

// Used to validate a product before it's added — kept in this model
// (rather than importing productModel) since the check is cart-specific:
// active, vendor verified, enough stock for the requested quantity.
const findPurchasableProduct = async (productId) => {
  const result = await pool.query(
    `SELECT p.product_id, p.stock_quantity, p.is_active, v.verification_status
     FROM products p
     JOIN vendors v ON v.vendor_id = p.vendor_id
     WHERE p.product_id = $1`,
    [productId]
  );
  return result.rows[0];
};

const addItemToCart = async (customerId, productId, quantity) => {
  const cartId = await getOrCreateCart(customerId);
  await pool.query(
    `INSERT INTO cart_items (cart_id, product_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (cart_id, product_id) DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
    [cartId, productId, quantity]
  );
  return getCartWithItems(customerId);
};

const updateItemQuantity = async (customerId, productId, quantity) => {
  const cartId = await getOrCreateCart(customerId);
  if (quantity <= 0) {
    await pool.query('DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cartId, productId]);
  } else {
    await pool.query('UPDATE cart_items SET quantity = $3 WHERE cart_id = $1 AND product_id = $2', [
      cartId,
      productId,
      quantity,
    ]);
  }
  return getCartWithItems(customerId);
};

const removeItemFromCart = async (customerId, productId) => {
  const cartId = await getOrCreateCart(customerId);
  await pool.query('DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cartId, productId]);
  return getCartWithItems(customerId);
};

module.exports = {
  getCartWithItems,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  findPurchasableProduct,
};
