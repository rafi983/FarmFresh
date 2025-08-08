import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../[...nextauth]/route";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get("userType");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit"))
      : 100;
    const search = searchParams.get("search");

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Build query filter
    let filter = {};

    if (userType) {
      filter.userType = userType;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { "farmDetails.farmName": { $regex: search, $options: "i" } },
      ];
    }

    console.log("📋 Users API - Query filter:", filter);
    console.log("📋 Users API - Limit:", limit);

    // Fetch users from database
    const users = await db
      .collection("users")
      .find(filter)
      .limit(limit)
      .project({
        // Exclude sensitive information
        password: 0,
        resetPasswordToken: 0,
        resetPasswordExpires: 0,
      })
      .toArray();

    console.log("📋 Users API - Found users:", users.length);
    console.log(
      "📋 Users API - Sample users:",
      users.slice(0, 2).map((u) => ({
        name: u.name,
        userType: u.userType,
        farmName: u.farmDetails?.farmName,
      })),
    );

    return NextResponse.json({
      users,
      total: users.length,
      message: `Found ${users.length} users${userType ? ` of type ${userType}` : ""}`,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users", details: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    // Get the session to verify user authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Find the user by email (session email)
    const user = await db
      .collection("users")
      .findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let updateData = {};

    // Handle password change
    if (body.currentPassword && body.newPassword) {
      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        body.currentPassword,
        user.password,
      );

      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 },
        );
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(body.newPassword, saltRounds);
      updateData.password = hashedNewPassword;
    }

    // Handle other profile updates
    if (body.name) updateData.name = body.name;
    if (body.phone) updateData.phone = body.phone;
    if (body.address) updateData.address = body.address;
    if (body.preferences) updateData.preferences = body.preferences;

    // Add updated timestamp
    updateData.updatedAt = new Date();

    console.log("📝 Profile update data:", {
      ...updateData,
      password: updateData.password ? "[HIDDEN]" : undefined,
    });

    // Update the user in database
    const result = await db
      .collection("users")
      .updateOne({ email: session.user.email }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get updated user (excluding password)
    const updatedUser = await db
      .collection("users")
      .findOne(
        { email: session.user.email },
        {
          projection: {
            password: 0,
            resetPasswordToken: 0,
            resetPasswordExpires: 0,
          },
        },
      );

    console.log("✅ Profile updated successfully for:", session.user.email);

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile", details: error.message },
      { status: 500 },
    );
  }
}
