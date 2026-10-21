const pool = require('../config/db');

// json_agg + FILTER avoids a phantom {"imageUrl": null} entry for products
// that have no rows in product_images yet (a plain LEFT JOIN would produce
// one all-NULL row per product with zero images).
const PRODUCT_SELECT = `
  SELECT p.product_id, p.vendor_id, p.name, p.description, p.price, p.unit,
         p.stock_quantity, p.is_active, p.created_at, p.updated_at,
         c.category_id, c.name AS category_name,
         COALESCE(
           json_agg(
             json_build_object('imageUrl', pi.image_url, 'isPrimary', pi.is_primary)
             ORDER BY pi.is_primary DESC, pi.image_id ASC
           ) FILTER (WHERE pi.image_id IS NOT NULL),
           '[]'
         ) AS images
  FROM products p
  LEFT JOIN categories c ON c.category_id = p.category_id
  LEFT JOIN product_images pi ON pi.product_id = p.product_id
`;
const PRODUCT_GROUP_BY = 'GROUP BY p.product_id, c.category_id, c.name';

const createProduct = async ({ vendorId, categoryId, name, description, price, unit, stockQuantity, imageUrls = [] }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const productResult = await client.query(
      `INSERT INTO products (vendor_id, category_id, name, description, price, unit, stock_quantity)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING product_id`,
      [vendorId, categoryId, name, description, price, unit, stockQuantity]
    );
    const productId = productResult.rows[0].product_id;

    for (let i = 0; i < imageUrls.length; i += 1) {
      await client.query(
        `INSERT INTO product_images (product_id, image_url, is_primary) VALUES ($1, $2, $3)`,
        [productId, imageUrls[i], i === 0]
      );
    }

    await client.query('COMMIT');
    return productId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const findProductById = async (productId) => {
  const result = await pool.query(`${PRODUCT_SELECT} WHERE p.product_id = $1 ${PRODUCT_GROUP_BY}`, [productId]);
  return result.rows[0];
};

const listProductsByVendor = async (vendorId) => {
  const result = await pool.query(
    `${PRODUCT_SELECT} WHERE p.vendor_id = $1 ${PRODUCT_GROUP_BY} ORDER BY p.created_at DESC`,
    [vendorId]
  );
  return result.rows;
};

// vendor_id is part of the WHERE clause itself — a vendor physically
// cannot update a product row that isn't theirs, not just by application
// logic but by what the query can match.
const updateProduct = async ({
  productId,
  vendorId,
  categoryId,
  name,
  description,
  price,
  unit,
  stockQuantity,
  isActive,
  newImageUrls = [],
}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE products
       SET category_id = $3, name = $4, description = $5, price = $6, unit = $7,
           stock_quantity = $8, is_active = $9, updated_at = NOW()
       WHERE product_id = $1 AND vendor_id = $2
       RETURNING product_id`,
      [productId, vendorId, categoryId, name, description, price, unit, stockQuantity, isActive]
    );

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    for (const url of newImageUrls) {
      await client.query('INSERT INTO product_images (product_id, image_url, is_primary) VALUES ($1, $2, FALSE)', [
        productId,
        url,
      ]);
    }

    await client.query('COMMIT');
    return productId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Shared by both public functions below — a product is only visible to
// shoppers when it's active AND its vendor is verified, regardless of
// how it's being searched for.
function buildPublicFilters({ categorySlug, vendorId, q }) {
  const conditions = ["p.is_active = TRUE", "v.verification_status = 'verified'"];
  const params = [];

  if (categorySlug) {
    params.push(categorySlug);
    conditions.push(`c.slug = $${params.length}`);
  }
  if (vendorId) {
    params.push(vendorId);
    conditions.push(`p.vendor_id = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
  }

  return { whereClause: conditions.join(' AND '), params };
}

const PUBLIC_PRODUCT_SELECT = `
  SELECT p.product_id, p.name, p.description, p.price, p.unit, p.stock_quantity, p.created_at,
         c.category_id, c.name AS category_name,
         v.vendor_id, v.shop_name,
         COALESCE(
           json_agg(
             json_build_object('imageUrl', pi.image_url, 'isPrimary', pi.is_primary)
             ORDER BY pi.is_primary DESC, pi.image_id ASC
           ) FILTER (WHERE pi.image_id IS NOT NULL),
           '[]'
         ) AS images
  FROM products p
  JOIN vendors v ON v.vendor_id = p.vendor_id
  LEFT JOIN categories c ON c.category_id = p.category_id
  LEFT JOIN product_images pi ON pi.product_id = p.product_id
`;
const PUBLIC_GROUP_BY = 'GROUP BY p.product_id, c.category_id, c.name, v.vendor_id, v.shop_name';

const listPublicProducts = async ({ categorySlug, vendorId, q, page = 1, limit = 20 }) => {
  const { whereClause, params } = buildPublicFilters({ categorySlug, vendorId, q });

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM products p
     JOIN vendors v ON v.vendor_id = p.vendor_id
     LEFT JOIN categories c ON c.category_id = p.category_id
     WHERE ${whereClause}`,
    params
  );

  const pageParams = [...params, limit, (page - 1) * limit];
  const rowsResult = await pool.query(
    `${PUBLIC_PRODUCT_SELECT}
     WHERE ${whereClause}
     ${PUBLIC_GROUP_BY}
     ORDER BY p.created_at DESC
     LIMIT $${pageParams.length - 1} OFFSET $${pageParams.length}`,
    pageParams
  );

  return { products: rowsResult.rows, total: countResult.rows[0].total };
};

const findPublicProductById = async (productId) => {
  const result = await pool.query(
    `SELECT p.product_id, p.name, p.description, p.price, p.unit, p.stock_quantity, p.created_at,
            c.category_id, c.name AS category_name,
            v.vendor_id, v.shop_name, v.business_address,
            COALESCE(
              json_agg(
                json_build_object('imageUrl', pi.image_url, 'isPrimary', pi.is_primary)
                ORDER BY pi.is_primary DESC, pi.image_id ASC
              ) FILTER (WHERE pi.image_id IS NOT NULL),
              '[]'
            ) AS images
     FROM products p
     JOIN vendors v ON v.vendor_id = p.vendor_id
     LEFT JOIN categories c ON c.category_id = p.category_id
     LEFT JOIN product_images pi ON pi.product_id = p.product_id
     WHERE p.product_id = $1 AND p.is_active = TRUE AND v.verification_status = 'verified'
     GROUP BY p.product_id, c.category_id, c.name, v.vendor_id, v.shop_name, v.business_address`,
    [productId]
  );
  return result.rows[0];
};

module.exports = {
  createProduct,
  findProductById,
  listProductsByVendor,
  updateProduct,
  listPublicProducts,
  findPublicProductById,
};
