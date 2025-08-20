#!/usr/bin/env node
// Inspection script for farmer/product references.
// Expects MONGODB_URI to be set in the environment (no dotenv usage here).
// Usage (PowerShell):  $env:MONGODB_URI="mongodb+srv://..."; node scripts/inspect-farmer-refs.mjs
// Usage (bash): MONGODB_URI="mongodb+srv://..." node scripts/inspect-farmer-refs.mjs

import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";

function loadEnvFile(filename) {
  try {
    const full = path.join(process.cwd(), filename);
    if (!fs.existsSync(full)) return null;
    const lines = fs.readFileSync(full, "utf8").split(/\r?\n/);
    for (const line of lines) {
      if (/^MONGODB_URI\s*=/.test(line)) {
        return line
          .replace(/^MONGODB_URI\s*=\s*/, "")
          .trim()
          .replace(/^['"]|['"]$/g, "");
      }
    }
  } catch (_) {}
  return null;
}

function resolveMongoUri() {
  // 1. --uri= argument
  const uriArg = process.argv.find((a) => a.startsWith("--uri="));
  if (uriArg) return uriArg.slice(6);
  // 2. first positional after script name
  if (process.argv[2] && !process.argv[2].startsWith("--"))
    return process.argv[2];
  // 3. env var
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  // 4. .env.local then .env
  const fromEnvLocal = loadEnvFile(".env.local");
  if (fromEnvLocal) return fromEnvLocal;
  const fromEnv = loadEnvFile(".env");
  if (fromEnv) return fromEnv;
  return null;
}

function mask(uri) {
  if (!uri) return uri;
  try {
    const parts = uri.split("@");
    if (parts.length < 2) return uri;
    const cred = parts[0];
    if (!cred.includes(":")) return uri;
    const [schemeAndUser, pass] = cred.split(":");
    if (pass.startsWith("//")) return uri; // no password
    return schemeAndUser + ":***@" + parts.slice(1).join("@");
  } catch {
    return uri;
  }
}

async function run() {
  const uri = resolveMongoUri();
  if (!uri) {
    console.error(
      "MongoDB URI not found. Provide one via (priority order):\n  1) --uri=YOUR_URI\n  2) first positional arg\n  3) MONGODB_URI env var\n  4) .env.local or .env file containing MONGODB_URI=...\n\nExamples:\n  node scripts/inspect-farmer-refs.mjs --uri=mongodb+srv://user:pass@cluster/db\n  MONGODB_URI=... node scripts/inspect-farmer-refs.mjs\n  node scripts/inspect-farmer-refs.mjs mongodb+srv://user:pass@cluster/db\n",
    );
    process.exit(1);
  }
  console.log("Using MongoDB URI:", mask(uri));

  const client = new MongoClient(uri, { maxPoolSize: 2 });
  await client.connect();
  const db = client.db("farmfresh");

  const farmersCol = db.collection("farmers");
  const productsCol = db.collection("products");

  const farmerCount = await farmersCol.countDocuments();
  const productCount = await productsCol.countDocuments();

  const sampleFarmers = await farmersCol
    .find({}, { projection: { _id: 1, email: 1, name: 1 } })
    .limit(10)
    .toArray();

  // Distinct reference fields in products
  const distinctFarmerEmails = await productsCol.distinct("farmer.email");
  const distinctFarmerEmailRoot = await productsCol.distinct("farmerEmail");
  const distinctFarmerIds = await productsCol.distinct("farmerId");
  const distinctFarmerNestedIds = await productsCol.distinct("farmer._id");
  const distinctFarmerNestedStrIds = await productsCol.distinct("farmer.id");

  // Sample products with farmer linkage
  const sampleProducts = await productsCol
    .find(
      {
        $or: [
          { "farmer.email": { $exists: true } },
          { farmerEmail: { $exists: true } },
        ],
      },
      {
        projection: {
          name: 1,
          "farmer.email": 1,
          farmerEmail: 1,
          farmerId: 1,
          "farmer._id": 1,
          "farmer.id": 1,
        },
      },
    )
    .limit(15)
    .toArray();

  const productsWithoutEmail = await productsCol.countDocuments({
    $and: [
      {
        $or: [{ "farmer.email": { $exists: false } }, { "farmer.email": null }],
      },
      { $or: [{ farmerEmail: { $exists: false } }, { farmerEmail: null }] },
    ],
  });

  console.log("\n=== Farmer Collection Summary ===");
  console.log("Total farmers:", farmerCount);
  console.log("Sample farmers (id, email, name):");
  console.table(
    sampleFarmers.map((f) => ({
      id: f._id?.toString(),
      email: f.email,
      name: f.name,
    })),
  );

  console.log("\n=== Product Farmer Reference Summary ===");
  console.log("Total products:", productCount);
  console.log("Distinct farmer.email count:", distinctFarmerEmails.length);
  console.log(
    "Distinct root farmerEmail count:",
    distinctFarmerEmailRoot.length,
  );
  console.log("Distinct farmerId count:", distinctFarmerIds.length);
  console.log("Distinct farmer._id count:", distinctFarmerNestedIds.length);
  console.log("Distinct farmer.id count:", distinctFarmerNestedStrIds.length);
  console.log(
    "Products missing BOTH email refs (farmer.email & farmerEmail):",
    productsWithoutEmail,
  );

  console.log("\nSample linked products:");
  console.table(
    sampleProducts.map((p) => ({
      name: p.name,
      farmerEmailObj: p.farmer?.email,
      farmerEmailRoot: p.farmerEmail,
      farmerId: p.farmerId,
      farmerObjId: p.farmer?._id ? p.farmer._id.toString() : null,
      farmerObjStrId: p.farmer?.id,
    })),
  );

  console.log("\nRecommendation:");
  if (productsWithoutEmail === 0 && distinctFarmerEmails.length > 0) {
    console.log(
      "- All products have at least one email reference; safe to rely solely on email matching.",
    );
  } else {
    console.log(
      "- Some products lack email references; consider backfilling before removing id fallback.",
    );
  }

  await client.close();
}

run().catch((err) => {
  console.error("Inspection failed:", err);
  process.exit(1);
});
