
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faSearch,
  faShoppingCart,
  faUser,
  faClipboardList,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";

import { faHeart } from "@fortawesome/free-regular-svg-icons";

import styles from "./Navbar.module.css";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Navbar() {
  const router = useRouter();

  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // EXTRACT ARRAY FROM API RESPONSE
  const getArray = (data, keys) => {
    if (Array.isArray(data)) return data;

    for (const key of keys) {
      if (Array.isArray(data?.[key])) {
        return data[key];
      }
    }

    return [];
  };

  // CHECK LOGIN AND FETCH COUNTS
  const updateUserData = useCallback(async () => {
    try {
      const authResponse = await fetch(
        `${API_BASE_URL}/api/auth/me`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const authData = await authResponse.json();

      if (
        !authResponse.ok ||
        authData.success !== true ||
        !authData.user?.id
      ) {
        setUser(null);
        setCartCount(0);
        setWishlistCount(0);
        setOrderCount(0);
        return;
      }

      const currentUser = authData.user;
      setUser(currentUser);

      const [cartResponse, wishlistResponse, ordersResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/api/cart/my`, {
            credentials: "include",
            cache: "no-store",
          }),

          fetch(`${API_BASE_URL}/api/wishlist/my`, {
            credentials: "include",
            cache: "no-store",
          }),

          fetch(
            `${API_BASE_URL}/api/orders/user/${currentUser.id}`,
            {
              credentials: "include",
              cache: "no-store",
            }
          ),
        ]);

      if (
        cartResponse.status === 401 ||
        wishlistResponse.status === 401 ||
        ordersResponse.status === 401
      ) {
        setUser(null);
        setCartCount(0);
        setWishlistCount(0);
        setOrderCount(0);
        return;
      }

      const [cartData, wishlistData, ordersData] =
        await Promise.all([
          cartResponse.json(),
          wishlistResponse.json(),
          ordersResponse.json(),
        ]);

      const cartItems = getArray(cartData, ["items", "cart"]);
      const wishlistItems = getArray(wishlistData, [
        "items",
        "wishlist",
      ]);
      const orders = getArray(ordersData, ["orders", "items"]);

      setCartCount(cartItems.length);
      setWishlistCount(wishlistItems.length);

      setOrderCount(
        orders.filter(
          (order) => order.status !== "Cancelled"
        ).length
      );
    } catch (error) {
      console.error("NAVBAR AUTH ERROR:", error);

      setUser(null);
      setCartCount(0);
      setWishlistCount(0);
      setOrderCount(0);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // INITIAL AUTH CHECK AND EVENT LISTENERS
  useEffect(() => {
    updateUserData();

    const handleUpdate = () => {
      updateUserData();
    };

    window.addEventListener("authUpdated", handleUpdate);
    window.addEventListener("cartUpdated", handleUpdate);
    window.addEventListener("wishlistUpdated", handleUpdate);
    window.addEventListener("ordersUpdated", handleUpdate);

    return () => {
      window.removeEventListener("authUpdated", handleUpdate);
      window.removeEventListener("cartUpdated", handleUpdate);
      window.removeEventListener("wishlistUpdated", handleUpdate);
      window.removeEventListener("ordersUpdated", handleUpdate);
    };
  }, [updateUserData]);

  // PRODUCT SEARCH SUGGESTIONS
  useEffect(() => {
    const query = search.trim();

    if (!query) {
      setSuggestions([]);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;

    const fetchSuggestions = async () => {
      try {
        setSearchLoading(true);

        const response = await fetch(
          `${API_BASE_URL}/api/products/search-fertilizers?q=${encodeURIComponent(
            query
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Unable to search products");
        }

        const data = await response.json();

        if (!cancelled) {
          setSuggestions(
            Array.isArray(data.products) ? data.products : []
          );
        }
      } catch (error) {
        console.error("PRODUCT SEARCH ERROR:", error);

        if (!cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [search]);

  // SELECT PRODUCT
  const selectProduct = (id) => {
    router.push(`/products/${id}`);
    setSearch("");
    setSuggestions([]);
  };

  // SEARCH SUBMIT
  const handleSearch = () => {
    if (!search.trim()) return;

    if (suggestions.length > 0) {
      selectProduct(suggestions[0].id);
    } else {
      alert("Product not found");
    }
  };

  // PROTECTED NAVIGATION
  const handleProtectedNavigation = (path) => {
    if (!user) {
      router.push(
        `/login?redirect=${encodeURIComponent(path)}`
      );
      return;
    }

    router.push(path);
  };

  // LOGOUT
  const handleLogout = async () => {
    if (logoutLoading) return;

    try {
      setLogoutLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok || data.success !== true) {
        throw new Error(data.message || "Logout failed");
      }

      setUser(null);
      setCartCount(0);
      setWishlistCount(0);
      setOrderCount(0);

      window.dispatchEvent(new Event("authUpdated"));

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("LOGOUT ERROR:", error);
      alert(error.message || "Unable to logout");
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* TOP BAR */}
      <div className={styles.topBar}>
        <div>
          📧 Support: pasumaiuzhavan@gmail.com
        </div>

        <div className={styles.topRight}>
          <span>🚚 Free Delivery</span>
          <span>🌾 Quality Products</span>

          <select>
            <option>English</option>
            <option>தமிழ்</option>
          </select>
        </div>
      </div>

      {/* NAVBAR */}
      <div className={styles.navbar}>
        {/* LOGO */}
        <div
          className={styles.logo}
          onClick={() => router.push("/")}
        >
          🌱 Pasumai Uzhavan
        </div>

        {/* SEARCH */}
        <div className={styles.searchArea}>
          <div className={styles.searchBox}>
            <FontAwesomeIcon icon={faSearch} />

            <input
              type="text"
              placeholder="Search for products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }

                if (e.key === "Escape") {
                  setSuggestions([]);
                }
              }}
            />
          </div>

          {searchLoading && (
            <div className={styles.suggestionBox}>
              <div className={styles.suggestionItem}>
                Searching products...
              </div>
            </div>
          )}

          {!searchLoading &&
            search.trim() !== "" &&
            suggestions.length > 0 && (
              <div className={styles.suggestionBox}>
                {suggestions.map((item) => (
                  <div
                    key={item.id}
                    className={styles.suggestionItem}
                    onClick={() => selectProduct(item.id)}
                  >
                    {item.name}
                  </div>
                ))}
              </div>
            )}

          {!searchLoading &&
            search.trim() !== "" &&
            suggestions.length === 0 && (
              <div className={styles.suggestionBox}>
                <div className={styles.suggestionItem}>
                  No products found
                </div>
              </div>
            )}
        </div>

        {/* MENU */}
        <div className={styles.menu}>
          <button
            onClick={() => router.push("/")}
            className={styles.menuItem}
          >
            🏠 Home
          </button>

          {/* WISHLIST */}
          <button
            onClick={() =>
              handleProtectedNavigation("/wishlist")
            }
            className={styles.menuItem}
          >
            <FontAwesomeIcon icon={faHeart} />
            Wishlist

            {user && wishlistCount > 0 && (
              <span className={styles.badge}>
                {wishlistCount}
              </span>
            )}
          </button>

          {/* CART */}
          <button
            onClick={() =>
              handleProtectedNavigation("/cart")
            }
            className={styles.menuItem}
          >
            <FontAwesomeIcon icon={faShoppingCart} />
            Cart

            {user && cartCount > 0 && (
              <span className={styles.badge}>
                {cartCount}
              </span>
            )}
          </button>

          {/* ORDERS */}
          <button
            onClick={() =>
              handleProtectedNavigation("/orders")
            }
            className={styles.menuItem}
          >
            <FontAwesomeIcon icon={faClipboardList} />
            Orders

            {user && orderCount > 0 && (
              <span className={styles.badge}>
                {orderCount}
              </span>
            )}
          </button>

          {/* ACCOUNT */}
          {!authLoading && (
            <>
              {!user ? (
                <button
                  onClick={() => router.push("/login")}
                  className={styles.menuItem}
                >
                  <FontAwesomeIcon icon={faUser} />
                  Account
                </button>
              ) : (
                <>
                  <button
                    onClick={() => router.push("/")}
                    className={styles.menuItem}
                    title={user.name}
                  >
                    <FontAwesomeIcon icon={faUser} />
                    {user.name?.split(" ")[0] || "Account"}
                  </button>

                  <button
                    onClick={handleLogout}
                    className={styles.menuItem}
                    disabled={logoutLoading}
                  >
                    <FontAwesomeIcon icon={faRightFromBracket} />
                    {logoutLoading ? "Logging out..." : "Logout"}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
