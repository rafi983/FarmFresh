"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Success() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const orderId = searchParams.get("orderId");

  // Initialize with a placeholder order to show success immediately
  const [order, setOrder] = useState({
    orderNumber: orderId || "LOADING...",
    createdAt: new Date().toISOString(),
    paymentMethod: "Processing...",
    status: "confirmed",
    deliveryAddress: {
      name: "Loading...",
      address: "Fetching address details...",
      city: "",
      phone: "",
    },
    items: [],
    subtotal: 0,
    deliveryFee: 0,
    serviceFee: 0,
    total: 0,
  });

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      router.push("/");
    }
  }, [orderId, router]);

  const fetchOrderDetails = async () => {
    try {
      // Use the individual order API endpoint instead of query parameter
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
      } else {
        console.error("Failed to fetch order details");
        // Keep the placeholder data if API fails
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      // Keep the placeholder data if there's an error
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const downloadInvoice = async () => {
    try {
      // Get the order number safely with fallback
      const orderNumber =
        order?.orderNumber || order?._id || orderId || `ORDER-${Date.now()}`;

      const response = await fetch(`/api/orders/${orderId}/invoice`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const { invoiceData } = await response.json();

        // Generate PDF using jsPDF
        await generatePDFInvoice(invoiceData, orderNumber);

        // Show success message
        alert("Invoice PDF downloaded successfully!");
      } else {
        console.error("Invoice API failed, using fallback");
        // Fallback: Generate simple invoice using browser print
        generateSimpleInvoice();
      }
    } catch (error) {
      console.error("Error downloading invoice:", error);
      generateSimpleInvoice();
    }
  };

  const generatePDFInvoice = async (invoiceData, orderNumber) => {
    try {
      // Dynamic import for client-side only
      const { jsPDF } = await import("jspdf");

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      let yPosition = 20;

      // Helper function to add text with automatic line breaks
      const addWrappedText = (text, x, y, maxWidth, fontSize = 10) => {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + lines.length * fontSize * 0.5;
      };

      // Header - Company Logo and Info
      doc.setFontSize(24);
      doc.setTextColor(34, 197, 94); // Green color
      doc.text("🌱 FarmFresh", 20, yPosition);

      yPosition += 8;
      doc.setFontSize(12);
      doc.setTextColor(102, 102, 102);
      doc.text("Connecting You with Local Farmers", 20, yPosition);

      yPosition += 15;
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text("INVOICE", pageWidth / 2, yPosition, { align: "center" });

      // Line separator
      yPosition += 10;
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(2);
      doc.line(20, yPosition, pageWidth - 20, yPosition);

      yPosition += 15;

      // Company Information
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("FarmFresh Ltd.", 20, yPosition);
      yPosition += 6;
      doc.setFontSize(10);
      doc.setTextColor(102, 102, 102);
      doc.text(invoiceData.company.address, 20, yPosition);
      yPosition += 5;
      doc.text(invoiceData.company.city, 20, yPosition);
      yPosition += 5;
      doc.text(`Phone: ${invoiceData.company.phone}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Email: ${invoiceData.company.email}`, 20, yPosition);

      yPosition += 15;

      // Order Information - Two columns
      const leftColumnX = 20;
      const rightColumnX = pageWidth / 2 + 10;

      // Left column - Delivery Address
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("📍 Delivery Address", leftColumnX, yPosition);
      yPosition += 8;
      doc.setFontSize(10);
      doc.setTextColor(102, 102, 102);
      doc.text(
        invoiceData.order.deliveryAddress?.name || "N/A",
        leftColumnX,
        yPosition,
      );
      yPosition += 5;
      doc.text(
        invoiceData.order.deliveryAddress?.address || "N/A",
        leftColumnX,
        yPosition,
      );
      yPosition += 5;
      doc.text(
        invoiceData.order.deliveryAddress?.city || "N/A",
        leftColumnX,
        yPosition,
      );
      yPosition += 5;
      doc.text(
        `Phone: ${invoiceData.order.deliveryAddress?.phone || "N/A"}`,
        leftColumnX,
        yPosition,
      );

      // Right column - Order Information
      let rightYPosition = yPosition - 23;
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("📋 Order Information", rightColumnX, rightYPosition);
      rightYPosition += 8;
      doc.setFontSize(10);
      doc.setTextColor(102, 102, 102);
      doc.text(`Order #: ${orderNumber}`, rightColumnX, rightYPosition);
      rightYPosition += 5;
      doc.text(
        `Date: ${new Date(
          invoiceData.order.createdAt || Date.now(),
        ).toLocaleDateString("en-GB")}`,
        rightColumnX,
        rightYPosition,
      );
      rightYPosition += 5;
      doc.text(
        `Payment: ${invoiceData.order.paymentMethod || "Credit Card"}`,
        rightColumnX,
        rightYPosition,
      );
      rightYPosition += 5;
      doc.text(
        `Status: ${invoiceData.order.status || "confirmed"}`,
        rightColumnX,
        rightYPosition,
      );

      yPosition += 20;

      // Items Table Header
      yPosition += 10;
      doc.setFillColor(34, 197, 94);
      doc.rect(20, yPosition - 5, pageWidth - 40, 10, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text("Product", 25, yPosition);
      doc.text("Farmer", 80, yPosition);
      doc.text("Qty", 120, yPosition);
      doc.text("Unit Price", 140, yPosition);
      doc.text("Total", 170, yPosition);

      yPosition += 10;

      // Items Table Body
      doc.setTextColor(0, 0, 0);
      const items = invoiceData.order.items || [];

      items.forEach((item, index) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }

        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(248, 249, 250);
          doc.rect(20, yPosition - 5, pageWidth - 40, 8, "F");
        }

        doc.setTextColor(0, 0, 0);
        doc.text(item.productName || item.name || "Product", 25, yPosition);
        doc.text(
          item.farmerName || item.farmer?.name || "Local Farmer",
          80,
          yPosition,
        );
        doc.text(String(item.quantity || 1), 120, yPosition);
        doc.text(formatPrice(item.price || 0), 140, yPosition);
        doc.text(
          formatPrice((item.price || 0) * (item.quantity || 1)),
          170,
          yPosition,
        );

        yPosition += 8;
      });

      // Total Section
      yPosition += 10;
      const totalsX = pageWidth - 80;

      doc.setDrawColor(200, 200, 200);
      doc.line(totalsX - 20, yPosition, pageWidth - 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.text("Subtotal:", totalsX - 20, yPosition);
      doc.text(
        formatPrice(invoiceData.order.subtotal || 0),
        totalsX + 20,
        yPosition,
      );
      yPosition += 6;

      doc.text("Delivery Fee:", totalsX - 20, yPosition);
      doc.text(
        formatPrice(invoiceData.order.deliveryFee || 0),
        totalsX + 20,
        yPosition,
      );
      yPosition += 6;

      doc.text("Service Fee:", totalsX - 20, yPosition);
      doc.text(
        formatPrice(invoiceData.order.serviceFee || 0),
        totalsX + 20,
        yPosition,
      );
      yPosition += 8;

      // Total line
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(1);
      doc.line(totalsX - 20, yPosition, pageWidth - 20, yPosition);
      yPosition += 8;

      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("Total Amount:", totalsX - 20, yPosition);
      doc.text(
        formatPrice(invoiceData.order.total || 0),
        totalsX + 20,
        yPosition,
      );

      // Footer
      yPosition += 20;
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.setTextColor(102, 102, 102);
      const footerText =
        "Thank you for choosing FarmFresh! Supporting local farmers, delivering fresh produce to your doorstep.";
      addWrappedText(footerText, 20, yPosition, pageWidth - 40, 10);

      yPosition += 15;
      doc.setFontSize(8);
      doc.text(
        "This is a computer-generated invoice. No signature required.",
        pageWidth / 2,
        yPosition,
        {
          align: "center",
        },
      );

      // Save the PDF
      doc.save(`invoice-${orderNumber}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      // Fallback to simple invoice
      generateSimpleInvoice();
    }
  };

  const generateSimpleInvoice = () => {
    // Get the order number safely with fallback
    const orderNumber =
      order?.orderNumber || order?._id || orderId || `ORDER-${Date.now()}`;

    const invoiceWindow = window.open("", "_blank");
    const invoiceContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-info { margin-bottom: 20px; }
            .order-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .total-section { text-align: right; }
            .total-row { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FarmFresh</h1>
            <p>Local Farmer Booking Platform</p>
            <h2>INVOICE</h2>
          </div>
          
          <div class="company-info">
            <strong>FarmFresh Ltd.</strong><br>
            123 Agriculture Street<br>
            Dhaka, Bangladesh<br>
            Phone: +880-1234-567890<br>
            Email: info@farmfresh.com
          </div>
          
          <div class="order-info">
            <div>
              <strong>Bill To:</strong><br>
              ${order.deliveryAddress.name}<br>
              ${order.deliveryAddress.address}<br>
              ${order.deliveryAddress.city}<br>
              Phone: ${order.deliveryAddress.phone}
            </div>
            <div>
              <strong>Order Details:</strong><br>
              Order #: ${order.orderNumber}<br>
              Date: ${new Date(order.createdAt).toLocaleDateString()}<br>
              Payment Method: ${order.paymentMethod}
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Farmer</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.farmerName}</td>
                  <td>${item.quantity}</td>
                  <td>${formatPrice(item.price)}</td>
                  <td>${formatPrice(item.price * item.quantity)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          
          <div class="total-section">
            <p>Subtotal: ${formatPrice(order.subtotal)}</p>
            <p>Delivery Fee: ${formatPrice(order.deliveryFee)}</p>
            <p>Service Fee: ${formatPrice(order.serviceFee)}</p>
            <p class="total-row">Total: ${formatPrice(order.total)}</p>
          </div>
          
          <p style="margin-top: 30px; text-align: center; color: #666;">
            Thank you for choosing FarmFresh!
          </p>
        </body>
      </html>
    `;

    invoiceWindow.document.write(invoiceContent);
    invoiceWindow.document.close();
    invoiceWindow.print();
  };

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.orderNumber).then(() => {
      alert("Order number copied to clipboard!");
    });
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-6xl text-gray-400 mb-6"></i>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Order Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The requested order could not be found.
          </p>
          <Link
            href="/"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Success Icon and Message */}
        <div className="text-center mb-12">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 dark:bg-green-900 mb-6">
            <i className="fas fa-check text-4xl text-green-600 dark:text-green-400"></i>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Payment Successful!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            Thank you for your order
          </p>
          <div className="flex items-center justify-center space-x-2">
            <p className="text-gray-500 dark:text-gray-500">
              Order #{order.orderNumber}
            </p>
            <button
              onClick={copyOrderNumber}
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              <i className="fas fa-copy"></i>
            </button>
          </div>
        </div>

        {/* Order Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Order Details
          </h2>

          {/* Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Order Information
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-600 dark:text-gray-400">
                    Order Number:
                  </span>{" "}
                  {order.orderNumber}
                </p>
                <p>
                  <span className="text-gray-600 dark:text-gray-400">
                    Order Date:
                  </span>{" "}
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
                <p>
                  <span className="text-gray-600 dark:text-gray-400">
                    Payment Method:
                  </span>{" "}
                  {order.paymentMethod}
                </p>
                <p>
                  <span className="text-gray-600 dark:text-gray-400">
                    Status:
                  </span>{" "}
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs">
                    {order.status}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Delivery Address
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="font-medium text-gray-900 dark:text-white">
                  {order.deliveryAddress.name}
                </p>
                <p>{order.deliveryAddress.address}</p>
                <p>
                  {order.deliveryAddress.city}{" "}
                  {order.deliveryAddress.postalCode}
                </p>
                <p>Phone: {order.deliveryAddress.phone}</p>
                {order.deliveryAddress.instructions && (
                  <p className="mt-2 italic">
                    Instructions: {order.deliveryAddress.instructions}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Order Items
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Product
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Farmer
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Quantity
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Unit Price
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 dark:border-gray-700"
                    >
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {item.productName}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                        {item.farmerName}
                      </td>
                      <td className="py-4 px-4 text-center text-gray-600 dark:text-gray-400">
                        {item.quantity}
                      </td>
                      <td className="py-4 px-4 text-right text-gray-600 dark:text-gray-400">
                        {formatPrice(item.price)}
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-gray-900 dark:text-white">
                        {formatPrice(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Payment Summary
            </h3>
            <div className="space-y-2 max-w-sm ml-auto">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Subtotal:
                </span>
                <span className="text-gray-900 dark:text-white">
                  {formatPrice(order.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Delivery Fee:
                </span>
                <span className="text-gray-900 dark:text-white">
                  {formatPrice(order.deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Service Fee:
                </span>
                <span className="text-gray-900 dark:text-white">
                  {formatPrice(order.serviceFee)}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Email Confirmation Notice */}
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-8">
          <div className="flex items-center">
            <i className="fas fa-envelope text-blue-600 dark:text-blue-400 mr-3"></i>
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Email Confirmation Sent
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                We've sent your order confirmation and receipt to your email
                address.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={downloadInvoice}
            className="flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition"
          >
            <i className="fas fa-download mr-2"></i>
            Download Invoice
          </button>

          <Link
            href="/bookings"
            className="flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition"
          >
            <i className="fas fa-list mr-2"></i>
            View All Orders
          </Link>

          <Link
            href="/products"
            className="flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition"
          >
            <i className="fas fa-shopping-bag mr-2"></i>
            Continue Shopping
          </Link>

          <Link
            href="/"
            className="flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition"
          >
            <i className="fas fa-home mr-2"></i>
            Back to Home
          </Link>
        </div>

        {/* What's Next Section */}
        <div className="mt-12 bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            What happens next?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Order Confirmation
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Farmers will confirm your order within 2 hours
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Preparation
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Fresh products will be prepared for delivery
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Delivery
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your order will be delivered within 24 hours
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
