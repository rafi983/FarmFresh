import mongoose, { Schema } from "mongoose";

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    category: { type: String },
    status: {
      type: String,
      enum: ["active", "inactive", "deleted"],
      default: "active",
    },
    featured: { type: Boolean, default: false },
    stock: { type: Number, default: 0 },
    image: { type: String },
    images: [{ type: String }],
    tags: [{ type: String }],
    isOrganic: { type: Boolean, default: false },
    isFresh: { type: Boolean, default: true },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    purchaseCount: { type: Number, default: 0 },
    farmer: {
      _id: { type: Schema.Types.ObjectId, ref: "Farmer" },
      id: { type: String },
      name: String,
      farmName: String,
      email: String,
    },
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

ProductSchema.statics.buildFilter = function (params = {}) {
  const {
    search,
    category,
    featured,
    farmerEmail,
    minPrice,
    maxPrice,
    minRating,
    dashboard,
  } = params;

  const query = { status: { $ne: "deleted" } };
  const isDashboardContext = dashboard === "true";

  if (!farmerEmail && !isDashboardContext) {
    query.status = { $nin: ["deleted", "inactive"] };
  }

  if (search) {
    const regex = new RegExp(
      search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    query.$or = [
      { name: regex },
      { description: regex },
      { category: regex },
      { tags: regex },
    ];
  }

  if (category && category !== "All Categories") {
    query.category = new RegExp(
      category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
  }

  if (featured === "true") query.featured = true;
  if (farmerEmail) query["farmer.email"] = farmerEmail;
  if (minPrice != null || maxPrice != null) {
    query.price = {};
    if (minPrice != null) query.price.$gte = Number(minPrice);
    if (maxPrice != null) query.price.$lte = Number(maxPrice);
  }
  if (minRating != null) query.averageRating = { $gte: Number(minRating) };

  return query;
};

const Product =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);
export default Product;
