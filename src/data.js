/* ========================================================================= */
/* ⚙️ 1. STORE & WHATSAPP CONFIGURATION (EDIT YOUR DETAILS HERE)               */
/* ========================================================================= */
/* Update the values below to change your WhatsApp number, email, address,   */
/* and shipping rates across the ENTIRE website in this one place!           */
/* ========================================================================= */
export const STORE_CONFIG = {
  // Business Name & Location (Official Brand Name)
  brandName: "NECTAR AND HIVE",
  storeLocation: "Durban, KwaZulu-Natal, South Africa",
  storeAddress: "Sherwood, Durban, South Africa",

  // WhatsApp Ordering Phone Number:
  // Format: International format WITHOUT the '+' sign and without spaces.
  // For South Africa (+27), enter 27 followed by 9 digits (e.g. 27827736543)
  whatsappNumber: "27827736543",

  // Friendly display phone number (shown in text / confirmation dialogs):
  whatsappDisplayPhone: "+27 82 773 6543",

  // Store contact email & social accounts:
  contactEmail: "nectarnhive@gmail.com",
  personalEmail: "saadvahed@gmail.com",
  instagramUrl: "https://www.instagram.com/nectar_n_hive",
  instagramHandle: "@nectar_n_hive",

  // 🚚 Shipping & Delivery Policy:
  // • Local Pickup (Sherwood, Durban): Free
  // • Delivery in surrounding areas: Free
  // • Delivery outside surrounding areas & nationwide: Confirmed with seller via WhatsApp
  shippingPolicy: {
    pickupFee: 0,                   // Pickup is Free
    surroundingFee: 0,              // Surrounding areas delivery is Free
    outsideFeeNote: "Confirmed with seller" // Outside Durban & Nationwide is confirmed with seller
  }
};

