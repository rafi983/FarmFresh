import mongoose, { Schema } from "mongoose";

const CartItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    name: String,
    price: { type: Number, default: 0 },
    quantity: { type: Number, default: 1 },
    image: String,
  },
  { _id: false },
);

const CartSchema = new Schema(
  {
    userId: { type: String, index: true, unique: true },
    items: [CartItemSchema],
    total: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  },
);

CartSchema.index({ userId: 1 });
CartSchema.index({ "items.productId": 1 });

const Cart = mongoose.models.Cart || mongoose.model("Cart", CartSchema);
export default Cart;
