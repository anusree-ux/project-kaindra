/**
 * Seed script for ModaMart Products
 * 
 * Uploads all catalog images directly to Cloudinary under folder "modasphere/products",
 * and populates MongoDB with real Cloudinary URLs (https://res.cloudinary.com/...)
 * and publicIds (modasphere/products/...).
 */

require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const connectDB = require("../src/config/database");
const cloudinary = require("../src/config/cloudinary");
const Product = require("../src/models/modasphere/Product");
const User = require("../src/models/core/User");

const productCatalog = [
  {
    name: "Classic Linen Shirt",
    description: "Lightweight, breathable classic linen shirt tailored with premium woven fabrics for comfort and timeless style.",
    category: "apparel",
    tags: ["linen", "shirt", "summer", "men", "minimal"],
    price: 1899,
    stock: 25,
    status: "active",
    sourceImages: [
      "https://images.unsplash.com/photo-1603252110481-7ba873bf42ab?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1627225924765-552d49cf47ad?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  {
    name: "Minimal Cotton Dress",
    description: "Effortless silhouette crafted from 100% organic cotton, designed for all-day comfort and contemporary modern living.",
    category: "apparel",
    tags: ["cotton", "dress", "women", "minimal", "casual"],
    price: 2499,
    stock: 18,
    status: "active",
    sourceImages: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  {
    name: "Urban Oversized Jacket",
    description: "Structured streetwear jacket with durable weather-resistant materials, deep pockets, and modern urban drape.",
    category: "apparel",
    tags: ["jacket", "streetwear", "outerwear", "urban"],
    price: 3299,
    stock: 12,
    status: "active",
    sourceImages: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  {
    name: "Heritage Handloom Saree",
    description: "Handcrafted traditional handloom saree woven by heritage artisans using authentic zari detailing and pure silk blends.",
    category: "ethnic",
    tags: ["ethnic", "saree", "handloom", "heritage", "silk"],
    price: 4599,
    stock: 8,
    status: "active",
    sourceImages: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  {
    name: "Premium Leather Bag",
    description: "Full-grain artisanal leather messenger bag with reinforced hardware, padded laptop compartment, and adjustable shoulder strap.",
    category: "accessories",
    tags: ["leather", "bag", "accessories", "luxe", "travel"],
    price: 3799,
    stock: 15,
    status: "active",
    sourceImages: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=1200&q=85",
    ],
  },
  {
    name: "Modern Sneakers",
    description: "Engineered ergonomic sole sneaker combining dynamic cushioning, breathable mesh upper, and futuristic design.",
    category: "footwear",
    tags: ["sneakers", "footwear", "shoes", "active", "streetwear"],
    price: 2999,
    stock: 20,
    status: "active",
    sourceImages: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=85",
    ],
  },
];

const seedProducts = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB for ModaMart Cloudinary seeding...");

    // Find a seller user
    let seller = await User.findOne({ email: "user@kaindra.com" });
    if (!seller) {
      seller = await User.findOne({});
    }

    if (!seller) {
      seller = await User.create({
        name: "ModaSphere Studio",
        email: "seller@modasphere.com",
        phoneNumber: "919876543211",
        password: "Password123!",
        isPhoneVerified: true,
        role: "user",
      });
    }

    console.log(`Using seller ID: ${seller._id} (${seller.name})`);

    for (const item of productCatalog) {
      console.log(`\nUploading Cloudinary images for product: ${item.name}...`);
      const cloudinaryImages = [];

      for (let i = 0; i < item.sourceImages.length; i++) {
        const sourceUrl = item.sourceImages[i];
        try {
          const uploadRes = await cloudinary.uploader.upload(sourceUrl, {
            folder: "modasphere/products",
            resource_type: "image",
          });
          cloudinaryImages.push({
            url: uploadRes.secure_url,
            publicId: uploadRes.public_id,
          });
          console.log(`  ✓ Image ${i + 1}/${item.sourceImages.length}: ${uploadRes.secure_url}`);
        } catch (uploadErr) {
          console.error(`  ✗ Image ${i + 1} upload failed:`, uploadErr.message);
        }
      }

      await Product.findOneAndUpdate(
        { name: item.name },
        {
          $set: {
            name: item.name,
            description: item.description,
            category: item.category,
            tags: item.tags,
            price: item.price,
            stock: item.stock,
            status: item.status,
            sellerId: seller._id,
            images: cloudinaryImages,
          },
        },
        { upsert: true, returnDocument: "after" }
      );
      console.log(`Saved product in MongoDB: ${item.name} with ${cloudinaryImages.length} Cloudinary images.`);
    }

    console.log("\nAll ModaMart products seeded with real Cloudinary URLs successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding products:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedProducts();
}

module.exports = {
  productCatalog,
  seedProducts,
};
