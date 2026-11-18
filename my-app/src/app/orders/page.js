
"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./orders.module.css";
import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const DEFAULT_IMAGE = "/images/product-placeholder.jpg";

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notLoggedIn, setNotLoggedIn] = useState(false);

  const [cancellingId, setCancellingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  // =====================================================
  // API RESPONSE
  // =====================================================

  async function getApiResponse(response) {
    const contentType =
      response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return await response.json();
    }

    const responseText = await response.text();

    throw new Error(
      responseText ||
        `Unexpected server response (${response.status})`
    );
  }

  // =====================================================
  // LOGIN REDIRECT
  // =====================================================

  const goToLogin = () => {
    router.push("/login?redirect=%2Forders");
  };

  // =====================================================
  // LOAD ORDERS
  // =====================================================

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setNotLoggedIn(false);

      // VERIFY LOGIN
      const userResponse = await fetch(
        `${API_BASE_URL}/api/auth/me`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      if (userResponse.status === 401) {
        setNotLoggedIn(true);
        setOrders([]);
        return;
      }

      const userData = await getApiResponse(userResponse);

      if (!userResponse.ok) {
        throw new Error(
          userData?.message || "Unable to verify login"
        );
      }

      // STRICT AUTHENTICATION CHECK
      if (
        userData?.success !== true ||
        !userData?.user?.id
      ) {
        setNotLoggedIn(true);
        setOrders([]);
        return;
      }

      const userId = userData.user.id;

      // GET LOGGED-IN USER'S ORDERS
      const response = await fetch(
        `${API_BASE_URL}/api/orders/user/${encodeURIComponent(userId)}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        setNotLoggedIn(true);
        setOrders([]);
        return;
      }

      const data = await getApiResponse(response);

      console.log("ORDERS API RESPONSE:", data);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to load orders"
        );
      }

      const orderArray = Array.isArray(data)
        ? data
        : Array.isArray(data.orders)
        ? data.orders
        : Array.isArray(data.data)
        ? data.data
        : [];

      const normalizedOrders = orderArray.map((order) => ({
        ...order,

        id: String(order.id ?? order._id ?? ""),

        totalAmount: Number(
          order.totalAmount ??
            order.total_amount ??
            order.total ??
            0
        ),

        paymentMethod:
          order.paymentMethod ??
          order.payment_method ??
          "Not specified",

        address: order.address || "Not specified",

        status: order.status || "Placed",

        createdAt:
          order.createdAt ??
          order.created_at ??
          order.orderDate ??
          null,

        cancelReason:
          order.cancelReason ??
          order.cancel_reason ??
          "",

        items: (
          Array.isArray(order.items) ? order.items : []
        ).map((item) => ({
          ...item,

          id: item.id ?? item._id ?? null,

          productId: String(
            item.productId ??
              item.product_id ??
              ""
          ),

          name: item.name || "Product",

          qty: Number(
            item.qty ?? item.quantity ?? 1
          ),

          sellingPrice: Number(
            item.sellingPrice ??
              item.selling_price ??
              item.price ??
              0
          ),

          image:
            item.image ||
            item.productImage ||
            item.product_image ||
            "",
        })),
      }));

      setOrders(normalizedOrders);
    } catch (err) {
      console.error("FETCH ORDERS ERROR:", err);

      setError(err.message || "Unable to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
      window.dispatchEvent(new Event("ordersUpdated"));
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // =====================================================
  // CANCEL ORDER
  // =====================================================

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    const orderId = selectedOrder;

    try {
      setCancellingId(orderId);

      const response = await fetch(
        `${API_BASE_URL}/api/orders/${encodeURIComponent(orderId)}/cancel`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            reason:
              cancelReason.trim() ||
              "Cancelled by customer",
          }),
        }
      );

      if (response.status === 401) {
        setNotLoggedIn(true);
        setOrders([]);
        setSelectedOrder(null);

        toast.error("Session expired. Please login again.");
        goToLogin();
        return;
      }

      const data = await getApiResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Unable to cancel order"
        );
      }

      toast.success(
        data.message || "Order cancelled successfully"
      );

      setSelectedOrder(null);
      setCancelReason("");

      await fetchOrders();
    } catch (err) {
      console.error("CANCEL ORDER ERROR:", err);

      toast.error(
        err.message || "Order cancellation failed"
      );
    } finally {
      setCancellingId(null);
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (dateValue) => {
    if (!dateValue) return "Date unavailable";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // FORMAT PRICE
  // =====================================================

  const formatPrice = (amount) =>
    Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // =====================================================
  // IMAGE URL
  // =====================================================

  const getImageUrl = (image) => {
    if (!image) return DEFAULT_IMAGE;

    if (
      image.startsWith("https://") ||
      image.startsWith("http://") ||
      image.startsWith("/")
    ) {
      return image;
    }

    return `${API_BASE_URL}/${image.replace(/^\/+/, "")}`;
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>
          Loading your orders...
        </p>
      </div>
    );
  }

  // =====================================================
  // LOGIN REQUIRED
  // =====================================================

  if (notLoggedIn) {
    return (
      <div className={styles.loginBox}>
        <div className={styles.loginIcon}>🔐</div>

        <h2>Please Login</h2>

        <p>Please login to view your orders.</p>

        <button
          type="button"
          className={styles.loginButton}
          onClick={goToLogin}
        >
          Go to Login
        </button>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className={styles.empty}>
        <h2>Unable to load orders</h2>

        <p>{error}</p>

        <button
          type="button"
          className={styles.retryButton}
          onClick={fetchOrders}
        >
          Retry
        </button>
      </div>
    );
  }

  // =====================================================
  // ORDERS PAGE
  // =====================================================

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Orders 📦</h1>

        <button
          type="button"
          className={styles.retryButton}
          onClick={fetchOrders}
        >
          Refresh Orders
        </button>
      </div>

      {orders.length === 0 ? (
        <div className={styles.empty}>
          <h2>📦 No Orders Yet</h2>

          <p>
            Explore our products and place your first order.
          </p>

          <button
            type="button"
            className={styles.loginButton}
            onClick={() => router.push("/")}
          >
            Explore Products
          </button>
        </div>
      ) : (
        orders.map((order) => {
          const orderId = order.id;
          const total = Number(order.totalAmount || 0);
          const status = order.status || "Placed";

          const normalizedStatus = status.toLowerCase();

          const isCancelled =
            normalizedStatus === "cancelled";

          const isDelivered =
            normalizedStatus === "delivered";

          const canCancel = [
            "placed",
            "processing",
          ].includes(normalizedStatus);

          return (
            <div key={orderId} className={styles.card}>
              {/* ORDER HEADER */}

              <div className={styles.header}>
                <div>
                  <span className={styles.orderLabel}>
                    Order ID:
                  </span>

                  <b> #{orderId}</b>
                </div>

                <span className={styles.date}>
                  {formatDate(order.createdAt)}
                </span>

                <span
                  className={
                    isCancelled
                      ? styles.cancelled
                      : styles.placed
                  }
                >
                  {status}
                </span>
              </div>

              {/* PRODUCTS */}

              <div className={styles.productList}>
                {order.items.length > 0 ? (
                  order.items.map((item, index) => {
                    const quantity = Number(item.qty || 1);
                    const itemPrice = Number(
                      item.sellingPrice || 0
                    );

                    return (
                      <div
                        key={
                          item.id ??
                          `${item.productId}-${index}`
                        }
                        className={styles.product}
                      >
                        <Image
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          width={70}
                          height={70}
                          className={styles.image}
                          unoptimized
                          onError={(event) => {
                            event.currentTarget.src =
                              DEFAULT_IMAGE;
                          }}
                        />

                        <div className={styles.details}>
                          <p className={styles.itemName}>
                            {item.name}
                          </p>

                          <p className={styles.itemQty}>
                            Qty: {quantity}
                          </p>

                          {itemPrice > 0 && (
                            <>
                              <p className={styles.itemPrice}>
                                ₹{formatPrice(itemPrice)} × {quantity}
                              </p>

                              <p>
                                <strong>
                                  ₹{formatPrice(itemPrice * quantity)}
                                </strong>
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p>No product details available.</p>
                )}
              </div>

              {/* ORDER SUMMARY */}

              <div className={styles.footer}>
                <div className={styles.infoGroup}>
                  <p>
                    <b>Payment:</b> {order.paymentMethod}
                  </p>

                  <p>
                    <b>Address:</b> {order.address}
                  </p>
                </div>

                <div className={styles.total}>
                  Total:{" "}
                  <span>₹{formatPrice(total)}</span>
                </div>
              </div>

              {/* CANCELLATION REASON */}

              {isCancelled && (
                <p className={styles.reason}>
                  <b>Cancellation reason:</b>{" "}
                  {order.cancelReason || "Not specified"}
                </p>
              )}

              {/* CANCEL BUTTON */}

              {canCancel && (
                <div className={styles.cancelSection}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    disabled={cancellingId === orderId}
                    onClick={() => {
                      setSelectedOrder(orderId);
                      setCancelReason("");
                    }}
                  >
                    Cancel Order
                  </button>
                </div>
              )}

              {isDelivered && (
                <p className={styles.deliveredMessage}>
                  This order has been delivered.
                </p>
              )}
            </div>
          );
        })
      )}

      {/* CANCELLATION CONFIRMATION MODAL */}

      {selectedOrder && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Cancel Order?</h2>

            <p>
              Are you sure you want to cancel order
              {" "}#{selectedOrder}?
            </p>

            <label htmlFor="cancelReason">
              Reason for cancellation (optional)
            </label>

            <textarea
              id="cancelReason"
              value={cancelReason}
              onChange={(event) =>
                setCancelReason(event.target.value)
              }
              placeholder="Enter your reason..."
              maxLength={255}
              rows={4}
              disabled={cancellingId === selectedOrder}
            />

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.closeButton}
                disabled={cancellingId === selectedOrder}
                onClick={() => {
                  setSelectedOrder(null);
                  setCancelReason("");
                }}
              >
                Keep Order
              </button>

              <button
                type="button"
                className={styles.confirmCancelButton}
                disabled={cancellingId === selectedOrder}
                onClick={handleCancelOrder}
              >
                {cancellingId === selectedOrder
                  ? "Cancelling..."
                  : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
