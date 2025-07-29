import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const specialization = searchParams.get("specialization");
    const location = searchParams.get("location");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit"))
      : null;
    const page = parseInt(searchParams.get("page")) || 1;

    const client = await clientPromise;
    const db = client.db("farmfresh");

    let allFarmers = [];

    // First try to get farmers directly from the collection
    const directFarmers = await db.collection("farmers").find({}).toArray();

    // Check if we have direct farmer documents or nested structure
    if (directFarmers.length > 0) {
      directFarmers.forEach((doc) => {
        if (doc.farmers && Array.isArray(doc.farmers)) {
          // This is a document containing a farmers array
          allFarmers = allFarmers.concat(doc.farmers);
        } else if (doc.name && doc.location) {
          // This is a direct farmer document
          allFarmers.push(doc);
        }
      });
    }

    // Filter farmers based on search parameters
    let filteredFarmers = allFarmers;

    if (search) {
      filteredFarmers = filteredFarmers.filter(
        (farmer) =>
          farmer.name?.toLowerCase().includes(search.toLowerCase()) ||
          farmer.description?.toLowerCase().includes(search.toLowerCase()) ||
          farmer.location?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (specialization) {
      filteredFarmers = filteredFarmers.filter((farmer) =>
        farmer.specializations?.some((spec) =>
          spec.toLowerCase().includes(specialization.toLowerCase()),
        ),
      );
    }

    if (location) {
      filteredFarmers = filteredFarmers.filter((farmer) =>
        farmer.location?.toLowerCase().includes(location.toLowerCase()),
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * (limit || filteredFarmers.length);
    const endIndex = limit ? startIndex + limit : filteredFarmers.length;
    const paginatedFarmers = filteredFarmers.slice(startIndex, endIndex);

    console.log(
      `Found ${allFarmers.length} total farmers, returning ${paginatedFarmers.length} after filtering`,
    );

    return NextResponse.json({
      farmers: paginatedFarmers,
      total: filteredFarmers.length,
      page,
      totalPages: limit ? Math.ceil(filteredFarmers.length / limit) : 1,
    });
  } catch (error) {
    console.error("Error fetching farmers:", error);
    return NextResponse.json(
      { error: "Failed to fetch farmers" },
      { status: 500 },
    );
  }
}
