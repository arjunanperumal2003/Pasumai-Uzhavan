
"use client";

import Image from "next/image";
import {
  useRouter,
  usePathname,
  useSearchParams,
} from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./ProductCard.module.css";
import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getDefaultRating = (id) => {
  const seed = String(id || "product")
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);

  return Number((4 + (seed % 11) / 10).toFixed(1));
};

export default function ProductCard({ product }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistItemId, setWishlistItemId] = useState(null);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);

  if (!product) return null;

  // PRODUCT DATA
  const productId = String(product?.id ?? product?._id ?? "");

  const name = product?.name ?? "Product";
  const brand = product?.brand ?? "Pasumai Uzhavan";
  const category = product?.category ?? "General";

  const mrp =
    Number(product?.mrp ?? product?.pricing?.mrp ?? 0) || 0;

  const price =
    Number(
      product?.sellingPrice ??
      product?.selling_price ??
      product?.pricing?.selling_price ??
      product?.price ??
      0
    ) || 0;

  const discount =
    Number(product?.discount ?? product?.pricing?.discount ?? 0) || 0;

  // RATING
  const rawRating =
    product?.ratingAverage ??
    product?.averageRating ??
    product?.average_rating ??
    product?.avgRating ??
    product?.avg_rating ??
    product?.rating?.average ??
    product?.rating ??
    null;

  const parsedRating =
    typeof rawRating === "object" && rawRating !== null
      ? Number(rawRating.average ?? rawRating.avg ?? 0)
      : Number(rawRating);

  const hasRealRating =
    rawRating !== null &&
    rawRating !== undefined &&
    Number.isFinite(parsedRating) &&
    parsedRating > 0;

  const rating = hasRealRating
    ? Math.min(5, Math.max(0, parsedRating))
    : getDefaultRating(productId);

  // IMAGE
  const rawImage =
    product?.image ??
    product?.image_url ??
    product?.imageUrl ??
    product?.thumbnail ??
    "";

  const image = rawImage
    ? rawImage.startsWith("http")
      ? rawImage
      : `${API_BASE_URL}${rawImage.startsWith("/") ? "" : "/"}${rawImage}`
    : "/uploads/default.png";

  // CURRENT URL
  const currentQuery = searchParams.toString();

  const currentPath =
    pathname + (currentQuery ? `?${currentQuery}` : "");

  // LOGIN REDIRECT
  const goToLogin = () => {
    const redirectUrl = encodeURIComponent(currentPath);
    router.push(`/login?redirect=${redirectUrl}`);
  };

  // AUTHENTICATION
  useEffect(() => {
    let active = true;

    const initializeUser = async () => {
      setCheckingUser(true);

      try {
        const authResponse = await fetch(
          `${API_BASE_URL}/api/auth/me`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!active) return;

        if (!authResponse.ok) {
          setLoggedIn(false);
          setWishlisted(false);
          setWishlistItemId(null);
          return;
        }

        const authData = await authResponse.json();

        // Require a confirmed user and valid ID.
        if (
          authData?.success !== true ||
          !authData?.user?.id
        ) {
          setLoggedIn(false);
          setWishlisted(false);
          setWishlistItemId(null);
          return;
        }

        setLoggedIn(true);

        if (!productId) return;

        // LOAD WISHLIST ONLY FOR LOGGED-IN USERS
        const wishlistResponse = await fetch(
          `${API_BASE_URL}/api/wishlist/my`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!active) return;

        if (wishlistResponse.status === 401) {
          setLoggedIn(false);
          setWishlisted(false);
          setWishlistItemId(null);
          return;
        }

        if (!wishlistResponse.ok) {
          throw new Error("Unable to load wishlist");
        }

        const wishlistData = await wishlistResponse.json();

        const items = Array.isArray(wishlistData)
          ? wishlistData
          : wishlistData.items || [];

        const existingItem = items.find(
          (item) => String(item.productId) === productId
        );

        setWishlisted(Boolean(existingItem));
        setWishlistItemId(existingItem?.id ?? null);
      } catch (error) {
        console.error("PRODUCT AUTH/WISHLIST ERROR:", error);

        if (active) {
          setLoggedIn(false);
          setWishlisted(false);
          setWishlistItemId(null);
        }
      } finally {
        if (active) {
          setCheckingUser(false);
        }
      }
    };

    initializeUser();

    return () => {
      active = false;
    };
  }, [productId]);

  // RATING STARS
  const renderStars = () => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;

    return (
      <div
        className={styles.ratingStars}
        aria-label={`${hasRealRating ? "Customer" : "Sample"} rating: ${rating.toFixed(1)} out of 5`}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          let symbol = "☆";

          if (star <= fullStars) {
            symbol = "★";
          } else if (star === fullStars + 1 && hasHalfStar) {
            symbol = "⯨";
          }

          return (
            <span key={star} className={styles.star}>
              {symbol}
            </span>
          );
        })}

        <span className={styles.ratingValue}>
          {rating.toFixed(1)}
        </span>

        {!hasRealRating && (
          <span className={styles.sampleRating}>
            Sample
          </span>
        )}
      </div>
    );
  };

  // REFRESH WISHLIST
  const refreshWishlist = async () => {
    const response = await fetch(
      `${API_BASE_URL}/api/wishlist/my`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (response.status === 401) {
      setLoggedIn(false);
      throw new Error("Please login again");
    }

    if (!response.ok) {
      throw new Error("Could not refresh wishlist");
    }

    const data = await response.json();

    const items = Array.isArray(data)
      ? data
      : data.items || [];

    const existingItem = items.find(
      (item) => String(item.productId) === productId
    );

    setWishlisted(Boolean(existingItem));
    setWishlistItemId(existingItem?.id ?? null);
  };

  // WISHLIST
  const toggleWishlist = async () => {
    if (!productId) {
      toast.error("Product ID not found");
      return;
    }

    if (checkingUser) {
      toast.error("Please wait, checking login status");
      return;
    }

    if (!loggedIn) {
      toast.error("Please login to use wishlist");
      goToLogin();
      return;
    }

    if (wishlistLoading) return;

    try {
      setWishlistLoading(true);

      if (wishlisted) {
        if (!wishlistItemId) {
          await refreshWishlist();
          toast.error("Please try again");
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/wishlist/${wishlistItemId}`,
          {
            method: "DELETE",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          }
        );

        const data = await response.json();

        if (response.status === 401) {
          setLoggedIn(false);
          toast.error("Please login first");
          goToLogin();
          return;
        }

        if (!response.ok || data?.success === false) {
          throw new Error(
            data?.message || "Failed to remove wishlist item"
          );
        }

        setWishlisted(false);
        setWishlistItemId(null);

        window.dispatchEvent(new Event("wishlistUpdated"));

        toast.success("Removed from wishlist");
      } else {
        const response = await fetch(
          `${API_BASE_URL}/api/wishlist`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              productId,
              name,
              sellingPrice: price,
              image: rawImage,
            }),
          }
        );

        const data = await response.json();

        if (response.status === 401) {
          setLoggedIn(false);
          toast.error("Please login first");
          goToLogin();
          return;
        }

        if (!response.ok || data?.success === false) {
          throw new Error(
            data?.message || "Failed to add wishlist item"
          );
        }

        await refreshWishlist();

        window.dispatchEvent(new Event("wishlistUpdated"));

        toast.success("Added to wishlist ❤️");
      }
    } catch (error) {
      console.error("WISHLIST ERROR:", error);
      toast.error(error.message || "Wishlist operation failed");
    } finally {
      setWishlistLoading(false);
    }
  };

  // ADD TO CART
  const addToCart = async () => {
    if (!productId) {
      toast.error("Product ID not found");
      return;
    }

    if (checkingUser) {
      toast.error("Please wait, checking login status");
      return;
    }

    if (!loggedIn) {
      toast.error("Please login to add products to cart");
      goToLogin();
      return;
    }

    if (addingToCart) return;

    try {
      setAddingToCart(true);

      const response = await fetch(
        `${API_BASE_URL}/api/cart`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            productId,
            name,
            brand,
            sellingPrice: price,
            qty: 1,
            image: rawImage,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        setLoggedIn(false);
        toast.error("Please login first");
        goToLogin();
        return;
      }

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message ||
          data?.error ||
          `Failed to add cart item (${response.status})`
        );
      }

      window.dispatchEvent(new Event("cartUpdated"));

      toast.success(`${name} added to cart 🛒`);
    } catch (error) {
      console.error("ADD TO CART ERROR:", error);
      toast.error(error.message || "Could not add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  // VIEW PRODUCT
  const goToView = () => {
    if (!productId) return;

    router.push(`/product/${encodeURIComponent(productId)}`);
  };

  // UI
  return (
    <div className={styles.card}>
      {discount > 0 && (
        <span className={styles.badge}>
          {discount}% OFF
        </span>
      )}

      <button
        type="button"
        className={styles.wishlist}
        onClick={toggleWishlist}
        disabled={checkingUser || wishlistLoading}
        aria-label={
          wishlisted ? "Remove from wishlist" : "Add to wishlist"
        }
        title={
          wishlisted ? "Remove from wishlist" : "Add to wishlist"
        }
      >
        {wishlistLoading
          ? "..."
          : wishlisted
            ? "❤️"
            : "🤍"}
      </button>

      <div className={styles.imageBox}>
        <Image
          src={image}
          alt={name}
          width={170}
          height={170}
          priority={false}
          unoptimized
          onError={(event) => {
            event.currentTarget.src = "/uploads/default.png";
          }}
        />
      </div>

      <div className={styles.info}>
        <h3 className={styles.name}>{name}</h3>

        <p className={styles.brand}>{brand}</p>

        <p className={styles.category}>{category}</p>

        {renderStars()}

        <div className={styles.priceBox}>
          <span className={styles.price}>
            ₹{price.toLocaleString("en-IN")}
          </span>

          {mrp > price && (
            <span className={styles.mrp}>
              ₹{mrp.toLocaleString("en-IN")}
            </span>
          )}
        </div>
      </div>

      <div className={styles.buttons}>
        <button
          type="button"
          className={styles.cartBtn}
          onClick={addToCart}
          disabled={addingToCart || checkingUser}
        >
          {addingToCart ? "Adding..." : "Add to Cart"}
        </button>

        <button
          type="button"
          className={styles.viewBtn}
          onClick={goToView}
        >
          View
        </button>
      </div>
    </div>
  );
}
