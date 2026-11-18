
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import styles from "./payment.module.css";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const DEFAULT_IMAGE = "/images/product-placeholder.jpg";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [paymentMethod, setPaymentMethod] =
    useState("Cash on Delivery");

  const [address, setAddress] = useState("");

  const buyNowProductId = searchParams.get("buyNow");

  const buyNowQty = Math.max(
    1,
    Math.floor(Number(searchParams.get("qty")) || 1)
  );

  // =====================================================
  // API RESPONSE HANDLER
  // =====================================================

  const getApiResponse = async (response) => {
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
  };

  // =====================================================
  // LOGIN REDIRECT
  // =====================================================

  const goToLogin = () => {
    const checkoutPath = buyNowProductId
      ? `/payment?buyNow=${encodeURIComponent(
          buyNowProductId
        )}&qty=${buyNowQty}`
      : "/payment";

    router.replace(
      `/login?redirect=${encodeURIComponent(checkoutPath)}`
    );
  };

  // =====================================================
  // PRODUCT ID HANDLER
  // =====================================================

  const getProductId = (product) => {
    if (!product || typeof product !== "object") {
      return "";
    }

    const id =
      product.id ??
      product._id ??
      product.productId ??
      product.product_id;

    if (
      id === undefined ||
      id === null ||
      String(id).trim() === "" ||
      String(id) === "undefined" ||
      String(id) === "null"
    ) {
      return "";
    }

    return String(id).trim();
  };

  // =====================================================
  // LOAD CHECKOUT
  // =====================================================

  useEffect(() => {
    let cancelled = false;

    const loadCheckout = async () => {
      try {
        setPageLoading(true);

        // 1. VERIFY LOGIN

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
          if (!cancelled) {
            toast.error("Please login to proceed");
            goToLogin();
          }
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
          if (!cancelled) {
            toast.error("Please login to proceed");
            goToLogin();
          }
          return;
        }

        const activeUser = userData.user;

        if (cancelled) return;

        setUser(activeUser);

        // 2. DEFAULT ADDRESS

        const defaultAddress = [
          activeUser.landmark,
          activeUser.district,
          activeUser.state,
          activeUser.pincode,
        ]
          .filter(Boolean)
          .join(", ");

        setAddress(defaultAddress);

        // =================================================
        // 3. BUY NOW CHECKOUT
        // =================================================

        if (buyNowProductId) {
          const response = await fetch(
            `${API_BASE_URL}/api/products/${encodeURIComponent(
              buyNowProductId
            )}`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
              },
              cache: "no-store",
            }
          );

          const responseData = await getApiResponse(response);

          if (!response.ok) {
            throw new Error(
              responseData?.message ||
                responseData?.error ||
                "Failed to load product"
            );
          }

          const product =
            responseData?.product ??
            responseData?.data?.product ??
            responseData?.data ??
            responseData?.result ??
            responseData;

          if (
            !product ||
            typeof product !== "object" ||
            Array.isArray(product)
          ) {
            throw new Error("Invalid product response");
          }

          const productId = getProductId(product);

          if (!productId) {
            throw new Error(
              "Product ID is missing from product response"
            );
          }

          const productName =
            product.name ??
            product.productName ??
            product.product_name;

          if (!productName) {
            throw new Error("Product name is missing");
          }

          const price = Number(
            product.selling_price ??
              product.sellingPrice ??
              product.special_price ??
              product.mrp ??
              product.price
          );

          if (!Number.isFinite(price) || price <= 0) {
            throw new Error("Invalid product price");
          }

          const productImage =
            product.image ??
            product.imageUrl ??
            product.image_url ??
            DEFAULT_IMAGE;

          const singleProduct = {
            id: productId,
            productId,
            name: productName,
            brand: product.brand || "Pasumai Uzhavan",
            sellingPrice: price,
            qty: buyNowQty,
            image: productImage,
          };

          if (!cancelled) {
            setCart([singleProduct]);
          }

          return;
        }

        // =================================================
        // 4. NORMAL CART CHECKOUT
        // =================================================

        const response = await fetch(
          `${API_BASE_URL}/api/cart/my`,
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
          if (!cancelled) {
            setUser(null);
            toast.error("Session expired. Please login again.");
            goToLogin();
          }
          return;
        }

        const data = await getApiResponse(response);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              data?.error ||
              "Failed to load cart"
          );
        }

        const cartArray = Array.isArray(data)
          ? data
          : data?.cart?.items ||
            data?.items ||
            data?.cart ||
            data?.data ||
            [];

        if (!Array.isArray(cartArray) || cartArray.length === 0) {
          toast.error("Cart is empty");

          if (!cancelled) {
            router.replace("/cart");
          }
          return;
        }

        const normalizedCart = cartArray.map((item) => {
          const productInfo =
            item.product &&
            typeof item.product === "object"
              ? item.product
              : {};

          const productId = getProductId({
            id:
              productInfo.id ??
              productInfo._id ??
              item.productId ??
              item.product_id,
          });

          const itemId =
            item.id ??
            item._id ??
            productId;

          const price = Number(
            item.sellingPrice ??
              item.selling_price ??
              item.price ??
              productInfo.sellingPrice ??
              productInfo.selling_price ??
              productInfo.price ??
              0
          );

          const quantity = Number(
            item.qty ?? item.quantity ?? 1
          );

          return {
            id: String(itemId),
            productId,
            name:
              item.name ??
              productInfo.name ??
              productInfo.productName ??
              "Product",
            brand:
              item.brand ??
              productInfo.brand ??
              "Pasumai Uzhavan",
            sellingPrice: price,
            qty:
              Number.isInteger(quantity) && quantity > 0
                ? quantity
                : 1,
            image:
              item.image ??
              productInfo.image ??
              DEFAULT_IMAGE,
          };
        });

        const invalidItems = normalizedCart.filter(
          (item) =>
            !item.productId ||
            !Number.isFinite(item.sellingPrice) ||
            item.sellingPrice <= 0
        );

        if (invalidItems.length > 0) {
          throw new Error(
            "Some cart products have invalid IDs or prices. Please refresh your cart."
          );
        }

        if (!cancelled) {
          setCart(normalizedCart);
        }
      } catch (error) {
        console.error("CHECKOUT LOAD ERROR:", error);

        if (!cancelled) {
          toast.error(
            error.message || "Unable to load checkout"
          );
        }
      } finally {
        if (!cancelled) {
          setPageLoading(false);
        }
      }
    };

    loadCheckout();

    return () => {
      cancelled = true;
    };
  }, [router, buyNowProductId, buyNowQty]);

  // =====================================================
  // TOTAL AMOUNT
  // =====================================================

  const totalAmount = cart.reduce((sum, item) => {
    return (
      sum +
      (Number(item.sellingPrice) || 0) *
        (Number(item.qty) || 1)
    );
  }, 0);

  // =====================================================
  // PLACE ORDER
  // =====================================================

  const handlePlaceOrder = async () => {
    if (loading) return;

    if (!user?.id) {
      toast.error("Please login first");
      goToLogin();
      return;
    }

    if (!address.trim()) {
      toast.error("Please enter delivery address");
      return;
    }

    if (cart.length === 0) {
      toast.error("No products to order");
      return;
    }

    const invalidItem = cart.find(
      (item) =>
        !item.productId ||
        !Number.isInteger(Number(item.qty)) ||
        Number(item.qty) < 1 ||
        !Number.isFinite(Number(item.sellingPrice)) ||
        Number(item.sellingPrice) <= 0
    );

    if (invalidItem) {
      toast.error(
        "Invalid product information. Please reload checkout."
      );
      return;
    }

    try {
      setLoading(true);

      const orderPayload = {
        userId: String(user.id),
        totalAmount: Number(totalAmount.toFixed(2)),
        paymentMethod,
        address: address.trim(),

        items: cart.map((item) => ({
          productId: String(item.productId),
          name: item.name,
          qty: Number(item.qty),
          sellingPrice: Number(item.sellingPrice),
          image: item.image || "",
        })),
      };

      console.log("ORDER PAYLOAD:", orderPayload);

      // 1. CREATE ORDER

      const response = await fetch(
        `${API_BASE_URL}/api/orders`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(orderPayload),
        }
      );

      // HANDLE EXPIRED SESSION

      if (response.status === 401) {
        setUser(null);
        toast.error("Session expired. Please login again.");
        goToLogin();
        return;
      }

      const data = await getApiResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Order failed"
        );
      }

      // 2. ORDER SUCCESS

      toast.success("Order placed successfully!");

      // 3. CLEAR CART FOR NORMAL CHECKOUT ONLY

      if (!buyNowProductId) {
        try {
          const clearCartResponse = await fetch(
            `${API_BASE_URL}/api/cart/my`,
            {
              method: "DELETE",
              credentials: "include",
              headers: {
                Accept: "application/json",
              },
            }
          );

          if (clearCartResponse.status === 401) {
            console.error(
              "Session expired while clearing cart."
            );
          } else if (!clearCartResponse.ok) {
            console.error(
              "Cart clear failed:",
              await clearCartResponse.text()
            );
          }
        } catch (cartError) {
          console.error("CLEAR CART ERROR:", cartError);
        }
      }

      // 4. UPDATE NAVBAR COUNTS

      window.dispatchEvent(new Event("cartUpdated"));
      window.dispatchEvent(new Event("ordersUpdated"));

      // 5. REDIRECT TO ORDERS

      router.push("/orders");
    } catch (error) {
      console.error("PLACE ORDER ERROR:", error);

      toast.error(
        error.message || "Could not place order"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (pageLoading) {
    return (
      <div className={styles.loadingContainer}>
        <h2 className={styles.loadingTitle}>
          Loading checkout...
        </h2>
      </div>
    );
  }

  // =====================================================
  // LOGIN REQUIRED / INVALID SESSION
  // =====================================================

  if (!user?.id) {
    return (
      <div className={styles.loadingContainer}>
        <h2>Please login to continue checkout.</h2>

        <button
          type="button"
          onClick={goToLogin}
        >
          Go to Login
        </button>
      </div>
    );
  }

  // =====================================================
  // PAYMENT PAGE UI
  // =====================================================

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Checkout & Payment 🚜
        </h1>

        <p className={styles.subtitle}>
          {buyNowProductId
            ? "Direct Purchase / Express Checkout"
            : "Cart Checkout Items"}
        </p>
      </div>

      {/* ORDER ITEMS */}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          Order Items ({cart.length})
        </h3>

        <div className={styles.itemList}>
          {cart.map((item, index) => {
            const price = Number(item.sellingPrice) || 0;
            const qty = Number(item.qty) || 1;

            const imageUrl =
              item.image?.startsWith("http") ||
              item.image?.startsWith("/")
                ? item.image
                : item.image
                ? `${API_BASE_URL}/${item.image}`
                : DEFAULT_IMAGE;

            return (
              <div
                key={item.id || item.productId || index}
                className={styles.itemCard}
              >
                <div className={styles.itemLeft}>
                  <div className={styles.imageWrapper}>
                    <Image
                      src={imageUrl}
                      alt={item.name || "Product"}
                      fill
                      sizes="80px"
                      unoptimized
                      style={{ objectFit: "cover" }}
                    />
                  </div>

                  <div>
                    <span className={styles.itemBrand}>
                      {item.brand || "Pasumai Uzhavan"}
                    </span>

                    <strong className={styles.itemName}>
                      {item.name}
                    </strong>

                    <span className={styles.itemQty}>
                      Qty: <strong>{qty}</strong> × ₹
                      {price.toFixed(2)}
                    </span>
                  </div>
                </div>

                <strong className={styles.itemPrice}>
                  ₹{(price * qty).toFixed(2)}
                </strong>
              </div>
            );
          })}
        </div>
      </div>

      {/* DELIVERY ADDRESS */}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          1. Delivery Address
        </h3>

        <textarea
          rows={3}
          className={styles.textarea}
          placeholder="Enter full delivery address (House No, Street, Landmark, City, Pincode)"
          value={address}
          onChange={(event) =>
            setAddress(event.target.value)
          }
        />
      </div>

      {/* PAYMENT METHOD */}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          2. Payment Method
        </h3>

        <div className={styles.paymentOptions}>
          <label
            className={styles.paymentLabel}
            style={{
              border: "1px solid #2e7d32",
            }}
          >
            <input
              type="radio"
              name="payment"
              value="Cash on Delivery"
              checked={paymentMethod === "Cash on Delivery"}
              onChange={(event) =>
                setPaymentMethod(event.target.value)
              }
            />

            <span className={styles.paymentText}>
              Cash on Delivery (COD)
            </span>
          </label>

          <label
            className={styles.paymentLabel}
            style={{
              border: "1px solid #ddd",
              opacity: 0.55,
              cursor: "not-allowed",
            }}
          >
            <input
              type="radio"
              name="payment"
              value="UPI / Online"
              disabled
            />

            <span className={styles.paymentText}>
              UPI / Online Payment (Coming Soon)
            </span>
          </label>
        </div>
      </div>

      {/* TOTAL AND PLACE ORDER */}

      <div className={styles.footer}>
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>
            Total Amount
          </span>

          <span className={styles.totalValue}>
            ₹{totalAmount.toFixed(2)}
          </span>
        </div>

        <button
          type="button"
          disabled={loading || cart.length === 0}
          onClick={handlePlaceOrder}
          className={styles.placeOrderButton}
          style={{
            backgroundColor:
              loading || cart.length === 0
                ? "#9e9e9e"
                : "#2e7d32",
            cursor:
              loading || cart.length === 0
                ? "not-allowed"
                : "pointer",
          }}
        >
          {loading
            ? "Placing Order..."
            : "Confirm & Place Order"}
        </button>
      </div>
    </div>
  );
}
