import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";

// Default password for all farmers
const DEFAULT_PASSWORD = "farmer123";

// Hardcoded farmers data
const hardcodedFarmers = [
  {
    _id: "farmer_001",
    name: "Abdul Rahman",
    email: "abdul.rahman@farmfresh.com",
    phone: "+880 1712 345678",
    location: "Rajshahi, Bangladesh",
    farmName: "Farm 001",
    specializations: ["Grains", "Honey"],
  },
  {
    _id: "farmer_002",
    name: "Sufia Begum",
    email: "sufia.begum@farmfresh.com",
    phone: "+880 1818 901234",
    location: "Sylhet, Bangladesh",
    farmName: "Farm 002",
    specializations: ["Fruits", "Herbs"],
  },
  {
    _id: "farmer_003",
    name: "Fatema Begum",
    email: "fatema.begum@farmfresh.com",
    phone: "+880 1813 456789",
    location: "Dhaka, Bangladesh",
    farmName: "Farm 003",
    specializations: ["Vegetables", "Fruits", "Honey"],
  },
  {
    _id: "farmer_004",
    name: "Ibrahim Khalil",
    email: "ibrahim.khalil@farmfresh.com",
    phone: "+880 1717 890123",
    location: "Barishal, Bangladesh",
    farmName: "Farm 004",
    specializations: ["Fruits", "Dairy", "Herbs"],
  },
  {
    _id: "farmer_005",
    name: "Mizanur Rahman",
    email: "mizanur.rahman@farmfresh.com",
    phone: "+880 1521 234567",
    location: "Tangail, Bangladesh",
    farmName: "Farm 005",
    specializations: ["Dairy", "Vegetables"],
  },
  {
    _id: "farmer_006",
    name: "Mostafa Kamal",
    email: "mostafa.kamal@farmfresh.com",
    phone: "+880 1521 234567",
    location: "Gazipur, Bangladesh",
    farmName: "Farm 006",
    specializations: ["Vegetables", "Dairy"],
  },
  {
    _id: "farmer_007",
    name: "Rubina Akter",
    email: "rubina.akter@farmfresh.com",
    phone: "+880 1420 123456",
    location: "Netrokona, Bangladesh",
    farmName: "Farm 007",
    specializations: ["Herbs", "Honey"],
  },
  {
    _id: "farmer_008",
    name: "Ayesha Siddika",
    email: "ayesha.siddika@farmfresh.com",
    phone: "+880 1515 678901",
    location: "Khulna, Bangladesh",
    farmName: "Farm 008",
    specializations: ["Fruits", "Honey"],
  },
  {
    _id: "farmer_009",
    name: "Khanzad Ali",
    email: "khanzad.ali@farmfresh.com",
    phone: "+880 1919 012345",
    location: "Sylhet, Bangladesh",
    farmName: "Farm 009",
    specializations: ["Honey", "Vegetables"],
  },
];

export async function POST(request) {
  try {
    const client = await clientPromise;
    const db = client.db("farmfresh");
    const usersCollection = db.collection("users");

    // Hash the default password
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    const results = [];

    for (const farmer of hardcodedFarmers) {
      try {
        // Check if user already exists
        const existingUser = await usersCollection.findOne({
          email: farmer.email,
        });

        if (existingUser) {
          results.push({
            farmer: farmer.name,
            email: farmer.email,
            status: "already_exists",
          });
          continue;
        }

        // Split name into first and last name
        const nameParts = farmer.name.split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || "";

        // Create user document
        const userData = {
          _id: farmer._id,
          firstName: firstName,
          lastName: lastName,
          name: farmer.name,
          email: farmer.email,
          phone: farmer.phone,
          address: farmer.location,
          bio: "",
          password: hashedPassword,
          userType: "farmer",
          provider: "credentials",
          emailVerified: true,
          farmDetails: {
            farmName: farmer.farmName,
            specialization: farmer.specializations,
            farmSize: null,
            farmSizeUnit: "acres",
          },
          profilePicture: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Insert user
        await usersCollection.insertOne(userData);
        results.push({
          farmer: farmer.name,
          email: farmer.email,
          status: "created",
        });
      } catch (error) {
        results.push({
          farmer: farmer.name,
          email: farmer.email,
          status: "error",
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      message: "Farmer user creation completed",
      defaultPassword: DEFAULT_PASSWORD,
      results: results,
    });
  } catch (error) {
    console.error("Error creating farmer users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
