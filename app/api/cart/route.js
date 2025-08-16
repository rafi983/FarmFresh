import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getMongooseConnection } from "@/lib/mongoose";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    await getMongooseConnection();
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cart = await Cart.findOne({ userId: token.sub }).lean();
    if (!cart)
      return NextResponse.json({
        items: [],
        total: 0,
        itemCount: 0,
        totalItems: 0,
      });

    const totalItems = cart.items.reduce((s, i) => s + (i.quantity || 0), 0);
    return NextResponse.json({
      items: cart.items,
      total: cart.total || 0,
      itemCount: cart.items.length,
      totalItems,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    await getMongooseConnection();
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { items } = await request.json();
    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Items array is required" },
        { status: 400 },
      );
    }

    const productIds = items
      .map((i) => {
        try {
          return new ObjectId(i.productId);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    const products = await Product.find({
      _id: { $in: productIds },
      status: { $ne: "deleted" },
    })
      .select("stock price name image images")
      .lean();
    const pMap = new Map(products.map((p) => [p._id.toString(), p]));

    const validated = [];
    let total = 0;
    for (const item of items) {
      const p = pMap.get(item.productId);
      if (!p) continue;
      const quantity = Math.max(1, parseInt(item.quantity) || 1);
      if (quantity > p.stock) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${p.name}. Available: ${p.stock}, Requested: ${quantity}`,
          },
          { status: 400 },
        );
      }
      const price =
        typeof item.price === "number" && item.price > 0
          ? item.price
          : p.price || 0;
      validated.push({
        productId: item.productId,
        name: p.name,
        price,
        quantity,
        image: p.image || p.images?.[0],
      });
      total += price * quantity;
    }
    total = Math.round(total * 100) / 100;

    await Cart.updateOne(
      { userId: token.sub },
      { $set: { items: validated, total } },
      { upsert: true },
    );
    return NextResponse.json({
      message: "Cart updated successfully",
      items: validated,
      total,
      itemCount: validated.length,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    await getMongooseConnection();
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const res = await Cart.deleteOne({ userId: token.sub });
    return NextResponse.json({
      message: "Cart cleared successfully",
      deletedCount: res.deletedCount,
      wasCleared: res.deletedCount > 0,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
