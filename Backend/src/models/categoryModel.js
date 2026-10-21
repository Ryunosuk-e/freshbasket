const pool = require('../config/db');

const listCategories = async () => {
  const result = await pool.query('SELECT category_id, name, slug FROM categories ORDER BY name ASC');
  return result.rows;
};

module.exports = { listCategories };
