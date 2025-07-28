import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  enhanceProductWithRatings,
  enhanceProductsWithRatings,
} from "@/lib/reviewUtils";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // First try to find product by string ID (most products use string IDs)
    let targetProduct = await db.collection("products").findOne({ _id: id });

    // If not found, try with ObjectId (for MongoDB generated IDs)
    if (!targetProduct && ObjectId.isValid(id)) {
      targetProduct = await db
        .collection("products")
        .findOne({ _id: new ObjectId(id) });
    }

    // If still not found, try searching in nested structures (legacy support)
    if (!targetProduct) {
      const productDocuments = await db
        .collection("products")
        .find({})
        .toArray();

      productDocuments.forEach((doc) => {
        if (doc.products && Array.isArray(doc.products)) {
          const found = doc.products.find(
            (product) => product._id === id || product._id.toString() === id,
          );
          if (found) {
            targetProduct = found;
          }
        }
      });
    }

    if (!targetProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get all products for finding related products
    let allProducts = await db.collection("products").find({}).toArray();

    // If products are in nested structure, extract them
    if (allProducts.length > 0 && allProducts[0].products) {
      let extractedProducts = [];
      allProducts.forEach((doc) => {
        if (doc.products && Array.isArray(doc.products)) {
          extractedProducts = extractedProducts.concat(doc.products);
        }
      });
      allProducts = extractedProducts;
    }

    // Add default values for missing fields
    const product = {
      ...targetProduct,
      images: targetProduct.images || [
        `https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&h=600&fit=crop`,
        `https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&h=600&fit=crop`,
        `https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&h=600&fit=crop`,
      ],
      farmer: targetProduct.farmer || {
        name: "Local Farmer",
        location: "Bangladesh",
        bio: "Dedicated to providing fresh, high-quality produce using sustainable farming practices.",
        experience: 5,
      },
      stock: targetProduct.stock || 50,
      isOrganic: targetProduct.isOrganic || false,
      isFresh: targetProduct.isFresh || true,
      features: targetProduct.features || [
        "Fresh",
        "Locally sourced",
        "High quality",
      ],
    };

    // Calculate real ratings and review counts from reviews data
    const enhancedProduct = enhanceProductWithRatings(product);

    // Get related products (same category, exclude current product)
    let relatedProducts = allProducts
      .filter(
        (p) =>
          p.category === enhancedProduct.category &&
          p._id !== enhancedProduct._id,
      )
      .slice(0, 4)
      .map((p) => ({
        ...p,
        images: p.images || [
          `https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop`,
        ],
        farmer: p.farmer || { name: "Local Farmer", location: "Bangladesh" },
        stock: p.stock || 50,
        isOrganic: p.isOrganic || false,
        isFresh: p.isFresh || true,
      }));

    // Calculate real ratings for related products too
    relatedProducts = enhanceProductsWithRatings(relatedProducts);

    return NextResponse.json({
      product: enhancedProduct,
      relatedProducts,
    });
  } catch (error) {
    console.error("Error fetching product details:", error);
    return NextResponse.json(
      { error: "Failed to fetch product details" },
      { status: 500 },
    );
  }
}
