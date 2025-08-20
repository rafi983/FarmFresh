import mongoose, { Schema } from "mongoose";

const FavoriteSchema = new Schema(
  {
    userId: { type: String, required: true },
    productId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

const Favorite =
  mongoose.models.Favorite || mongoose.model("Favorite", FavoriteSchema);
export default Favorite;
