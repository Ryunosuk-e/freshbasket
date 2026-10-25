const pool = require('../config/db');

// json_agg + FILTER avoids a phantom {"imageUrl": null} entry for products
// that have no rows in product_images yet (a plain LEFT JOIN would produce
// one all-NULL row per product with zero images).
const PRODUCT_SELECT = `
  SELECT p.product_id, p.vendor_id, p.name, p.description, p.price, p.unit,
         p.stock_quantity, p.is_active, p.approval_status, p.packaging_options,
         p.created_at, p.updated_at,
         c.category_id, c.name AS category_name,
         v.shop_name, v.business_address, v.market_zone,
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
const PRODUCT_GROUP_BY = 'GROUP BY p.product_id, c.category_id, c.name, v.vendor_id, v.shop_name, v.business_address, v.market_zone';

const createProduct = async ({
  vendorId,
  categoryId,
  name,
  description,
  price,
  unit,
  stockQuantity,
  packagingOptions = [],
  imageUrls = [],
}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const productResult = await client.query(
      `INSERT INTO products (vendor_id, category_id, name, description, price, unit, stock_quantity, packaging_options, approval_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'approved')
       RETURNING product_id`,
      [vendorId, categoryId, name, description, price, unit, stockQuantity, JSON.stringify(packagingOptions)]
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
  packagingOptions = [],
  isActive,
  newImageUrls = [],
}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE products
       SET category_id = $3, name = $4, description = $5, price = $6, unit = $7,
           stock_quantity = $8, packaging_options = $9, is_active = $10, updated_at = NOW()
       WHERE product_id = $1 AND vendor_id = $2
       RETURNING product_id`,
      [productId, vendorId, categoryId, name, description, price, unit, stockQuantity, JSON.stringify(packagingOptions), isActive]
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

// Shared by public functions — a product is visible to shoppers when it's
// active, vendor is verified, and the listing is approved.
function buildPublicFilters({ categorySlug, vendorId, q, minPrice, maxPrice, location }) {
  const conditions = [
    "p.is_active = TRUE",
    "v.verification_status = 'verified'",
    "p.approval_status = 'approved'",
  ];
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
  if (minPrice !== undefined && minPrice !== null && !isNaN(Number(minPrice))) {
    params.push(Number(minPrice));
    conditions.push(`p.price >= $${params.length}`);
  }
  if (maxPrice !== undefined && maxPrice !== null && !isNaN(Number(maxPrice))) {
    params.push(Number(maxPrice));
    conditions.push(`p.price <= $${params.length}`);
  }
  if (location) {
    params.push(`%${location}%`);
    conditions.push(`(v.market_zone ILIKE $${params.length} OR v.business_address ILIKE $${params.length})`);
  }

  return { whereClause: conditions.join(' AND '), params };
}

const PUBLIC_PRODUCT_SELECT = `
  SELECT p.product_id, p.name, p.description, p.price, p.unit, p.stock_quantity,
         p.packaging_options, p.approval_status, p.created_at,
         c.category_id, c.name AS category_name,
         v.vendor_id, v.shop_name, v.business_address, COALESCE(v.market_zone, 'Ogige Market') AS market_zone,
         v.average_rating AS vendor_rating,
         ROUND(COALESCE(AVG(r.rating), 0)::numeric, 1) AS average_rating,
         COUNT(DISTINCT r.review_id)::int AS review_count,
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
  LEFT JOIN reviews r ON r.product_id = p.product_id
`;
const PUBLIC_GROUP_BY = 'GROUP BY p.product_id, c.category_id, c.name, v.vendor_id, v.shop_name, v.business_address, v.market_zone, v.average_rating';

const listPublicProducts = async ({ categorySlug, vendorId, q, minPrice, maxPrice, location, sort, page = 1, limit = 24 }) => {
  const { whereClause, params } = buildPublicFilters({ categorySlug, vendorId, q, minPrice, maxPrice, location });

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM products p
     JOIN vendors v ON v.vendor_id = p.vendor_id
     LEFT JOIN categories c ON c.category_id = p.category_id
     WHERE ${whereClause}`,
    params
  );

  let orderBy = 'ORDER BY p.created_at DESC';
  if (sort === 'price_asc') {
    orderBy = 'ORDER BY p.price ASC, p.created_at DESC';
  } else if (sort === 'price_desc') {
    orderBy = 'ORDER BY p.price DESC, p.created_at DESC';
  }

  const pageParams = [...params, limit, (page - 1) * limit];
  const rowsResult = await pool.query(
    `${PUBLIC_PRODUCT_SELECT}
     WHERE ${whereClause}
     ${PUBLIC_GROUP_BY}
     ${orderBy}
     LIMIT $${pageParams.length - 1} OFFSET $${pageParams.length}`,
    pageParams
  );

  return { products: rowsResult.rows, total: countResult.rows[0].total };
};

const findPublicProductById = async (productId) => {
  const result = await pool.query(
    `${PUBLIC_PRODUCT_SELECT}
     WHERE p.product_id = $1 AND p.is_active = TRUE AND v.verification_status = 'verified'
     ${PUBLIC_GROUP_BY}`,
    [productId]
  );
  return result.rows[0];
};

const getRecommendationsForProduct = async (productId, limit = 4) => {
  const current = await pool.query(
    `SELECT category_id, vendor_id FROM products WHERE product_id = $1`,
    [productId]
  );
  if (!current.rows[0]) return [];

  const { category_id, vendor_id } = current.rows[0];
  const recs = await pool.query(
    `${PUBLIC_PRODUCT_SELECT}
     WHERE p.product_id != $1
       AND p.is_active = TRUE
       AND p.approval_status = 'approved'
       AND v.verification_status = 'verified'
       AND (p.category_id = $2 OR p.vendor_id = $3)
     ${PUBLIC_GROUP_BY}
     ORDER BY (p.category_id = $2) DESC, p.created_at DESC
     LIMIT $4`,
    [productId, category_id, vendor_id, limit]
  );
  return recs.rows;
};

// Admin product moderation
const listAllProductsForAdmin = async () => {
  const result = await pool.query(
    `${PUBLIC_PRODUCT_SELECT}
     ${PUBLIC_GROUP_BY}
     ORDER BY (p.approval_status = 'pending') DESC, p.created_at DESC`
  );
  return result.rows;
};

const setProductApprovalStatus = async (productId, status) => {
  const result = await pool.query(
    `UPDATE products SET approval_status = $2, updated_at = NOW() WHERE product_id = $1 RETURNING *`,
    [productId, status]
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
  getRecommendationsForProduct,
  listAllProductsForAdmin,
  setProductApprovalStatus,
};
