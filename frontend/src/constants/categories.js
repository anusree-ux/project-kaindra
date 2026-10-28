/**
 * Standardized Fashion & Apparel Categories for ModaSphere & ModaMart.
 * Authoritative source of 14 core categories used across:
 * - ModaMart Category Filters & Sorting
 * - Seller Product Creation & Editing (ProductForm)
 * - Seller Product List Dashboard (ProductList)
 * - Business Profile Setup (ProfileSetup)
 * - Seller Settings (SellerProfileForm)
 */

export const FASHION_CATEGORIES = [
  { value: "apparel", label: "Apparel" },
  { value: "streetwear", label: "Streetwear" },
  { value: "ethnic", label: "Ethnic Wear" },
  { value: "footwear", label: "Footwear" },
  { value: "accessories", label: "Accessories" },
  { value: "activewear", label: "Activewear" },
  { value: "outerwear", label: "Outerwear" },
  { value: "formalwear", label: "Formal Wear" },
  { value: "knitwear", label: "Knitwear" },
  { value: "denim", label: "Denim" },
  { value: "bags", label: "Bags" },
  { value: "jewelry", label: "Jewelry" },
  { value: "eyewear", label: "Eyewear" },
  { value: "loungewear", label: "Loungewear" },
];

export const MODAMART_CATEGORIES = [
  "All",
  ...FASHION_CATEGORIES.map((cat) => cat.label),
];

export const getCategoryValue = (input = "") => {
  if (!input || input === "All") return "";
  const normalized = String(input).trim().toLowerCase();
  const matched = FASHION_CATEGORIES.find(
    (c) => c.value.toLowerCase() === normalized || c.label.toLowerCase() === normalized
  );
  return matched ? matched.value : normalized;
};

export const getCategoryLabel = (input = "") => {
  if (!input) return "Apparel";
  const normalized = String(input).trim().toLowerCase();
  const matched = FASHION_CATEGORIES.find(
    (c) => c.value.toLowerCase() === normalized || c.label.toLowerCase() === normalized
  );
  return matched ? matched.label : input.charAt(0).toUpperCase() + input.slice(1);
};
