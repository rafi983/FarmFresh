import { NextResponse } from "next/server";
import { verifyRefreshToken, generateTokens } from "@/lib/jwt";
import { getMongooseConnection } from "@/lib/mongoose";
import User from "@/models/User";

export async function POST(request) {
  try {
    await getMongooseConnection();
    const { refreshToken } = await request.json();
    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token is required" },
        { status: 400 },
      );
    }
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded?.userId) {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 },
      );
    }
    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const tokens = generateTokens({
      id: user._id,
      email: user.email,
      userType: user.userType,
    });
    return NextResponse.json({ success: true, tokens });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
