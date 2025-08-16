import { NextResponse } from "next/server";
import { getMongooseConnection } from "@/lib/mongoose";
import Favorite from "@/models/Favorite";
import Product from "@/models/Product";

export async function GET(request) {
  try {
    await getMongooseConnection();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const productId = searchParams.get("productId");
    if (!userId)
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );

    if (productId) {
      const fav = await Favorite.findOne({ userId, productId }).lean();
      return NextResponse.json({ isFavorite: !!fav });
    }

    const favorites = await Favorite.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    if (favorites.length === 0)
      return NextResponse.json({ favorites: [], total: 0 });

    const productIds = favorites.map((f) => f.productId);
    const products = await Product.find({ _id: { $in: productIds } })
      .select(
        "name price image images category stock farmer averageRating reviewCount totalRatings isOrganic isFresh unit status",
      )
      .lean();
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const enriched = favorites
      .map((f) => {
        const p = productMap.get(f.productId);
        if (!p || p.status === "deleted") return null;
        const images =
          p.images && p.images.length
            ? p.images
            : p.image
              ? [p.image]
              : ["/placeholder-image.jpg"];
        return { ...f, product: { ...p, images } };
      })
      .filter(Boolean);

    return NextResponse.json({ favorites: enriched, total: enriched.length });
  } catch (e) {
    console.error("Favorites GET error:", e);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    await getMongooseConnection();
    const { productId, userId } = await request.json();
    if (!productId || !userId)
      return NextResponse.json(
        { error: "Product ID and user ID are required" },
        { status: 400 },
      );

    const res = await Favorite.updateOne(
      { userId, productId },
      { $setOnInsert: { userId, productId, createdAt: new Date() } },
      { upsert: true },
    );
    if (res.upsertedCount === 0 && res.matchedCount > 0) {
      return NextResponse.json(
        { error: "Product already in favorites" },
        { status: 400 },
      );
    }
    return NextResponse.json({
      success: true,
      message: "Product added to favorites",
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    await getMongooseConnection();
    const { productId, userId } = await request.json();
    if (!productId || !userId)
      return NextResponse.json(
        { error: "Product ID and user ID are required" },
        { status: 400 },
      );
    const res = await Favorite.deleteOne({ userId, productId });
    return NextResponse.json({
      success: true,
      removed: res.deletedCount > 0,
      message:
        res.deletedCount > 0
          ? "Product removed from favorites"
          : "Product was not in favorites",
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 },
    );
  }
}
