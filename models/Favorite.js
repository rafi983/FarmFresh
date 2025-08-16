import mongoose, { Schema } from "mongoose";

const FavoriteSchema = new Schema(
  {
    userId: { type: String, index: true, required: true },
    productId: { type: String, index: true, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

FavoriteSchema.index({ userId: 1, productId: 1 }, { unique: true });
FavoriteSchema.index({ userId: 1, createdAt: -1 });
FavoriteSchema.index({ productId: 1 });

const Favorite =
  mongoose.models.Favorite || mongoose.model("Favorite", FavoriteSchema);
export default Favorite;
