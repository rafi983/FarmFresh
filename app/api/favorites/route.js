import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const productId = searchParams.get("productId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");

    if (productId) {
      // Check if specific product is favorited
      const favorite = await db
        .collection("favorites")
        .findOne({ userId, productId });

      return NextResponse.json({ isFavorite: !!favorite });
    } else {
      // Get all favorites for user
      const favorites = await db
        .collection("favorites")
        .find({ userId })
        .toArray();

      // Populate product details
      const populatedFavorites = [];
      for (const favorite of favorites) {
        const product = await db
          .collection("products")
          .findOne({ _id: new ObjectId(favorite.productId) });

        if (product) {
          populatedFavorites.push({
            ...favorite,
            product,
          });
        }
      }

      return NextResponse.json({ favorites: populatedFavorites });
    }
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const { productId, userId } = await request.json();

    if (!productId || !userId) {
      return NextResponse.json(
        { error: "Product ID and user ID are required" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Check if already favorited
    const existing = await db
      .collection("favorites")
      .findOne({ userId, productId });

    if (existing) {
      return NextResponse.json(
        { error: "Product already in favorites" },
        { status: 400 },
      );
    }

    // Add to favorites
    await db.collection("favorites").insertOne({
      userId,
      productId,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding favorite:", error);
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const { productId, userId } = await request.json();

    if (!productId || !userId) {
      return NextResponse.json(
        { error: "Product ID and user ID are required" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");

    await db.collection("favorites").deleteOne({ userId, productId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 },
    );
  }
}
