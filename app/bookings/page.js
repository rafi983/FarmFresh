"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import ReorderModal from "@/components/ReorderModal";
import { useReorder } from "@/hooks/useReorder";
import { useOrdersQuery, useOrdersCache } from "@/hooks/useOrdersQuery";
import FiltersBar from "@/components/bookings/FiltersBar";
import OrderCard from "@/components/bookings/OrderCard";
import StatsCards from "@/components/bookings/StatsCards";
import PaginationBar from "@/components/bookings/PaginationBar";
import InitialLoadingScreen from "@/components/bookings/InitialLoadingScreen";
import EmptyState from "@/components/bookings/EmptyState";
import dynamic from "next/dynamic";
import Toast from "@/components/Toast";
import { formatPrice } from "@/components/bookings/helpers";
import {
  ORDER_STATUSES,
  DATE_FILTERS,
  SORT_OPTIONS,
  VIEW_MODES,
} from "@/components/bookings/constants";

// Stats hook
function useOrderStats(orders) {
  return useMemo(
    () => ({
      total: orders.length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      pending: orders.filter((o) => o.status === "pending").length,
      totalSpent: orders.reduce((s, o) => s + (o.total || 0), 0),
    }),
    [orders],
  );
}

// Filtering + sorting hook
function useOrderFilters(orders) {
  const [statusFilter, setStatusFilter] = useState(ORDER_STATUSES.ALL);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState(DATE_FILTERS.ALL);
  const [sortOrder, setSortOrder] = useState(SORT_OPTIONS.NEWEST);
  const filteredOrders = useMemo(() => {
    let f = [...orders];
    if (statusFilter !== ORDER_STATUSES.ALL)
      f = f.filter((o) => o.status === statusFilter);
    if (searchTerm) {
      const st = searchTerm.toLowerCase();
      f = f.filter(
        (o) =>
          o._id?.toLowerCase().includes(st) ||
          o.items?.some(
            (i) =>
              i.productName?.toLowerCase().includes(st) ||
              i.farmerName?.toLowerCase().includes(st),
          ),
      );
    }
    if (dateFilter !== DATE_FILTERS.ALL) {
      const now = new Date();
      const cut = new Date();
      if (dateFilter === DATE_FILTERS.TODAY) cut.setHours(0, 0, 0, 0);
      if (dateFilter === DATE_FILTERS.WEEK) cut.setDate(now.getDate() - 7);
      if (dateFilter === DATE_FILTERS.MONTH) cut.setMonth(now.getMonth() - 1);
      f = f.filter((o) => new Date(o.createdAt) >= cut);
    }
    switch (sortOrder) {
      case SORT_OPTIONS.NEWEST:
        f.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case SORT_OPTIONS.OLDEST:
        f.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case SORT_OPTIONS.HIGHEST:
        f.sort((a, b) => (b.total || 0) - (a.total || 0));
        break;
      case SORT_OPTIONS.LOWEST:
        f.sort((a, b) => (a.total || 0) - (b.total || 0));
        break;
    }
    return f;
  }, [orders, statusFilter, searchTerm, dateFilter, sortOrder]);
  return {
    filteredOrders,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    dateFilter,
    setDateFilter,
    sortOrder,
    setSortOrder,
  };
}

const OrderDetailsModal = dynamic(
  () => import("@/components/bookings/OrderDetailsModal"),
  { ssr: false },
);

