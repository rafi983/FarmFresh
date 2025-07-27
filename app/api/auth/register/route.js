import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";
import { generateTokens } from "@/lib/jwt";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      bio,
      password,
      confirmPassword,
      userType,
      farmName,
      specialization,
      farmSize,
      farmSizeUnit,
      profilePicture,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !address || !password) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: firstName, lastName, email, phone, address, password",
        },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Validate password match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 },
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 },
      );
    }

    // Validate farmer-specific fields if userType is farmer
    if (userType === "farmer" && (!farmName || !specialization)) {
      return NextResponse.json(
        { error: "Farm name and specialization are required for farmers" },
        { status: 400 },
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("farmfresh");
    const users = db.collection("users");

    // Check if user already exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Prepare user data
    const userData = {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`, // Full name for compatibility
      email,
      phone,
      address,
      bio: bio || "",
      password: hashedPassword,
      userType: userType || "customer",
      provider: "credentials",
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add farmer-specific fields if applicable
    if (userType === "farmer") {
      userData.farmDetails = {
        farmName,
        specialization,
        farmSize: farmSize ? parseFloat(farmSize) : null,
        farmSizeUnit: farmSizeUnit || "acres",
      };
    }

    // Add profile picture if provided (for now, just store the filename/path)
    if (profilePicture) {
      userData.profilePicture = profilePicture;
    }

    // Insert user into database
    const result = await users.insertOne(userData);

    if (!result.insertedId) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 },
      );
    }

    // Generate JWT tokens
    const userForToken = {
      id: result.insertedId,
      email: userData.email,
      name: userData.name,
      userType: userData.userType,
    };

    const tokens = generateTokens(userForToken);

    // Return success response with user data and tokens
    const responseUser = {
      id: result.insertedId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      userType: userData.userType,
      farmDetails: userData.farmDetails || null,
    };

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: responseUser,
        tokens,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
