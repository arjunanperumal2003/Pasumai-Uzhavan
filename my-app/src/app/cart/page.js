
"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./cart.module.css";
import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function readResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  console.error("NON-JSON RESPONSE:", text.slice(0, 500));

  return {
    success: false,
    message: "Invalid server response",
  };
}

export default function CartPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [removingItem, setRemovingItem] = useState(null);

  // LOGIN REDIRECT
  const goToLogin = useCallback(() => {
    router.replace("/login?redirect=%2Fcart");
  }, [router]);

  // LOAD CART
  const loadCart = useCallback(async () => {
    try {
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
        setUser(null);
        setCart([]);
        return;
      }

      if (!userResponse.ok) {
        throw new Error("Unable to verify login status");
      }

      const currentUser = await readResponse(userResponse);

      // Strict authentication validation
      if (
        currentUser?.success !== true ||
        !currentUser?.user?.id
      ) {
        setUser(null);
        setCart([]);
        return;
      }

      setUser(currentUser.user);

      // FETCH USER CART
      const cartResponse = await fetch(
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

      if (cartResponse.status === 401) {
        setUser(null);
        setCart([]);
        return;
      }

      if (!cartResponse.ok) {
        const errorData = await readResponse(cartResponse);

        throw new Error(
          errorData?.message || "Unable to load cart"
        );
      }

      const data = await readResponse(cartResponse);

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : [];

      const updatedCart = items.map((item) => ({
        ...item,
        qty: Number(item.qty) > 0 ? Number(item.qty) : 1,
      }));

      setCart(updatedCart);

      console.log("CART FROM MYSQL:", updatedCart);
    } catch (error) {
      console.error("CART LOADING ERROR:", error);

      setCart([]);

      toast.error(
        error.message || "Unable to load shopping cart"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // INITIAL LOAD AND CART REFRESH
  useEffect(() => {
    loadCart();

    const handleCartUpdated = () => {
      loadCart();
    };

    window.addEventListener("cartUpdated", handleCartUpdated);

    return () => {
      window.removeEventListener(
        "cartUpdated",
        handleCartUpdated
      );
    };
  }, [loadCart]);

  // UNAUTHORIZED HANDLER
  const handleUnauthorized = () => {
    setUser(null);
    setCart([]);

    toast.error("Your session has expired. Please login again.");

    goToLogin();
  };

  // UPDATE QUANTITY
  const updateQty = async (cartItemId, newQty) => {
    const quantity = Number(newQty);

    if (!cartItemId) {
      toast.error("Cart item ID is missing");
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 5) {
      toast.error("Quantity must be between 1 and 5");
      return;
    }

    if (updatingItem !== null || removingItem !== null) return;

    try {
      setUpdatingItem(cartItemId);

      const response = await fetch(
        `${API_BASE_URL}/api/cart/${cartItemId}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            qty: quantity,
          }),
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await readResponse(response);

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message || "Failed to update quantity"
        );
      }

      setCart((previous) =>
        previous.map((item) =>
          String(item.id) === String(cartItemId)
            ? { ...item, qty: quantity }
            : item
        )
      );

      window.dispatchEvent(new Event("cartUpdated"));

      toast.success("Quantity updated");
    } catch (error) {
      console.error("QUANTITY UPDATE ERROR:", error);

      toast.error(error.message || "Failed to update quantity");
    } finally {
      setUpdatingItem(null);
    }
  };

  // REMOVE ITEM
  const removeItem = async (cartItemId) => {
    if (!cartItemId) {
      toast.error("Cart item ID is missing");
      return;
    }

    if (removingItem !== null || updatingItem !== null) return;

    try {
      setRemovingItem(cartItemId);

      const response = await fetch(
        `${API_BASE_URL}/api/cart/${cartItemId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await readResponse(response);

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message || "Failed to remove cart item"
        );
      }

      setCart((previous) =>
        previous.filter(
          (item) => String(item.id) !== String(cartItemId)
        )
      );

      window.dispatchEvent(new Event("cartUpdated"));

      toast.success("Item removed from cart");
    } catch (error) {
      console.error("REMOVE CART ERROR:", error);

      toast.error(error.message || "Failed to remove item");
    } finally {
      setRemovingItem(null);
    }
  };

  // TOTAL QUANTITY
  const totalQuantity = cart.reduce(
    (total, item) => total + Number(item.qty || 1),
    0
  );

  // TOTAL PRICE
  const totalPrice = cart.reduce(
    (total, item) =>
      total +
      Number(item.sellingPrice || 0) *
        Number(item.qty || 1),
    0
  );

  // CHECKOUT
  const handleCheckout = () => {
    if (!user) {
      goToLogin();
      return;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    router.push("/payment");
  };

  // LOADING
  if (loading) {
    return (
      <p className={styles.loading}>
        Loading cart...
      </p>
    );
  }

  // LOGIN REQUIRED
  if (!user) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div className={styles.loginIcon}>🔐</div>

          <h2>Login Required</h2>

          <p>
            Please login to view and manage your shopping cart.
          </p>

          <button
            className={styles.loginBtn}
            onClick={goToLogin}
          >
            Login to Continue
          </button>
        </div>
      </div>
    );
  }

  // EMPTY CART
  if (cart.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>🛒</div>

        <h2>Your cart is empty</h2>

        <p>Add products to start shopping.</p>

        <button
          className={styles.shopBtn}
          onClick={() => router.push("/")}
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  // CART DISPLAY
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Shopping Cart</h1>

      <div className={styles.grid}>
        <div>
          {cart.map((item) => {
            const itemPrice = Number(item.sellingPrice || 0);
            const quantity = Number(item.qty || 1);

            const imageUrl = item.image
              ? item.image.startsWith("http")
                ? item.image
                : `${API_BASE_URL}${
                    item.image.startsWith("/") ? "" : "/"
                  }${item.image}`
              : "/uploads/default.png";

            return (
              <div key={item.id} className={styles.card}>
                <div className={styles.imageBox}>
                  <Image
                    src={imageUrl}
                    alt={item.name || "Product"}
                    width={120}
                    height={120}
                    className={styles.image}
                    unoptimized
                  />
                </div>

                <div className={styles.details}>
                  <h3 className={styles.name}>{item.name}</h3>

                  <p className={styles.brand}>
                    {item.brand || "Pasumai Uzhavan"}
                  </p>

                  <div className={styles.price}>
                    ₹{itemPrice.toFixed(2)}
                  </div>

                  <div className={styles.actions}>
                    <select
                      className={styles.qty}
                      value={quantity}
                      disabled={
                        updatingItem !== null ||
                        removingItem !== null
                      }
                      onChange={(e) =>
                        updateQty(item.id, e.target.value)
                      }
                    >
                      {[1, 2, 3, 4, 5].map((number) => (
                        <option key={number} value={number}>
                          Qty {number}
                        </option>
                      ))}
                    </select>

                    <button
                      className={styles.removeBtn}
                      onClick={() => removeItem(item.id)}
                      disabled={
                        removingItem !== null ||
                        updatingItem !== null
                      }
                    >
                      {String(removingItem) === String(item.id)
                        ? "Removing..."
                        : "Remove"}
                    </button>
                  </div>
                </div>

                <div className={styles.itemTotal}>
                  ₹{(itemPrice * quantity).toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.summary}>
          <h2>Price Details</h2>

          <div className={styles.row}>
            <span>Products</span>
            <span>{cart.length}</span>
          </div>

          <div className={styles.row}>
            <span>Total Quantity</span>
            <span>{totalQuantity}</span>
          </div>

          <div className={styles.row}>
            <span>Total Price</span>
            <span>₹{totalPrice.toFixed(2)}</span>
          </div>

          <hr />

          <div className={styles.total}>
            <span>Amount Payable</span>
            <span>₹{totalPrice.toFixed(2)}</span>
          </div>

          <button
            className={styles.checkoutBtn}
            onClick={handleCheckout}
            disabled={
              updatingItem !== null ||
              removingItem !== null
            }
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
