import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/email-resend"; // Use Resend
import crypto from "crypto";
import { getMongooseConnection } from "@/lib/mongoose";
import User from "@/models/User";

export async function POST(request) {
  try {
    await getMongooseConnection();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const user = await User.findOne({ email }).lean();
    // Return success even if user doesn't exist for security
    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token to database
    await User.updateOne(
      { _id: user._id },
      { $set: { resetToken, resetTokenExpiry } },
    );

    // Send email
    const emailResult = await sendPasswordResetEmail(email, resetToken);
    if (!emailResult.success) {
      return NextResponse.json(
        { error: "Failed to send reset email" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password reset email sent successfully",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
