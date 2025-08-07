"use client";

import { useState } from "react";

export default function AdminFixPage() {
  const [fixing, setFixing] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [result, setResult] = useState(null);
  const [diagnostic, setDiagnostic] = useState(null);

  const runDiagnostic = async () => {
    setDiagnosing(true);
    setDiagnostic(null);

    try {
      const response = await fetch("/api/admin/diagnose-purchase-counts", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      setDiagnostic(data);
    } catch (error) {
      console.error("Error running diagnostic:", error);
      setDiagnostic({
        success: false,
        error: "Failed to run diagnostic",
        details: error.message,
      });
    } finally {
      setDiagnosing(false);
    }
  };

  const fixPurchaseCounts = async () => {
    setFixing(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/fix-purchase-counts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error fixing purchase counts:", error);
      setResult({
        success: false,
        error: "Failed to fix purchase counts",
        details: error.message,
      });
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <i className="fas fa-tools mr-3 text-blue-600"></i>
            Admin Tools - Fix Purchase Counts
          </h1>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <i className="fas fa-exclamation-triangle text-yellow-600 mt-1 mr-3"></i>
              <div>
                <h3 className="font-medium text-yellow-800 mb-1">
                  What this does:
                </h3>
                <p className="text-yellow-700 text-sm">
                  This will scan all delivered orders and update product
                  purchase counts to show accurate numbers. Products that were
                  purchased before the system was tracking will be fixed.
                </p>
              </div>
            </div>
          </div>

          {/* Diagnostic Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-stethoscope mr-2 text-green-600"></i>
              Step 1: Run Diagnostic
            </h2>

            <button
              onClick={runDiagnostic}
              disabled={diagnosing}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                diagnosing
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white transform hover:scale-105"
              }`}
            >
              {diagnosing ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Running Diagnostic...
                </>
              ) : (
                <>
                  <i className="fas fa-search mr-2"></i>
                  Check Database Status
                </>
              )}
            </button>

            {/* Diagnostic Results */}
            {diagnostic && (
              <div
                className={`mt-4 p-6 rounded-lg border-2 ${
                  diagnostic.success
                    ? "bg-blue-50 border-blue-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <h3 className="font-medium text-gray-900 mb-4">
                  📊 Database Status:
                </h3>

                {diagnostic.success && diagnostic.diagnosis && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Orders Stats */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <i className="fas fa-shopping-bag mr-2 text-blue-600"></i>
                        Orders Summary
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Orders:</span>
                          <span className="font-medium">
                            {diagnostic.diagnosis.orders.total}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-600">Delivered:</span>
                          <span className="font-medium text-green-600">
                            {diagnostic.diagnosis.orders.delivered}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-yellow-600">Pending:</span>
                          <span className="font-medium text-yellow-600">
                            {diagnostic.diagnosis.orders.pending}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600">Confirmed:</span>
                          <span className="font-medium text-blue-600">
                            {diagnostic.diagnosis.orders.confirmed}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Products Stats */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <i className="fas fa-seedling mr-2 text-green-600"></i>
                        Products Summary
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Products:</span>
                          <span className="font-medium">
                            {diagnostic.diagnosis.products.total}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>With Purchase Field:</span>
                          <span className="font-medium">
                            {
                              diagnostic.diagnosis.products
                                .withPurchaseCountField
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-600">
                            With Purchases:
                          </span>
                          <span className="font-medium text-purple-600">
                            {diagnostic.diagnosis.products.withActualPurchases}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sample Products */}
                    {diagnostic.diagnosis.sampleProducts &&
                      diagnostic.diagnosis.sampleProducts.length > 0 && (
                        <div className="md:col-span-2 bg-white p-4 rounded-lg border">
                          <h4 className="font-medium text-gray-900 mb-3">
                            📦 Sample Products:
                          </h4>
                          <div className="space-y-2 text-sm max-h-32 overflow-y-auto">
                            {diagnostic.diagnosis.sampleProducts.map(
                              (product, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0"
                                >
                                  <span className="truncate flex-1 mr-4">
                                    {product.name || "Unknown Product"}
                                  </span>
                                  <div className="flex space-x-4 text-xs">
                                    <span className="text-blue-600">
                                      Stock: {product.stock || 0}
                                    </span>
                                    <span className="text-purple-600">
                                      Purchases: {product.purchaseCount || 0}
                                    </span>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {/* Issues Found */}
                    {diagnostic.diagnosis.potentialIssues &&
                      diagnostic.diagnosis.potentialIssues.length > 0 && (
                        <div className="md:col-span-2 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                          <h4 className="font-medium text-yellow-800 mb-3">
                            ⚠️ Products That Should Have Purchase Counts:
                          </h4>
                          <div className="space-y-2 text-sm max-h-32 overflow-y-auto">
                            {diagnostic.diagnosis.potentialIssues.map(
                              (issue, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between items-center py-1 border-b border-yellow-200 last:border-b-0"
                                >
                                  <span className="truncate flex-1 mr-4">
                                    {issue.productName}
                                  </span>
                                  <div className="flex space-x-4 text-xs">
                                    <span className="text-orange-600">
                                      Current: {issue.currentPurchaseCount}
                                    </span>
                                    <span className="text-green-600">
                                      Should be ≥ {issue.orderedQuantity}
                                    </span>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {!diagnostic.success && (
                  <p className="text-red-700 bg-red-100 p-3 rounded">
                    <strong>Error:</strong>{" "}
                    {diagnostic.details || diagnostic.error}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Fix Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-wrench mr-2 text-blue-600"></i>
              Step 2: Fix Purchase Counts
            </h2>

            <button
              onClick={fixPurchaseCounts}
              disabled={fixing}
              className={`px-8 py-4 rounded-lg font-medium text-lg transition-all duration-200 ${
                fixing
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105"
              }`}
            >
              {fixing ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Fixing Purchase Counts...
                </>
              ) : (
                <>
                  <i className="fas fa-magic mr-2"></i>
                  Fix Purchase Counts Now
                </>
              )}
            </button>

            {result && (
              <div
                className={`mt-6 p-6 rounded-lg border-2 ${
                  result.success
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div
                  className={`flex items-start ${
                    result.success ? "text-green-800" : "text-red-800"
                  }`}
                >
                  <i
                    className={`${
                      result.success
                        ? "fas fa-check-circle text-green-600"
                        : "fas fa-exclamation-circle text-red-600"
                    } mt-1 mr-3`}
                  ></i>
                  <div className="flex-1">
                    <h3 className="font-medium mb-2">
                      {result.success ? "✅ Success!" : "❌ Error"}
                    </h3>
                    <p className="mb-4">{result.message}</p>

                    {result.success && result.stats && (
                      <div className="bg-white p-4 rounded border">
                        <h4 className="font-medium text-gray-900 mb-3">
                          📊 Migration Results:
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-2xl font-bold text-blue-600">
                              {result.stats.deliveredOrders}
                            </div>
                            <div className="text-gray-600">
                              Delivered Orders
                            </div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-600">
                              {result.stats.productsWithPurchases}
                            </div>
                            <div className="text-gray-600">
                              Products with Purchases
                            </div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-purple-600">
                              {result.stats.updatedProducts}
                            </div>
                            <div className="text-gray-600">
                              Products Updated
                            </div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-orange-600">
                              {result.stats.productsGivenMissingField}
                            </div>
                            <div className="text-gray-600">
                              Missing Fields Added
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {result.success &&
                      result.productDetails &&
                      result.productDetails.length > 0 && (
                        <div className="mt-4 bg-white p-4 rounded border max-h-64 overflow-y-auto">
                          <h4 className="font-medium text-gray-900 mb-3">
                            📈 Updated Products:
                          </h4>
                          <div className="space-y-2 text-sm">
                            {result.productDetails.map((product, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0"
                              >
                                <span className="font-medium text-gray-700 truncate flex-1 mr-4">
                                  {product.productName}
                                </span>
                                <span className="text-green-600 font-medium">
                                  {product.previousCount} →{" "}
                                  {product.purchaseCount} purchases
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {result.error && (
                      <p className="text-red-700 bg-red-100 p-2 rounded mt-2">
                        <strong>Details:</strong> {result.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-4">
            <a
              href="/products"
              className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200"
            >
              <i className="fas fa-eye mr-2"></i>
              View Products Page
            </a>
            <a
              href="/manage"
              className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all duration-200"
            >
              <i className="fas fa-cog mr-2"></i>
              Manage Products
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