export default function BookingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const userId = useMemo(() => {
    const id = session?.user?.userId || session?.user?.id;
    return status === "authenticated" && id ? id : null;
  }, [session?.user?.userId, session?.user?.id, status]);
  const enabled = !!userId && status === "authenticated";

  const {
    data: ordersData,
    isLoading: loading,
    error,
    refetch: refetchOrders,
  } = useOrdersQuery(userId, {
    enabled,
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const ordersCache = useOrdersCache();
  const orders = useMemo(
    () =>
      ordersData?.orders
        ? ordersData.orders.filter((o) => (o.userId || o.customerId) === userId)
        : [],
    [ordersData, userId],
  );
  const orderStats = useOrderStats(orders);
  const {
    filteredOrders,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    dateFilter,
    setDateFilter,
    sortOrder,
    setSortOrder,
  } = useOrderFilters(orders);

  const {
    validateReorder,
    proceedWithAvailableItems,
    cancelReorder,
    showReorderModal,
    validationResult,
    loading: reorderLoading,
  } = useReorder();

  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState(VIEW_MODES.CARDS);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  // Derived pagination size per view mode
  const ordersPerPage = viewMode === VIEW_MODES.LIST ? 10 : 6;

  // Auth redirect
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated" && session?.user) {
      const role = session.user.userType || session.user.role || "customer";
      if (role === "farmer") router.push("/farmer-orders");
    }
  }, [status, session, router]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, dateFilter, sortOrder]);

  const showToast = useCallback((message, type = "info") => {
    setToast({ id: Date.now(), message, type });
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchOrders();
      if (userId) ordersCache.invalidateOrders(userId);
      showToast("Orders refreshed", "success");
    } finally {
      setRefreshing(false);
    }
  }, [refetchOrders, ordersCache, userId, showToast]);

  const handleCancelOrder = useCallback(
    async (orderId) => {
      if (!window.confirm("Cancel this order?")) return;
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: ORDER_STATUSES.CANCELLED }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Failed to cancel");
        }
        if (userId) ordersCache.invalidateOrders(userId);
        setTimeout(() => refetchOrders(), 100);
        showToast("Order cancelled", "success");
      } catch (e) {
        showToast(e.message, "error");
      }
    },
    [ordersCache, refetchOrders, userId, showToast],
  );

  const handleReorder = useCallback(
    async (order) => {
      try {
        const id = session?.user?.userId || session?.user?.id;
        if (!id) {
          showToast("Login to reorder", "warning");
          return;
        }
        await validateReorder(order._id, id);
        showToast("Validating reorder...", "info");
      } catch (e) {
        showToast("Reorder failed", "error");
      }
    },
    [session, validateReorder, showToast],
  );

  const handleDownloadReceipt = useCallback(
    async (order) => {
      try {
        const orderNumber =
          order?.orderNumber ||
          order?._id?.slice(-8)?.toUpperCase() ||
          `ORDER-${Date.now()}`;
        const { jsPDF } = await import("jspdf");
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        let y = 20;
        const money = (p) =>
          new Intl.NumberFormat("en-BD", {
            style: "currency",
            currency: "BDT",
            minimumFractionDigits: 0,
          }).format(p || 0);
        const customer = {
          name:
            order.customerName ||
            order.deliveryAddress?.name ||
            order.customerInfo?.name ||
            "Customer",
          email: order.customerEmail || order.customerInfo?.email || "N/A",
          phone:
            order.deliveryAddress?.phone || order.customerInfo?.phone || "N/A",
          address:
            order.deliveryAddress?.address ||
            order.customerInfo?.address ||
            "N/A",
          city:
            order.deliveryAddress?.city || order.customerInfo?.city || "N/A",
        };
        doc.setFontSize(22);
        doc.setTextColor(34, 197, 94);
        doc.text("🌱 FarmFresh", 20, y);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text("Payment Receipt", 20, y + 8);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, y + 14);
        doc.setFontSize(16);
        doc.text("RECEIPT", pageWidth - 20, 20, { align: "right" });
        doc.setFontSize(10);
        doc.text(`Receipt #: ${orderNumber}`, pageWidth - 20, 28, {
          align: "right",
        });
        doc.text(
          `Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString("en-GB")}`,
          pageWidth - 20,
          34,
          { align: "right" },
        );
        doc.text(
          `Time: ${new Date(order.createdAt || Date.now()).toLocaleTimeString("en-GB")}`,
          pageWidth - 20,
          40,
          { align: "right" },
        );
        y = 48;
        doc.setDrawColor(34, 197, 94);
        doc.line(20, y, pageWidth - 20, y);
        y += 8;
        doc.setFontSize(12);
        doc.text("Customer Information", 20, y);
        y += 6;
        doc.setFontSize(10);
        [
          `Name: ${customer.name}`,
          `Email: ${customer.email}`,
          `Phone: ${customer.phone}`,
          `Address: ${customer.address}`,
          `City: ${customer.city}`,
        ].forEach((line) => {
          doc.text(line, 20, y);
          y += 5;
        });
        y += 4;
        doc.setFontSize(12);
        doc.text("Order Summary", 20, y);
        y += 6;
        doc.setFontSize(10);
        doc.text(`Order ID: ${order._id}`, 20, y);
        y += 5;
        doc.text(`Status: ${order.status}`, 20, y);
        y += 5;
        doc.text(
          `Payment: ${order.paymentMethod || "Cash on Delivery"}`,
          20,
          y,
        );
        y += 8;
        doc.setFontSize(12);
        doc.text("Items", 20, y);
        y += 6;
        doc.setFontSize(9);
        let running = 0;
        order.items?.forEach((it) => {
          const lineTotal = (it.price || 0) * (it.quantity || 1);
          running += lineTotal;
          doc.text(
            `${it.productName?.slice(0, 40) || "Item"} x${it.quantity} @ ${money(it.price)} = ${money(lineTotal)}`,
            20,
            y,
            { maxWidth: pageWidth - 40 },
          );
          y += 5;
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
        });
        y += 4;
        doc.setDrawColor(200);
        doc.line(20, y, pageWidth - 20, y);
        y += 6;
        doc.setFontSize(10);
        const labelX = pageWidth - 70,
          valueX = pageWidth - 20;
        const addRow = (label, val) => {
          doc.text(label, labelX, y);
          doc.text(val, valueX, y, { align: "right" });
          y += 5;
        };
        addRow("Subtotal:", money(order.subtotal || running));
        addRow("Delivery:", money(order.deliveryFee || 0));
        addRow("Service Fee:", money(order.serviceFee || 0));
        y += 2;
        doc.setDrawColor(34, 197, 94);
        doc.line(labelX - 5, y, valueX, y);
        y += 7;
        doc.setFontSize(12);
        doc.text("TOTAL PAID", labelX, y);
        doc.text(money(order.total || running), valueX, y, { align: "right" });
        y += 10;
        doc.setFontSize(9);
        doc.setTextColor(90);
        const footerLines = doc.splitTextToSize(
          "Thank you for supporting local farmers! Keep this receipt for your records.",
          pageWidth - 40,
        );
        doc.text(footerLines, 20, y);
        y += footerLines.length * 4 + 4;
        doc.setFontSize(8);
        doc.text("Support: support@farmfresh.com", 20, y);

        doc.save(`receipt-${orderNumber}.pdf`);
        showToast("Receipt downloaded", "success");
      } catch (e) {
        showToast("Receipt generation failed", "error");
      }
    },
    [showToast],
  );

  // Pagination calculations
  const indexOfLast = currentPage * ordersPerPage;
  const indexOfFirst = indexOfLast - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  if (status === "loading" || (loading && !orders.length))
    return <InitialLoadingScreen />;
  if (error)
    return (
      <EmptyState
        type="error"
        message={error.message}
        onRetry={handleRefresh}
      />
    );
  if (!loading && orders.length === 0) return <EmptyState type="empty" />;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <header className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <nav className="flex mb-8" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm">
                <li>
                  <Link
                    href="/"
                    className="text-gray-500 hover:text-blue-600 flex items-center"
                  >
                    <i className="fas fa-home mr-1" />
                    Home
                  </Link>
                </li>
                <li>
                  <i className="fas fa-chevron-right text-gray-400 text-xs" />
                </li>
                <li className="text-gray-900 dark:text-white font-medium">
                  My Orders
                </li>
              </ol>
            </nav>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
              <div className="mb-6 lg:mb-0">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3">
                  My Orders
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Track and manage your orders • {orderStats.total} total orders
                </p>
              </div>
              <StatsCards orderStats={orderStats} formatPrice={formatPrice} />
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <FiltersBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            viewMode={viewMode}
            setViewMode={setViewMode}
            handleRefresh={handleRefresh}
            refreshing={refreshing}
          />
          <div className="space-y-6">
            {currentOrders.map((order, i) => (
              <OrderCard
                key={order._id}
                order={order}
                index={i}
                setSelectedOrder={setSelectedOrder}
                setShowOrderDetails={setShowOrderDetails}
                handleDownloadReceipt={handleDownloadReceipt}
                handleReorder={handleReorder}
                handleCancelOrder={handleCancelOrder}
              />
            ))}
          </div>
          <PaginationBar
            totalPages={totalPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            indexOfFirst={indexOfFirst}
            indexOfLast={indexOfLast}
            totalItems={filteredOrders.length}
          />
        </main>
      </div>
      {showOrderDetails && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setShowOrderDetails(false)}
          onDownloadReceipt={handleDownloadReceipt}
        />
      )}
      {showReorderModal && validationResult && (
        <ReorderModal
          isOpen={showReorderModal}
          onClose={cancelReorder}
          validationResult={validationResult}
          onProceedWithAvailable={proceedWithAvailableItems}
          loading={reorderLoading}
        />
      )}
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={4500}
        />
      )}
      <Footer />
    </>
  );
}
