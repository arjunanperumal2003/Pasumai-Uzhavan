
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./wishlist.module.css";
import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function WishlistPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // LOGIN REDIRECT
  // =========================================================

  const goToLogin = () => {
    router.push("/login?redirect=%2Fwishlist");
  };

  // =========================================================
  // LOAD USER + WISHLIST
  // =========================================================

  useEffect(() => {
    let isMounted = true;

    const loadWishlist = async () => {
      try {
        // GET CURRENT USER
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

        if (!userResponse.ok) {
          if (isMounted) {
            setUser(null);
            setWishlist([]);
          }
          return;
        }

        const currentUser = await userResponse.json();

        // STRICT AUTHENTICATION CHECK
        if (
          currentUser?.success !== true ||
          !currentUser?.user?.id
        ) {
          if (isMounted) {
            setUser(null);
            setWishlist([]);
          }
          return;
        }

        if (isMounted) {
          setUser(currentUser.user);
        }

        // GET LOGGED-IN USER'S WISHLIST
        const wishlistResponse = await fetch(
          `${API_BASE_URL}/api/wishlist/my`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        // SESSION EXPIRED
        if (wishlistResponse.status === 401) {
          if (isMounted) {
            setUser(null);
            setWishlist([]);
          }
          return;
        }

        if (!wishlistResponse.ok) {
          throw new Error(
            `Wishlist API error: ${wishlistResponse.status}`
          );
        }

        const data = await wishlistResponse.json();

        if (isMounted) {
          setWishlist(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Wishlist loading error:", error);

        if (isMounted) {
          toast.error("Unable to load wishlist");
          setWishlist([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadWishlist();

    return () => {
      isMounted = false;
    };
  }, []);

  // =========================================================
  // REMOVE WISHLIST ITEM
  // =========================================================

  const removeItem = async (wishlistId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/wishlist/${wishlistId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (response.status === 401) {
        setUser(null);
        setWishlist([]);

        toast.error("Session expired. Please login again.");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.message ||
          "Failed to remove wishlist item"
        );
      }

      setWishlist((previous) =>
        previous.filter(
          (item) => String(item.id) !== String(wishlistId)
        )
      );

      window.dispatchEvent(new Event("wishlistUpdated"));

      toast.success("Item removed from wishlist ❤️");
    } catch (error) {
      console.error("Remove wishlist error:", error);

      toast.error(
        error.message || "Failed to remove item"
      );
    }
  };

  // =========================================================
  // MOVE TO CART
  // =========================================================

  const moveToCart = async (item) => {
    if (!user?.id) {
      toast.error("Please login first");
      goToLogin();
      return;
    }

    try {
      const productId = item.productId;

      if (!productId) {
        toast.error("Product ID is missing");
        return;
      }

      // ADD PRODUCT TO CART
      const cartResponse = await fetch(
        `${API_BASE_URL}/api/cart`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            productId: String(productId),
            name: item.name,
            brand: item.brand || "Pasumai Uzhavan",
            sellingPrice: Number(item.sellingPrice || 0),
            image: item.image || "",
            qty: 1,
          }),
        }
      );

      if (cartResponse.status === 401) {
        setUser(null);
        setWishlist([]);

        toast.error("Session expired. Please login again.");
        goToLogin();
        return;
      }

      if (!cartResponse.ok) {
        const errorText = await cartResponse.text();
        console.error("Cart API error:", errorText);

        throw new Error("Failed to add item to cart");
      }

      const cartData = await cartResponse.json();

      console.log("Added to cart:", cartData);

      // REMOVE ITEM FROM WISHLIST
      const wishlistResponse = await fetch(
        `${API_BASE_URL}/api/wishlist/${item.id}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (wishlistResponse.status === 401) {
        setUser(null);
        setWishlist([]);

        toast.error("Session expired. Please login again.");
        goToLogin();
        return;
      }

      if (!wishlistResponse.ok) {
        const errorText = await wishlistResponse.text();
        console.error("Wishlist delete error:", errorText);

        throw new Error(
          "Added to cart, but failed to remove from wishlist"
        );
      }

      // UPDATE WISHLIST UI
      setWishlist((previous) =>
        previous.filter(
          (wishlistItem) =>
            String(wishlistItem.id) !== String(item.id)
        )
      );

      // UPDATE NAVBAR COUNTS
      window.dispatchEvent(new Event("wishlistUpdated"));
      window.dispatchEvent(new Event("cartUpdated"));

      toast.success("Moved to Cart 🛒");
    } catch (error) {
      console.error("Move to cart error:", error);

      toast.error(
        error.message || "Failed to move item to cart"
      );
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <p className={styles.loading}>
        Loading wishlist...
      </p>
    );
  }

  // =========================================================
  // LOGIN REQUIRED
  // =========================================================

  if (!user?.id) {
    return (
      <div className={styles.loginBox}>
        <h2>🔐 Authentication Required</h2>

        <p>Please login to view your wishlist.</p>

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

  // =========================================================
  // EMPTY WISHLIST
  // =========================================================

  if (wishlist.length === 0) {
    return (
      <div className={styles.empty}>
        <h2>❤️ Wishlist Empty</h2>

        <p>
          Save products you like to view them later.
        </p>
      </div>
    );
  }

  // =========================================================
  // DISPLAY WISHLIST
  // =========================================================

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>
        My Wishlist ❤️
      </h1>

      <div className={styles.grid}>
        {wishlist.map((item) => {
          const price = Number(item.sellingPrice || 0);

          const imageUrl = item.image
            ? item.image.startsWith("http")
              ? item.image
              : `${API_BASE_URL}${
                  item.image.startsWith("/") ? "" : "/"
                }${item.image}`
            : "/uploads/default.png";

          return (
            <div
              key={item.id}
              className={styles.card}
            >
              <Image
                src={imageUrl}
                alt={item.name || "Product"}
                width={200}
                height={200}
                className={styles.image}
              />

              <h3 className={styles.name}>
                {item.name}
              </h3>

              <p className={styles.brand}>
                {item.brand || "Pasumai Uzhavan"}
              </p>

              <p className={styles.price}>
                ₹{price.toFixed(2)}
              </p>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.cartBtn}
                  onClick={() => moveToCart(item)}
                >
                  Move to Cart 🛒
                </button>

                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeItem(item.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
