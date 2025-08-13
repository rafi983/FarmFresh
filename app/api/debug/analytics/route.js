import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const farmerEmail = searchParams.get("farmerEmail");
    const farmerId = searchParams.get("farmerId");

    const client = await clientPromise;
    const db = client.db("farmfresh");

    console.log(
      `=== ANALYTICS DEBUG FOR FARMER: ${farmerEmail} (${farmerId}) ===`,
    );

    // Get farmer's orders
    const query = {};
    if (farmerEmail && farmerId) {
      query.$or = [
        { farmerEmail: farmerEmail },
        { "farmer.email": farmerEmail },
        { farmerId: farmerId },
      ];
    }

    const orders = await db.collection("orders").find(query).toArray();

    console.log(`Total orders for farmer: ${orders.length}`);

    // Analyze orders by status
    const ordersByStatus = orders.reduce((acc, order) => {
      const status = order.status || "unknown";
      if (!acc[status]) acc[status] = { count: 0, revenue: 0 };
      acc[status].count++;
      acc[status].revenue += order.farmerSubtotal || order.total || 0;
      return acc;
    }, {});

    console.log("Orders by status:", ordersByStatus);

    // Calculate revenue specifically for delivered orders
    const deliveredOrders = orders.filter(
      (order) => order.status === "delivered",
    );
    const totalRevenue = deliveredOrders.reduce((sum, order) => {
      const revenue = order.farmerSubtotal || order.total || 0;
      console.log(
        `Order ${order._id}: Status=${order.status}, Revenue=${revenue}`,
      );
      return sum + revenue;
    }, 0);

    console.log(`Total delivered orders: ${deliveredOrders.length}`);
    console.log(`Total revenue from delivered orders: ${totalRevenue}`);

    // Check for any orders with missing revenue data
    const ordersWithoutRevenue = orders.filter(
      (order) => !order.farmerSubtotal && !order.total,
    );

    console.log(`Orders without revenue data: ${ordersWithoutRevenue.length}`);

    // Get last 30 days data for charts
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrders = deliveredOrders.filter(
      (order) => new Date(order.createdAt) >= thirtyDaysAgo,
    );

    console.log(
      `Recent delivered orders (last 30 days): ${recentOrders.length}`,
    );

    // Daily revenue breakdown for last 30 days
    const dailyRevenue = {};
    recentOrders.forEach((order) => {
      const date = new Date(order.createdAt).toISOString().split("T")[0];
      if (!dailyRevenue[date]) dailyRevenue[date] = 0;
      dailyRevenue[date] += order.farmerSubtotal || order.total || 0;
    });

    console.log("Daily revenue (last 30 days):", dailyRevenue);

    return NextResponse.json({
      message: "Analytics debug complete - check server console for details",
      summary: {
        totalOrders: orders.length,
        deliveredOrders: deliveredOrders.length,
        totalRevenue,
        ordersByStatus,
        ordersWithoutRevenue: ordersWithoutRevenue.length,
        recentDeliveredOrders: recentOrders.length,
        dailyRevenue,
      },
      sampleOrders: deliveredOrders.slice(0, 3).map((order) => ({
        _id: order._id,
        status: order.status,
        farmerSubtotal: order.farmerSubtotal,
        total: order.total,
        createdAt: order.createdAt,
        itemCount: order.items?.length || 0,
      })),
    });
  } catch (error) {
    console.error("Analytics debug error:", error);
    return NextResponse.json(
      { error: "Analytics debug failed", message: error.message },
      { status: 500 },
    );
  }
}
