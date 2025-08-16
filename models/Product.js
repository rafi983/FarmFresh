import mongoose, { Schema } from "mongoose";

// Avoid recompilation in dev / hot-reload
const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, index: true },
    status: {
      type: String,
      enum: ["active", "inactive", "deleted"],
      default: "active",
      index: true,
    },
    featured: { type: Boolean, default: false },
    stock: { type: Number, default: 0 },
    image: { type: String },
    images: [{ type: String }],
    tags: [{ type: String }],
    isOrganic: { type: Boolean, default: false },
    isFresh: { type: Boolean, default: true },

    // Rating aggregates
    averageRating: { type: Number, default: 0, index: true },
    reviewCount: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    purchaseCount: { type: Number, default: 0 },

    // Farmer references (flexible for current data shape)
    farmerId: { type: String, index: true },
    farmer: {
      _id: { type: Schema.Types.ObjectId, ref: "Farmer" }, // if stored as ObjectId
      id: { type: String }, // if stored as string
      name: String,
      farmName: String,
      email: String,
    },

    // Flags
    featuredUntil: { type: Date },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    minimize: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  },
);

// Compound & text indexes mirroring the existing raw driver logic
ProductSchema.index(
  { status: 1, category: 1, createdAt: -1 },
  { name: "primary_query_idx" },
);
ProductSchema.index(
  { name: "text", description: "text", category: "text" },
  {
    name: "products_text_search_idx",
    weights: { name: 10, category: 5, description: 1 },
  },
);
ProductSchema.index(
  { status: 1, price: 1, averageRating: -1 },
  { name: "price_rating_idx" },
);
ProductSchema.index(
  { "farmer._id": 1, status: 1 },
  { name: "farmer_status_idx" },
);

// Helper static to build the existing query patterns (optional)
ProductSchema.statics.buildFilter = function (params = {}) {
  const {
    search,
    category,
    featured,
    farmerId,
    farmerEmail,
    minPrice,
    maxPrice,
    minRating,
    dashboard,
  } = params;

  const query = { status: { $ne: "deleted" } };
  const isDashboardContext = dashboard === "true";

  if (!farmerId && !farmerEmail && !isDashboardContext) {
    query.status = { $nin: ["deleted", "inactive"] };
  }

  if (search) {
    query.$text = { $search: search };
  }

  if (category && category !== "All Categories") {
    query.category = { $regex: new RegExp(category, "i") };
  }

  if (featured === "true") {
    query.featured = true;
  }

  if (farmerId || farmerEmail) {
    query.$or = [];
    if (farmerId) {
      query.$or.push(
        { farmerId },
        { "farmer.id": farmerId },
        { "farmer._id": farmerId },
      );
    }
    if (farmerEmail) {
      query.$or.push({ "farmer.email": farmerEmail });
    }
  }

  if (minPrice != null || maxPrice != null) {
    query.price = {};
    if (minPrice != null) query.price.$gte = Number(minPrice);
    if (maxPrice != null) query.price.$lte = Number(maxPrice);
  }

  if (minRating != null) {
    query.averageRating = { $gte: Number(minRating) };
  }

  return query;
};

const Product =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);
export default Product;
