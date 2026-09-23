const Product = require("../../models/modasphere/Product");
const {
  uploadProductImage,
  deleteProductImage,
} = require("../../services/modasphere/productUploadService");
const AppError = require("../../utils/AppError");

/**
 * Helper to parse tags from comma-separated string or array
 */
const parseTags = (tagsInput) => {
  if (!tagsInput) return [];
  if (Array.isArray(tagsInput)) {
    return tagsInput.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
  }
  if (typeof tagsInput === "string") {
    return tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
};

/**
 * @desc    Create a new product (starts as "draft")
 * @route   POST /api/modasphere/products
 * @access  Private (Authenticated Seller)
 */
const createProduct = async (req, res, next) => {
  const uploadedImages = [];
  try {
    const { name, description, category, price, stock, tags } = req.body;

    if (!name || name.trim() === "") {
      return next(new AppError("Product name is required.", 400));
    }

    if (price === undefined || price === null || isNaN(Number(price))) {
      return next(new AppError("Valid product price is required.", 400));
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await uploadProductImage(file.buffer, "modasphere/products");
        uploadedImages.push(uploaded);
      }
    }

    const product = await Product.create({
      sellerId: req.user._id,
      name: name.trim(),
      description: description ? description.trim() : "",
      category: category ? category.trim().toLowerCase() : "apparel",
      tags: parseTags(tags),
      price: Number(price),
      stock: stock !== undefined && stock !== null ? Math.max(0, parseInt(stock, 10) || 0) : 0,
      images: uploadedImages,
      status: "draft",
    });

    res.status(201).json({
      status: "success",
      message: "Product created as draft successfully.",
      data: { product },
    });
  } catch (error) {
    for (const img of uploadedImages) {
      await deleteProductImage(img.publicId).catch(() => {});
    }
    next(error);
  }
};

/**
 * @desc    Update product details
 * @route   PATCH /api/modasphere/products/:id
 * @access  Private (Seller only)
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return next(new AppError("Product not found.", 404));
    }

    if (product.sellerId.toString() !== req.user._id.toString()) {
      return next(new AppError("Not authorized to update this product.", 403));
    }

    const { name, description, category, price, stock, tags, status } = req.body;

    if (name !== undefined) product.name = name.trim();
    if (description !== undefined) product.description = description.trim();
    if (category !== undefined) product.category = category.trim().toLowerCase();
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Math.max(0, parseInt(stock, 10) || 0);
    if (tags !== undefined) product.tags = parseTags(tags);
    if (status !== undefined && ["draft", "archived"].includes(status)) {
      product.status = status;
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await uploadProductImage(file.buffer, "modasphere/products");
        product.images.push(uploaded);
      }
    }

    await product.save();

    res.status(200).json({
      status: "success",
      message: "Product updated successfully.",
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Publish a product (sets status to "active" if stock > 0)
 * @route   PATCH /api/modasphere/products/:id/publish
 * @access  Private (Seller only)
 */
const publishProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return next(new AppError("Product not found.", 404));
    }

    if (product.sellerId.toString() !== req.user._id.toString()) {
      return next(new AppError("Not authorized to publish this product.", 403));
    }

    if (!product.name || product.price === undefined || product.price === null) {
      return next(new AppError("Product must have a name and price before publishing.", 400));
    }

    if (!product.stock || product.stock <= 0) {
      return next(new AppError("Cannot publish product with 0 stock. Please add stock first.", 400));
    }

    product.status = "active";
    await product.save();

    res.status(200).json({
      status: "success",
      message: "Product published successfully and is now active.",
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a product and its Cloudinary images
 * @route   DELETE /api/modasphere/products/:id
 * @access  Private (Seller only)
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return next(new AppError("Product not found.", 404));
    }

    if (product.sellerId.toString() !== req.user._id.toString()) {
      return next(new AppError("Not authorized to delete this product.", 403));
    }

    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img.publicId) {
          await deleteProductImage(img.publicId).catch((err) => {
            console.error(`Error deleting product image ${img.publicId}:`, err);
          });
        }
      }
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({
      status: "success",
      message: "Product deleted successfully.",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Browse active products (public with search, filter, sorting, pagination)
 * @route   GET /api/modasphere/products
 * @access  Public
 */
const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      tag,
      tags,
      search,
      q,
      sort = "newest",
    } = req.query;

    const query = { status: "active" };

    if (category && category.trim()) {
      query.category = new RegExp(`^${category.trim()}$`, "i");
    }

    const tagFilter = tag || tags;
    if (tagFilter) {
      const parsed = parseTags(tagFilter);
      if (parsed.length > 0) {
        query.tags = { $in: parsed };
      }
    }

    const searchKeyword = search || q;
    if (searchKeyword && searchKeyword.trim()) {
      const regex = new RegExp(searchKeyword.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ name: regex }, { description: regex }, { tags: regex }];
    }

    let sortOption = { createdAt: -1 };
    if (sort === "price_asc" || sort === "price") {
      sortOption = { price: 1 };
    } else if (sort === "price_desc" || sort === "-price") {
      sortOption = { price: -1 };
    } else if (sort === "oldest" || sort === "createdAt") {
      sortOption = { createdAt: 1 };
    } else if (sort === "newest" || sort === "-createdAt") {
      sortOption = { createdAt: -1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("sellerId", "name email")
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        products,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product details
 * @route   GET /api/modasphere/products/:id
 * @access  Public (Drafts accessible only by the owner)
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate("sellerId", "name email");

    if (!product) {
      return next(new AppError("Product not found.", 404));
    }

    const isOwner =
      req.user &&
      product.sellerId &&
      (product.sellerId._id || product.sellerId).toString() === req.user._id.toString();

    if (product.status !== "active" && !isOwner) {
      return next(new AppError("Product not found.", 404));
    }

    res.status(200).json({
      status: "success",
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get logged-in seller's own products (all statuses)
 * @route   GET /api/modasphere/products/seller/me
 * @access  Private (Authenticated Seller)
 */
const getMySellerProducts = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { sellerId: req.user._id };

    if (status && ["draft", "active", "archived"].includes(status)) {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        products,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  updateProduct,
  publishProduct,
  deleteProduct,
  getProducts,
  getProductById,
  getMySellerProducts,
};
