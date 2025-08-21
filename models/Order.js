import mongoose, { Schema } from "mongoose";

const OrderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.Mixed },
    name: String,
    productName: String,
    price: { type: Number, default: 0 },
    quantity: { type: Number, default: 1 },
    subtotal: { type: Number, default: 0 },
    farmerEmail: { type: String },
    farmerName: { type: String },
    farmer: { type: Schema.Types.Mixed },
    image: String,
    productImage: String,
    images: [String],
  },
  { _id: true },
);

const StatusHistorySchema = new Schema(
  {
    status: String,
    at: { type: Date, default: Date.now },
    note: String,
  },
  { _id: false },
);

const OrderSchema = new Schema(
  {
    userId: { type: String },
    items: [OrderItemSchema],
    status: { type: String },
    total: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    farmerSubtotal: { type: Number, default: 0 },
    farmerStatuses: { type: Schema.Types.Mixed }, // { [encodedFarmerEmail]: status }
    farmerStatusesArr: [
      new Schema(
        { farmerEmail: String, status: String },
        { _id: false },
      ),
    ],
    customerName: String,
    customerEmail: String,
    customerPhone: String,
    customerInfo: Schema.Types.Mixed,
    shippingAddress: Schema.Types.Mixed,
    deliveryAddress: Schema.Types.Mixed,
    paymentMethod: String,
    statusHistory: [StatusHistorySchema],
    farmerEmails: [String],
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  },
);

OrderSchema.statics.buildFilter = function (params = {}) {
  const { userId, farmerEmail, productId, status } = params;
  const query = {};
  if (userId) query.userId = userId;
  if (status) query.status = status;
  if (productId) query["items.productId"] = productId;
  if (farmerEmail) {
    query.$or = [
      { "items.farmerEmail": farmerEmail },
      { "items.farmer.email": farmerEmail },
      { farmerEmails: farmerEmail },
    ];
  }
  return query;
};

const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);
export default Order;
