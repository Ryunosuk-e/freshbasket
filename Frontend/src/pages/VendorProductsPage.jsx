import { useEffect, useState } from 'react';
import { ImagePlus, Loader2, Package, Pencil, Plus, X } from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { createProduct, getCategories, getMyProducts, updateProduct } from '../api/products.js';

const UNITS = ['kg', 'g', 'litre', 'ml', 'piece', 'dozen', 'pack'];

const EMPTY_FORM = {
  name: '',
  categoryId: '',
  price: '',
  unit: 'kg',
  stockQuantity: '',
  description: '',
  isActive: true,
};

function formatNaira(price) {
  const amount = Number(price);
  return `\u20a6${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function VendorProductsPage() {
  const { token } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = () => {
    setIsLoading(true);
    setLoadError('');
    Promise.all([getMyProducts(token), getCategories()])
      .then(([productsData, categoriesData]) => {
        setProducts(productsData.products || []);
        setCategories(categoriesData.categories || []);
      })
      .catch((err) => setLoadError(err.message || 'Could not load your products.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Revoke preview URLs when they're replaced or the component unmounts,
  // so selecting images repeatedly doesn't leak object URLs.
  useEffect(() => {
    return () => imagePreviews.forEach((url) => URL.revokeObjectURL(url));
  }, [imagePreviews]);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setImageFiles([]);
    setImagePreviews([]);
    setEditingProductId(null);
    setFormError('');
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (product) => {
    setFormData({
      name: product.name,
      categoryId: product.category_id || '',
      price: product.price,
      unit: product.unit,
      stockQuantity: product.stock_quantity,
      description: product.description || '',
      isActive: product.is_active,
    });
    setImageFiles([]);
    setImagePreviews([]);
    setEditingProductId(product.product_id);
    setFormError('');
    setShowForm(true);
  };

  const updateField = (field) => (event) => {
    const { value, type, checked } = event.target;
    setFormData((prev) => ({ ...prev, [field]: type === 'checkbox' ? checked : value }));
  };

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files || []);
    setImageFiles(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!formData.name.trim()) return setFormError('Product name is required.');
    if (!formData.categoryId) return setFormError('Choose a category.');
    if (!formData.price || Number(formData.price) <= 0) return setFormError('Price must be a positive number.');
    if (formData.stockQuantity === '' || Number(formData.stockQuantity) < 0) {
      return setFormError('Stock quantity must be 0 or more.');
    }

    setIsSubmitting(true);
    try {
      if (editingProductId) {
        await updateProduct(token, editingProductId, formData, imageFiles);
      } else {
        await createProduct(token, formData, imageFiles);
      }
      setShowForm(false);
      resetForm();
      loadData();
    } catch (err) {
      setFormError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <AppHeader tag="Vendor" />

      <main className="mx-auto max-w-4xl px-6 py-12 sm:px-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">My Products</h1>
            <p className="mt-1 text-sm text-gray-500">Add and manage what your shop has for sale.</p>
          </div>
          <button
            type="button"
            onClick={showForm ? () => setShowForm(false) : openAddForm}
            className="flex items-center gap-2 rounded-full bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'Add Product'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-3xl border border-gray-100 p-6" noValidate>
            <h2 className="font-semibold text-gray-900">{editingProductId ? 'Edit Product' : 'Add Product'}</h2>

            {formError && (
              <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div>
              <label htmlFor="productName" className="block text-sm font-medium text-gray-900">
                Product Name <span aria-hidden="true">*</span>
              </label>
              <input
                id="productName"
                value={formData.name}
                onChange={updateField('name')}
                placeholder="e.g. Fresh Tomatoes"
                className="mt-1.5 w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-900">
                  Category <span aria-hidden="true">*</span>
                </label>
                <select
                  id="category"
                  value={formData.categoryId}
                  onChange={updateField('categoryId')}
                  className="mt-1.5 w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                >
                  <option value="" disabled>
                    Select
                  </option>
                  {categories.map((category) => (
                    <option key={category.category_id} value={category.category_id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-900">
                  Unit <span aria-hidden="true">*</span>
                </label>
                <select
                  id="unit"
                  value={formData.unit}
                  onChange={updateField('unit')}
                  className="mt-1.5 w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                >
                  {UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-900">
                  Price (₦) <span aria-hidden="true">*</span>
                </label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={updateField('price')}
                  placeholder="e.g. 1500"
                  className="mt-1.5 w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>

              <div>
                <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-900">
                  Stock Quantity <span aria-hidden="true">*</span>
                </label>
                <input
                  id="stockQuantity"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.stockQuantity}
                  onChange={updateField('stockQuantity')}
                  placeholder="e.g. 40"
                  className="mt-1.5 w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-900">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={updateField('description')}
                rows={3}
                placeholder="A short description customers will see"
                className="mt-1.5 w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">Photos</label>
              <label
                htmlFor="images"
                className="mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-gray-300 py-6 text-center hover:bg-gray-50"
              >
                <ImagePlus className="text-gray-400" size={22} />
                <span className="text-sm text-gray-500">Drag photos, or</span>
                <span className="text-sm font-medium text-emerald-700">Browse (up to 4)</span>
                <input id="images" type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
              </label>

              {imagePreviews.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {imagePreviews.map((src) => (
                    <img key={src} src={src} alt="" className="h-16 w-16 rounded-xl object-cover" />
                  ))}
                </div>
              )}

              {editingProductId && (
                <p className="mt-2 text-xs text-gray-400">
                  New photos are added alongside existing ones — removing individual photos isn't supported yet.
                </p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                If Cloudinary isn't configured on the backend yet, the product still saves — just without photos.
              </p>
            </div>

            {editingProductId && (
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={updateField('isActive')}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-700 focus:ring-emerald-600"
                />
                Visible to customers
              </label>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-emerald-800 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60 sm:w-auto sm:px-8"
            >
              {isSubmitting ? 'Saving…' : editingProductId ? 'Save Changes' : 'Add Product'}
            </button>
          </form>
        )}

        <div className="mt-8">
          {isLoading ? (
            <div className="flex items-center gap-2 py-16 text-gray-400">
              <Loader2 size={18} className="animate-spin" />
              Loading your products…
            </div>
          ) : loadError ? (
            <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {loadError}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-3xl bg-emerald-50 py-16 text-center">
              <Package className="text-emerald-700" size={28} />
              <p className="font-medium text-gray-900">No products yet</p>
              <p className="text-sm text-gray-500">Add your first product to start building your storefront.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {products.map((product) => {
                const primaryImage = product.images?.find((image) => image.isPrimary) || product.images?.[0];
                return (
                  <li
                    key={product.product_id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 p-4"
                  >
                    <div className="flex items-center gap-4">
                      {primaryImage ? (
                        <img src={primaryImage.imageUrl} alt="" className="h-14 w-14 rounded-xl object-cover" />
                      ) : (
                        <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                          <Package size={20} />
                        </span>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{product.name}</p>
                          {!product.is_active && (
                            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                              Hidden
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatNaira(product.price)} / {product.unit} · {product.stock_quantity} in stock
                        </p>
                        <p className="text-xs text-gray-400">{product.category_name || 'Uncategorized'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditForm(product)}
                      className="flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

export default VendorProductsPage;
