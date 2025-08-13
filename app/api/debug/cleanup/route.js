import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request) {
  try {
    const client = await clientPromise;
    const db = client.db("farmfresh");
    const collection = db.collection("products");

    console.log("=== STARTING DATABASE CLEANUP ===");

    // Find all products with mismatched farmer emails
    const allProducts = await collection.find({}).toArray();
    let fixedCount = 0;
    let issuesFound = [];

    for (const product of allProducts) {
      const farmerEmail = product.farmerEmail;
      const farmerFromObject = product.farmer?.email;
      const farmerId = product.farmerId;

      // Case 1: farmer.email exists but farmerEmail is missing
      if (!farmerEmail && farmerFromObject) {
        await collection.updateOne(
          { _id: product._id },
          {
            $set: {
              farmerEmail: farmerFromObject,
            },
          },
        );
        fixedCount++;
        issuesFound.push({
          productId: product._id,
          productName: product.name,
          issue: "Missing farmerEmail field",
          action: `Set farmerEmail to ${farmerFromObject}`,
        });
      }

      // Case 2: farmerEmail and farmer.email don't match
      else if (
        farmerEmail &&
        farmerFromObject &&
        farmerEmail !== farmerFromObject
      ) {
        // For real farmers with farmerId (like farmer_008), prioritize farmerEmail over farmer.email
        // This fixes cases where Ayesha (ayesha.siddika@farmfresh.com) shows Chashi's products
        if (
          farmerId &&
          (farmerId.includes("farmer_") || farmerId.match(/^[0-9a-fA-F]{24}$/))
        ) {
          await collection.updateOne(
            { _id: product._id },
            {
              $set: {
                "farmer.email": farmerEmail,
              },
            },
          );
          fixedCount++;
          issuesFound.push({
            productId: product._id,
            productName: product.name,
            issue: `Mismatched emails: farmerEmail=${farmerEmail}, farmer.email=${farmerFromObject}`,
            action: `Updated farmer.email to ${farmerEmail} (real farmer with farmerId: ${farmerId})`,
          });
        }
        // For hardcoded farmers (no farmerId or non-standard farmerId), prioritize farmer.email
        else {
          await collection.updateOne(
            { _id: product._id },
            {
              $set: {
                farmerEmail: farmerFromObject,
              },
            },
          );
          fixedCount++;
          issuesFound.push({
            productId: product._id,
            productName: product.name,
            issue: `Mismatched emails: farmerEmail=${farmerEmail}, farmer.email=${farmerFromObject}`,
            action: `Updated farmerEmail to ${farmerFromObject} (hardcoded farmer)`,
          });
        }
      }
    }

    console.log(`=== CLEANUP COMPLETE: Fixed ${fixedCount} products ===`);
    issuesFound.forEach((issue) => {
      console.log(`- ${issue.productName}: ${issue.action}`);
    });

    return NextResponse.json({
      success: true,
      message: `Database cleanup completed. Fixed ${fixedCount} products.`,
      fixedCount,
      issuesFound,
      details: "Check server console for detailed logs",
    });
  } catch (error) {
    console.error("Database cleanup error:", error);
    return NextResponse.json(
      { error: "Database cleanup failed", message: error.message },
      { status: 500 },
    );
  }
}
