import mongoose, { Schema } from "mongoose";

const FarmDetailsSchema = new Schema(
  {
    farmName: String,
    specialization: String,
    farmSize: Number,
    farmSizeUnit: { type: String, default: "acres" },
  },
  { _id: false },
);

const PreferencesSchema = new Schema(
  {
    theme: { type: String, default: "light" },
    notifications: { type: Boolean, default: true },
  },
  { _id: false },
);

const UserSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    name: String,
    username: String,
    email: { type: String },
    phone: String,
    address: Schema.Types.Mixed,
    bio: String,
    password: { type: String },
    userType: { type: String, default: "customer" },
    provider: { type: String, default: "credentials" },
    emailVerified: { type: Boolean, default: false },
    farmDetails: FarmDetailsSchema,
    preferences: PreferencesSchema,
    profilePicture: String,
    favorites: [{ type: String }],
    resetToken: String,
    resetTokenExpiry: Date,
  },
  { timestamps: true, versionKey: false },
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
