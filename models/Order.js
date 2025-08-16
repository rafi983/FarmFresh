import mongoose, { Schema } from "mongoose";

const OrderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.Mixed, index: true },
    name: String,
    productName: String,
    price: { type: Number, default: 0 },
    quantity: { type: Number, default: 1 },
    subtotal: { type: Number, default: 0 },
    farmerId: { type: String },
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
    userId: { type: String, index: true },
    items: [OrderItemSchema],
    status: { type: String, index: true },
    total: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    farmerSubtotal: { type: Number, default: 0 },
    customerName: String,
    customerEmail: String,
    customerPhone: String,
    customerInfo: Schema.Types.Mixed,
    shippingAddress: Schema.Types.Mixed,
    deliveryAddress: Schema.Types.Mixed,
    paymentMethod: String,
    statusHistory: [StatusHistorySchema],
    farmerIds: [String],
    farmerEmails: [String],
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  },
);

// Indexes mirroring existing driver-based indexes
OrderSchema.index(
  { userId: 1, createdAt: -1 },
  { name: "userId_createdAt_idx" },
);
OrderSchema.index(
  { "items.farmerId": 1, status: 1, createdAt: -1 },
  { name: "items_farmerId_status_date_idx" },
);
OrderSchema.index(
  { "items.farmerEmail": 1, status: 1, createdAt: -1 },
  { name: "items_farmerEmail_status_date_idx" },
);
OrderSchema.index(
  { farmerIds: 1, createdAt: -1 },
  { name: "farmerIds_createdAt_idx" },
);
OrderSchema.index(
  { farmerEmails: 1, createdAt: -1 },
  { name: "farmerEmails_createdAt_idx" },
);
OrderSchema.index(
  { "items.productId": 1, createdAt: -1 },
  { name: "items_productId_createdAt_idx" },
);
OrderSchema.index(
  { status: 1, createdAt: -1 },
  { name: "status_createdAt_idx" },
);
OrderSchema.index({ createdAt: -1 }, { name: "createdAt_idx" });

OrderSchema.statics.buildFilter = function (params = {}) {
  const { userId, farmerId, farmerEmail, productId, status } = params;
  const query = {};
  if (userId) query.userId = userId;
  if (status) query.status = status;
  if (productId) query["items.productId"] = productId;
  if (farmerId || farmerEmail) {
    const farmerConditions = [];
    if (farmerId) {
      farmerConditions.push(
        { "items.farmerId": farmerId },
        { "items.farmer.id": farmerId },
        { "items.farmer._id": farmerId },
        { farmerIds: farmerId },
      );
    }
    if (farmerEmail) {
      farmerConditions.push(
        { "items.farmerEmail": farmerEmail },
        { "items.farmer.email": farmerEmail },
        { farmerEmails: farmerEmail },
      );
    }
    query.$or = farmerConditions;
  }
  return query;
};

const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);
export default Order;