/* ========================================================================= */
/* 🍯 2. PRODUCTS DATABASE & SIZES (EDIT PRICES, SALES & STOCK HERE)          */
/* ========================================================================= */
/* 📌 HOW TO CONTROL EACH BOTTLE SIZE INDEPENDENTLY:                         */
/* Each jar size in the 'sizes' list has its own controls:                   */
/*   • price: 175           -> Regular original price in ZAR (do not add R)  */
/*   • onSale: true / false -> Set true to activate a promotional sale       */
/*   • salePrice: 150       -> Discounted price customers actually pay       */
/*   • inStock: true / false-> Set false if this specific jar size is sold out*/
/*                                                                           */
/* 🏷️ SALE PRESENTATION:                                                     */
/* When 'onSale: true', the storefront displays a bright golden SALE badge,  */
/* crosses out the original price (e.g. R 175), and shows the sale price!    */
/*                                                                           */
/* 🚫 OUT OF STOCK PRESENTATION:                                             */
/* When 'inStock: false', the size shows 'Sold Out' and cannot be ordered.   */
/*                                                                           */
/* 📌 HOW TO ADD A NEW PRODUCT VARIETY:                                      */
/* Copy the template below and paste it inside the 'products' array:         */
/*                                                                           */
/*   {                                                                       */
/*     id: "my-honey-id",                                                    */
/*     name: "Coastal Blossom Honey",                                        */
/*     subtitle: "Raw Artisanal Reserve",                                    */
/*     category: "raw", // 'raw', 'creamed', or 'comb'                       */
/*     origin: "Sherwood, Durban, KZN",                                      */
/*     price: 175,                                                           */
/*     weight: "500g Glass Jar",                                             */
/*     sizes: [                                                              */
/*       { size: "250g", weight: "250g Glass Jar", price: 90,  salePrice: 75,  onSale: false, inStock: true },  */
/*       { size: "500g", weight: "500g Glass Jar", price: 175, salePrice: 150, onSale: true,  inStock: true },  */
/*       { size: "1kg",  weight: "1kg Glass Jar",  price: 210, salePrice: 190, onSale: false, inStock: false }  */
/*     ],                                                                    */
/*     inStock: true,                                                        */
/*     image: "images/my-honey.jpg",                                         */
/*     fallbackImage: "src/assets/images/HONEY.jpg",                         */
/*     gallery: ["images/my-honey.jpg"],                                     */
/*     flavorNotes: ["Floral", "Citrus", "Crisp"],                           */
/*     harvestSeason: "Autumn 2026 Harvest",                                 */
/*     description: "Describe floral aroma, terroir notes and color...",     */
/*     pairings: "Cheeses, morning oats, teas..."                            */
/*   },                                                                      */
/* ========================================================================= */
export const products = [
  {
    id: "litchi-blossom",
    name: "Litchi Blossom Honey",
    subtitle: "Raw, unfiltered and cold extracted",
    category: "raw",
    origin: "Durban, KwaZulu-Natal",
    price: 140,
    weight: "500g Glass Jar",
    sizes: [
      { size: "250g", weight: "250g Glass Jar", price: 90,  salePrice: 75,  onSale: false, inStock: false },
      { size: "500g", weight: "500g Glass Jar", price: 140, salePrice: 120, onSale: false,  inStock: false },
      { size: "1kg",  weight: "1kg Glass Jar",  price: 210, salePrice: 190, onSale: false, inStock: false }
    ],
    inStock: false,
    image: "images/HONEY.jpg",
    fallbackImage: "src/assets/images/HONEY.jpg",
    gallery: ["images/HONEY.jpg", "images/HONEY1.jpg"],
    flavorNotes: ["Cool Herbal Menthol", "Warm Golden Caramel", "Woodland Sweetness"],
    harvestSeason: "Late Summer 2026",
    description: "Harvested directly from mature flowering eucalyptus groves in KZN. This rare single-origin honey balances aromatic camphor warmth with a lingering, smooth buttery sweetness. Kept below 35°C during cold centrifugal extraction, retaining intact bio-active enzymes, pollen grains, and natural antioxidants.",
    pairings: "Steaming Rooibos tea, aged KwaZulu-Natal Gouda, or drizzled over fresh artisanal sourdough."
  },
  {
    id: "creamed litchi honey",
    name: "Creamed Litchi Honey",
    subtitle: "Raw, unfiltered and cold extracted",
    category: "creamed",
    origin: "KZN",
    price: 150,
    weight: "500g Glass Jar",
    sizes: [
      { size: "250g", weight: "250g Glass Jar", price: 100, salePrice: 85,  onSale: false, inStock: false },
      { size: "500g", weight: "500g Glass Jar", price: 150, salePrice: 130, onSale: false, inStock: false },
      { size: "1kg",  weight: "1kg Glass Jar",  price: 220, salePrice: 200, onSale: false,  inStock: false }
    ],
    inStock: false,
    image: "images/CREAMED.jpg",
    fallbackImage: "src/assets/images/CREAMED.jpg",
    gallery: ["images/CREAMED.jpg"],
    flavorNotes: ["Deep Amber Richness", "Sun-Drenched Blossom", "Woody Toffee Finish"],
    harvestSeason: "Late Summer 2026",
    description: "Foraged across pristine montane hills where wild proteas, yellowwoods, and mountain heather flourish. Boasts a robust, complex mineral profile with an intense golden amber hue and a velvety, heavy-bodied mouthfeel.",
    pairings: "Strong blue cheeses, roasted figs, warm morning steel-cut oats, or basting glazes for poultry."
  },
  {
    id: "eucalyptus-blossom",
    name: "Eucalyptus Blossom Honey",
    subtitle: "Raw, unfiltered and cold extracted",
    category: "raw",
    origin: "KZN",
    price: 140,
    weight: "500g Glass Jar",
    sizes: [
      { size: "250g", weight: "250g Glass Jar", price: 100, salePrice: 85,  onSale: false, inStock: false },
      { size: "500g", weight: "500g Glass Jar", price: 140, salePrice: 120, onSale: false, inStock: true },
      { size: "1kg",  weight: "1kg Glass Jar",  price: 220, salePrice: 200, onSale: false,  inStock: false }
    ],
    inStock: true,
    image: "images/eucalytus.jpg",
    fallbackImage: "src/assets/images/eucalytus.jpg",
    gallery: ["images/eucalytus.jpg"],
    flavorNotes: ["Deep Amber Richness", "Sun-Drenched Blossom", "Woody Toffee Finish"],
    harvestSeason: "Late Winter 2026",
    description: "A bold, medium-dark honey with warm caramel notes and a distinct, mildly earthy finish.",
    pairings: "Pair its robust flavor with sharp aged cheeses, strong black teas, or hearty rustic breads."
  },
  {
    id: "ketepa-pride-hex",
    name: "KETEPA Pride Hexagonal Pack",
    brand: "KETEPA",
    subtitle: "Finest Kenyan Pure Black Tea · Signature Gift Pack",
    category: "tea",
    origin: "Kericho, Great Rift Valley, Kenya",
    price: 180,
    weight: "250g Hexagonal Pack",
    sizes: [
      { size: "250g", weight: "250g Hexagonal Gift Pack", price: 180, salePrice: 150, onSale: false, inStock: true }
    ],
    inStock: true,
    image: "images/KETEPA PRIDE HEXAGONAL PACK.jpg",
    fallbackImage: "public/images/KETEPA PRIDE HEXAGONAL PACK.jpg",
    gallery: ["images/KETEPA PRIDE HEXAGONAL PACK.jpg"],
    flavorNotes: ["Brisk & Robust", "Deep Ruby-Amber Liquor", "Warm Malty Notes", "Crisp Clean Finish"],
    harvestSeason: "High-Altitude Kenyan Harvest",
    description: "Kenyan black tea blended and packed directly at source by Kenya Tea Packers (KETEPA). Perfect for gifting, it delivers a robust, invigorating cup that pairs harmoniously with our raw South African honey.",
    pairings: "NECTAR AND HIVE Raw Honey, splash of fresh milk, or a slice of fresh lemon."
  }
];
