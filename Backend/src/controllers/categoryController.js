const { listCategories } = require('../models/categoryModel');

const getCategories = async (req, res) => {
  try {
    const categories = await listCategories();
    return res.status(200).json({ categories });
  } catch (err) {
    console.error('getCategories error:', err);
    return res.status(500).json({ message: 'Could not fetch categories.' });
  }
};

module.exports = { getCategories };
