import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../[...nextauth]/route";
import { getMongooseConnection } from "@/lib/mongoose";
import User from "@/models/User";

export async function GET(request) {
  try {
    await getMongooseConnection();
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get("userType");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit"))
      : 100;
    const search = searchParams.get("search");

    // Build query filter
    const filter = {};
    if (userType) filter.userType = userType;
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { name: regex },
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { "farmDetails.farmName": regex },
      ];
    }

    // Fetch users from database
    const users = await User.find(filter)
      .limit(limit)
      .select("-password -resetToken -resetTokenExpiry")
      .lean();

    return NextResponse.json({
      users,
      total: users.length,
      message: `Found ${users.length} users${userType ? ` of type ${userType}` : ""}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch users", details: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    await getMongooseConnection();
    // Get the session to verify user authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Handle password change
    if (body.currentPassword && body.newPassword) {
      // Verify current password
      const valid = await bcrypt.compare(
        body.currentPassword,
        user.password || "",
      );
      if (!valid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 },
        );
      }
      // Hash new password
      user.password = await bcrypt.hash(body.newPassword, 12);
    }

    // Handle other profile updates
    if (body.name) user.name = body.name;
    if (body.phone) user.phone = body.phone;
    if (body.address) user.address = body.address;
    if (body.preferences) user.preferences = body.preferences;

    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.resetToken;
    delete safeUser.resetTokenExpiry;

    return NextResponse.json({
      message: "Profile updated successfully",
      user: safeUser,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update profile", details: error.message },
      { status: 500 },
    );
  }
}
