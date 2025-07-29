import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getToken } from "next-auth/jwt";

export async function GET(request) {
  try {
    // Use NextAuth's getToken to properly decode the session token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    console.log("Cart API - GET request with token:", token);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");

    const cart = await db.collection("carts").findOne({
      userId: token.sub,
    });

    console.log("Cart found:", cart);

    return NextResponse.json({
      items: cart?.items || [],
      total: cart?.total || 0,
    });
  } catch (error) {
    console.error("Cart GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    // Use NextAuth's getToken to properly decode the session token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body;

    console.log("Cart API - POST request:", {
      userId: token.sub,
      itemsCount: items?.length,
    });

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Items array is required" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Calculate total with proper error handling
    const total = items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return sum + price * quantity;
    }, 0);

    const result = await db.collection("carts").updateOne(
      { userId: token.sub },
      {
        $set: {
          items,
          total,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    console.log("Cart updated:", result);

    return NextResponse.json({
      message: "Cart updated successfully",
      items,
      total,
    });
  } catch (error) {
    console.error("Cart POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    // Use NextAuth's getToken to properly decode the session token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    console.log("Cart API - DELETE request with token:", token);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");

    const result = await db.collection("carts").deleteOne({
      userId: token.sub,
    });

    console.log("Cart cleared:", result);

    return NextResponse.json({
      message: "Cart cleared successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Cart DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
