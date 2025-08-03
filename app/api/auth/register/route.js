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

    // If user is a farmer, also add them to the farmers collection
    if (userType === "farmer") {
      try {
        const farmersCollection = db.collection("farmers");

        // Create farmer document for the farmers collection
        const farmerData = {
          _id: result.insertedId, // Use same ID as user
          name: `${firstName} ${lastName}`,
          email: email,
          phone: phone,
          location: address, // Using address as location
          farmName: farmName,
          specializations: Array.isArray(specialization)
            ? specialization
            : [specialization],
          farmSize: farmSize ? parseFloat(farmSize) : null,
          farmSizeUnit: farmSizeUnit || "acres",
          bio: bio || "",
          profilePicture: profilePicture || null,
          rating: 0, // Default rating
          totalReviews: 0,
          verified: false, // Default verification status
          joinedDate: new Date(),
          products: [], // Will be populated when farmer adds products
          orders: [], // Will be populated when farmer gets orders
          availability: {
            status: "available",
            schedule: {
              monday: { start: "09:00", end: "17:00", available: true },
              tuesday: { start: "09:00", end: "17:00", available: true },
              wednesday: { start: "09:00", end: "17:00", available: true },
              thursday: { start: "09:00", end: "17:00", available: true },
              friday: { start: "09:00", end: "17:00", available: true },
              saturday: { start: "09:00", end: "15:00", available: true },
              sunday: { start: "10:00", end: "14:00", available: false },
            },
          },
          socialMedia: {
            facebook: "",
            instagram: "",
            twitter: "",
            website: "",
          },
          certifications: [], // Organic, GAP, etc.
          deliveryOptions: {
            farmPickup: true,
            localDelivery: false,
            shipping: false,
            deliveryRadius: 0, // in miles/km
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Insert farmer document
        await farmersCollection.insertOne(farmerData);

        console.log(`Added farmer ${farmerData.name} to farmers collection`);
      } catch (farmerError) {
        console.error(
          "Error adding farmer to farmers collection:",
          farmerError,
        );
        // Note: We don't fail the registration if farmer collection insert fails
        // The user is still created successfully in the users collection
      }
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
