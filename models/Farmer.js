import mongoose, { Schema } from "mongoose";

const FarmerSchema = new Schema(
  {
    name: { type: String },
    email: { type: String },
    location: { type: String },
    farmName: { type: String },
    description: String,
    bio: String,
    profilePicture: String,
    profileImage: String,
    specializations: [{ type: String }],
    verified: { type: Boolean, default: false },
    isCertified: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  },
);

const Farmer = mongoose.models.Farmer || mongoose.model("Farmer", FarmerSchema);
export default Farmer;
