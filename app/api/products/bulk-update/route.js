import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { enhanceProductsWithRatings } from "@/lib/reviewUtils";
import { getMongooseConnection } from "@/lib/mongoose";
import Product from "@/models/Product";

// Track if indexes have been initialized to avoid repeated calls
let bulkUpdateIndexesInitialized = false;

// Constants for validation
const VALID_STATUSES = ["active", "inactive"];
const VALID_UPDATE_FIELDS = [
  "price",
  "stock",
  "status",
  "category",
  "featured",
  "description",
];
const MAX_BULK_OPERATIONS = 1000; // Prevent excessive operations

// Initialize indexes optimized for bulk operations
async function initializeBulkUpdateIndexes(db) {
  // Only initialize once per application lifecycle
  if (bulkUpdateIndexesInitialized) {
    return;
  }

  try {
    const collection = db.collection("products");

    // Check if indexes already exist before creating them
    const existingIndexes = await collection.listIndexes().toArray();
    const indexNames = existingIndexes.map((index) => index.name);

    // Bulk operation optimized indexes
    const indexesToCreate = [
      // Bulk update query optimization
      {
        key: { _id: 1, status: 1 },
        name: "bulk_update_query_idx",
        options: { background: true },
      },
      // Status filtering for bulk operations
      {
        key: { status: 1, updatedAt: -1 },
        name: "status_updated_idx",
        options: { background: true },
      },
      // Farmer-specific bulk operations
      {
        key: { farmerId: 1, status: 1 },
        name: "farmer_status_bulk_idx",
        options: { background: true },
      },
    ];

    for (const indexSpec of indexesToCreate) {
      if (!indexNames.includes(indexSpec.name)) {
        await collection.createIndex(indexSpec.key, {
          name: indexSpec.name,
          ...indexSpec.options,
        });
      }
    }

    bulkUpdateIndexesInitialized = true;
    console.log("Bulk update indexes initialized successfully");
  } catch (error) {
    console.log("Bulk update index initialization note:", error.message);
  }
}

// Clear the response cache from products API
function clearProductsResponseCache() {
  // Clear the server-side response cache
  if (global.productCache) {
    global.productCache.clear();
  }

  // Access the products route cache if available
  try {
    const productsRoute = require("../route");
    if (productsRoute && productsRoute.responseCache) {
      productsRoute.responseCache.clear();
    }
  } catch (e) {
    // Route cache might not be accessible, that's ok
    console.log("Cache clearing note:", e.message);
  }
}

// Validate and sanitize update data
function validateUpdateData(updateData) {
  const sanitizedData = {};
  const errors = [];

  // Check for allowed fields only
  const allowedFields = Object.keys(updateData).filter((field) =>
    VALID_UPDATE_FIELDS.includes(field),
  );

  if (allowedFields.length === 0) {
    errors.push("No valid update fields provided");
    return { sanitizedData: null, errors };
  }

  // Validate and sanitize each field
  for (const field of allowedFields) {
    const value = updateData[field];

    switch (field) {
      case "price":
        const price = parseFloat(value);
        if (isNaN(price) || price < 0) {
          errors.push("Price must be a valid positive number");
        } else {
          sanitizedData.price = price;
        }
        break;

      case "stock":
        const stock = parseInt(value);
        if (isNaN(stock) || stock < 0) {
          errors.push("Stock must be a valid non-negative number");
        } else {
          sanitizedData.stock = stock;
        }
        break;

      case "status":
        if (!VALID_STATUSES.includes(value)) {
          errors.push(`Status must be one of: ${VALID_STATUSES.join(", ")}`);
        } else {
          sanitizedData.status = value;
        }
        break;

      case "category":
        if (typeof value === "string" && value.trim().length > 0) {
          sanitizedData.category = value.trim();
        } else {
          errors.push("Category must be a non-empty string");
        }
        break;

      case "featured":
        if (typeof value === "boolean") {
          sanitizedData.featured = value;
        } else {
          errors.push("Featured must be a boolean value");
        }
        break;

      case "description":
        if (typeof value === "string") {
          sanitizedData.description = value.trim();
        } else {
          errors.push("Description must be a string");
        }
        break;

      default:
        // Field not in allowed list, skip
        break;
    }
  }

  return { sanitizedData, errors };
}

// Validate product IDs
function validateProductIds(productIds) {
  if (!productIds || !Array.isArray(productIds)) {
    return { valid: false, error: "Product IDs must be an array" };
  }

  if (productIds.length === 0) {
    return { valid: false, error: "Product IDs array cannot be empty" };
  }

  if (productIds.length > MAX_BULK_OPERATIONS) {
    return {
      valid: false,
      error: `Too many products selected. Maximum ${MAX_BULK_OPERATIONS} allowed`,
    };
  }

  // Validate ObjectId format
  const invalidIds = productIds.filter((id) => !ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    return {
      valid: false,
      error: `Invalid product IDs: ${invalidIds.slice(0, 5).join(", ")}${
        invalidIds.length > 5 ? "..." : ""
      }`,
    };
  }

  return {
    valid: true,
    objectIds: productIds.map((id) => new ObjectId(id)),
  };
}

export async function PUT(request) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const { productIds, updateData } = body;

    const idValidation = validateProductIds(productIds);
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error }, { status: 400 });
    }

    const { sanitizedData, errors } = validateUpdateData(updateData);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 },
      );
    }

    await getMongooseConnection();

    const updateFields = {
      ...sanitizedData,
      updatedAt: new Date(),
      lastBulkUpdate: new Date(),
    };

    const res = await Product.updateMany(
      { _id: { $in: idValidation.objectIds }, status: { $ne: "deleted" } },
      { $set: updateFields },
    );

    if (res.matchedCount === 0) {
      return NextResponse.json(
        {
          error: "No products found to update",
          details: "Products may not exist or are already deleted",
        },
        { status: 404 },
      );
    }

    clearProductsResponseCache();

    const updatedProductsRaw = await Product.find({
      _id: { $in: idValidation.objectIds },
    }).lean();
    const updatedProducts =
      await enhanceProductsWithRatings(updatedProductsRaw);

    const response = NextResponse.json({
      success: true,
      message: `Successfully updated ${res.modifiedCount} of ${res.matchedCount} products`,
      data: {
        updatedCount: res.modifiedCount,
        matchedCount: res.matchedCount,
        requestedCount: productIds.length,
        updatedProducts,
      },
      meta: {
        cacheCleared: true,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        updatedFields: Object.keys(sanitizedData),
      },
    });

    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("Surrogate-Control", "no-store");
    response.headers.set("X-Cache-Invalidate", "products,dashboard");
    response.headers.set("X-Data-Updated", new Date().toISOString());
    response.headers.set("X-Bulk-Update-Count", String(res.modifiedCount));

    return response;
  } catch (error) {
    console.error("Bulk update error:", error);
    if (error.name?.includes("Mongo")) {
      return NextResponse.json(
        {
          error: "Database operation failed",
          details: "Please try again later",
        },
        { status: 503 },
      );
    }
    if (error.message?.includes("validation")) {
      return NextResponse.json(
        { error: "Validation error", details: error.message },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        error: "Internal server error",
        details: "An unexpected error occurred during bulk update",
      },
      { status: 500 },
    );
  }
}
