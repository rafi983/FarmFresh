import mongoose, { Schema } from "mongoose";

const ReviewSchema = new Schema(
  {
    productId: { type: Schema.Types.Mixed, index: true, required: true }, // can be ObjectId or string
    userId: { type: String, index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "" },
    reviewer: { type: String },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  },
);

ReviewSchema.index({ productId: 1, createdAt: -1 });
ReviewSchema.index({ productId: 1, userId: 1 });
ReviewSchema.index({ userId: 1 });

// Recompute product rating using simple find instead of aggregation pipeline
ReviewSchema.statics.recomputeProductRating = async function (productId) {
  const Product = (await import("./Product.js")).default; // dynamic import to avoid circular refs
  const docs = await this.find({ productId }).select("rating").lean();
  if (!docs.length) {
    await Product.updateOne(
      { _id: productId },
      { $set: { averageRating: 0, totalReviews: 0, reviewCount: 0 } },
    ).catch(() => {});
    return { averageRating: 0, totalReviews: 0 };
  }
  const total = docs.reduce((s, d) => s + (d.rating || 0), 0);
  const avg = Math.round((total / docs.length) * 10) / 10;
  await Product.updateOne(
    { _id: productId },
    {
      $set: {
        averageRating: avg,
        totalReviews: docs.length,
        reviewCount: docs.length,
      },
    },
  ).catch(() => {});
  return { averageRating: avg, totalReviews: docs.length };
};

const Review = mongoose.models.Review || mongoose.model("Review", ReviewSchema);
export default Review;
