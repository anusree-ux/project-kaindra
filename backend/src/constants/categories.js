/**
 * Standardized Fashion & Apparel Categories for ModaSphere & ModaMart.
 */
const FASHION_CATEGORIES = [
  "apparel",
  "streetwear",
  "ethnic",
  "footwear",
  "accessories",
  "activewear",
  "outerwear",
  "formalwear",
  "knitwear",
  "denim",
  "bags",
  "jewelry",
  "eyewear",
  "loungewear",
];

const isValidCategory = (cat) => {
  if (!cat) return false;
  return FASHION_CATEGORIES.includes(String(cat).trim().toLowerCase());
};

const normalizeCategory = (cat) => {
  if (!cat) return "apparel";
  const lower = String(cat).trim().toLowerCase();
  return FASHION_CATEGORIES.includes(lower) ? lower : "apparel";
};

module.exports = {
  FASHION_CATEGORIES,
  isValidCategory,
  normalizeCategory,
};
