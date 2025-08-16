import mongoose, { Schema } from "mongoose";

const FarmerSchema = new Schema(
  {
    name: { type: String, index: true },
    email: { type: String, index: true },
    location: { type: String, index: true },
    farmName: { type: String, index: true },
    description: String,
    bio: String,
    profilePicture: String,
    profileImage: String,
    specializations: [{ type: String, index: true }],
    verified: { type: Boolean, default: false, index: true },
    isCertified: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  },
);

FarmerSchema.index({
  name: "text",
  description: "text",
  location: "text",
  farmName: "text",
  specializations: "text",
});
FarmerSchema.index({ location: 1, verified: 1 });
FarmerSchema.index({ specializations: 1, verified: 1 });
FarmerSchema.index({ verified: 1, isCertified: 1, createdAt: -1 });

const Farmer = mongoose.models.Farmer || mongoose.model("Farmer", FarmerSchema);
export default Farmer;
