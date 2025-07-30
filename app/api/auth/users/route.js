import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

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
