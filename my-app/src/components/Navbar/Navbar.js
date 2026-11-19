
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
  faBars,
  faTimes,
  faHome,
} from "@fortawesome/free-solid-svg-icons";

import { faHeart } from "@fortawesome/free-regular-svg-icons";

import styles from "./Navbar.module.css";

// ==========================================
// API CONFIGURATION - RENDER BACKEND
// ==========================================

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://pasumai-uzhavan.onrender.com"
).replace(/\/+$/, "");

const apiUrl = (path) => `${API_BASE_URL}${path}`;

// ==========================================
// NAVBAR COMPONENT
// ==========================================

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

  const [menuOpen, setMenuOpen] = useState(false);

  // ==========================================
  // SAFE API RESPONSE
  // ==========================================

  const getResponseData = async (response) => {
    const text = await response.text();

    if (!text) return {};

    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Invalid response from server");
    }
  };

  // ==========================================
  // EXTRACT ARRAY
  // ==========================================

  const getArray = (data, keys = []) => {
    if (Array.isArray(data)) return data;

    for (const key of keys) {
      if (Array.isArray(data?.[key])) {
        return data[key];
      }
    }

    return [];
  };

  // ==========================================
  // RESET USER DATA
  // ==========================================

  const resetUserData = () => {
    setUser(null);
    setCartCount(0);
    setWishlistCount(0);
    setOrderCount(0);
  };

  // ==========================================
  // AUTHENTICATION AND USER COUNTS
  // ==========================================

  const updateUserData = useCallback(async () => {
    try {
      const authResponse = await fetch(
        apiUrl("/api/auth/me"),
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (authResponse.status === 401) {
        resetUserData();
        return;
      }

      const authData = await getResponseData(authResponse);

      const currentUser = authData?.user;

      const userId =
        currentUser?.id ??
        currentUser?._id;

      if (
        !authResponse.ok ||
        authData?.success !== true ||
        !userId
      ) {
        resetUserData();
        return;
      }

      setUser(currentUser);

      // Fetch counts independently.
      const requests = await Promise.allSettled([
        fetch(apiUrl("/api/cart/my"), {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }),

        fetch(apiUrl("/api/wishlist/my"), {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }),

        fetch(
          apiUrl(`/api/orders/user/${encodeURIComponent(userId)}`),
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
          }
        ),
      ]);

      // CART COUNT
      if (requests[0].status === "fulfilled") {
        const response = requests[0].value;

        if (response.ok) {
          const data = await getResponseData(response);

          const items = getArray(data, [
            "items",
            "cart",
          ]);

          setCartCount(items.length);
        } else {
          console.error("CART API ERROR:", response.status);
        }
      }

      // WISHLIST COUNT
      if (requests[1].status === "fulfilled") {
        const response = requests[1].value;

        if (response.ok) {
          const data = await getResponseData(response);

          const items = getArray(data, [
            "items",
            "wishlist",
          ]);

          setWishlistCount(items.length);
        } else {
          console.error("WISHLIST API ERROR:", response.status);
        }
      }

      // ORDER COUNT
      if (requests[2].status === "fulfilled") {
        const response = requests[2].value;

        if (response.ok) {
          const data = await getResponseData(response);

          const orders = getArray(data, [
            "orders",
            "items",
          ]);

          setOrderCount(
            orders.filter(
              (order) =>
                String(order.status).toLowerCase() !== "cancelled"
            ).length
          );
        } else {
          console.error("ORDERS API ERROR:", response.status);
        }
      }

      requests.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `NAVBAR COUNT REQUEST ${index + 1} ERROR:`,
            result.reason
          );
        }
      });

    } catch (error) {
      console.error("NAVBAR AUTH ERROR:", error);
      resetUserData();
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // ==========================================
  // AUTH EVENTS
  // ==========================================

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

  // ==========================================
  // PRODUCT SEARCH
  // ==========================================

  useEffect(() => {
    const query = search.trim();

    if (!query) {
      setSuggestions([]);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;

    const controller = new AbortController();

    const fetchSuggestions = async () => {
      try {
        setSearchLoading(true);

        const response = await fetch(
          apiUrl(
            `/api/products/search-fertilizers?q=${encodeURIComponent(query)}`
          ),
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Product search failed (${response.status})`
          );
        }

        const data = await getResponseData(response);

        if (!cancelled) {
          setSuggestions(
            Array.isArray(data.products)
              ? data.products
              : []
          );
        }

      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("PRODUCT SEARCH ERROR:", error);

          if (!cancelled) {
            setSuggestions([]);
          }
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [search]);

  // ==========================================
  // CLOSE MOBILE MENU
  // ==========================================

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // ==========================================
  // NAVIGATION
  // ==========================================

  const navigate = (path) => {
    closeMenu();
    setSuggestions([]);
    router.push(path);
  };

  // ==========================================
  // SELECT PRODUCT
  // ==========================================

  const selectProduct = (id) => {
    if (!id) return;

    setSearch("");
    setSuggestions([]);
    closeMenu();

    router.push(`/products/${encodeURIComponent(id)}`);
  };

  // ==========================================
  // SEARCH SUBMIT
  // ==========================================

  const handleSearch = () => {
    if (!search.trim()) return;

    if (suggestions.length > 0) {
      const firstProduct = suggestions[0];

      selectProduct(
        firstProduct.id ??
        firstProduct._id?.$oid ??
        firstProduct._id ??
        firstProduct.productId
      );
    } else {
      alert("Product not found");
    }
  };

  // ==========================================
  // PROTECTED NAVIGATION
  // ==========================================

  const handleProtectedNavigation = (path) => {
    if (authLoading) return;

    if (!user) {
      closeMenu();

      router.push(
        `/login?redirect=${encodeURIComponent(path)}`
      );

      return;
    }

    navigate(path);
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = async () => {
    if (logoutLoading) return;

    try {
      setLogoutLoading(true);

      const response = await fetch(
        apiUrl("/api/auth/logout"),
        {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await getResponseData(response);

      if (!response.ok || data?.success !== true) {
        throw new Error(
          data?.message || "Logout failed"
        );
      }

      resetUserData();
      closeMenu();

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

  // ==========================================
  // MENU ITEM
  // ==========================================

  const MenuButton = ({
    onClick,
    icon,
    children,
    count,
    title,
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={styles.menuItem}
      title={title}
    >
      <FontAwesomeIcon icon={icon} />

      <span>{children}</span>

      {count > 0 && (
        <span className={styles.badge}>
          {count}
        </span>
      )}
    </button>
  );

  // ==========================================
  // UI
  // ==========================================

  return (
    <header className={styles.container}>

      {/* TOP BAR */}

      <div className={styles.topBar}>
        <div className={styles.support}>
          📧 Support: pasumaiuzhavan@gmail.com
        </div>

        <div className={styles.topRight}>
          <span>🚚 Free Delivery</span>
          <span>🌾 Quality Products</span>

          <select
            className={styles.language}
            aria-label="Select language"
          >
            <option>English</option>
            <option>தமிழ்</option>
          </select>
        </div>
      </div>

      {/* MAIN NAVBAR */}

      <nav className={styles.navbar}>

        {/* LOGO */}

        <button
          type="button"
          className={styles.logo}
          onClick={() => navigate("/")}
        >
          🌱 Pasumai Uzhavan
        </button>

        {/* SEARCH */}

        <div className={styles.searchArea}>

          <div className={styles.searchBox}>
            <button
              type="button"
              onClick={handleSearch}
              aria-label="Search"
            >
              <FontAwesomeIcon icon={faSearch} />
            </button>

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

          {search.trim() !== "" && (
            <div className={styles.suggestionBox}>

              {searchLoading ? (
                <div className={styles.suggestionItem}>
                  Searching products...
                </div>
              ) : suggestions.length > 0 ? (

                suggestions.map((item) => {
                  const id =
                    item.id ??
                    item._id?.$oid ??
                    item._id ??
                    item.productId;

                  return (
                    <button
                      type="button"
                      key={id}
                      className={styles.suggestionItem}
                      onClick={() => selectProduct(id)}
                    >
                      {item.name}
                    </button>
                  );
                })

              ) : (
                <div className={styles.suggestionItem}>
                  No products found
                </div>
              )}

            </div>
          )}

        </div>

        {/* DESKTOP MENU */}

        <div className={styles.desktopMenu}>

          <MenuButton
            icon={faHome}
            onClick={() => navigate("/")}
          >
            Home
          </MenuButton>

          <MenuButton
            icon={faHeart}
            count={user ? wishlistCount : 0}
            onClick={() =>
              handleProtectedNavigation("/wishlist")
            }
          >
            Wishlist
          </MenuButton>

          <MenuButton
            icon={faShoppingCart}
            count={user ? cartCount : 0}
            onClick={() =>
              handleProtectedNavigation("/cart")
            }
          >
            Cart
          </MenuButton>

          <MenuButton
            icon={faClipboardList}
            count={user ? orderCount : 0}
            onClick={() =>
              handleProtectedNavigation("/orders")
            }
          >
            Orders
          </MenuButton>

          {!authLoading && (
            <>
              {!user ? (
                <MenuButton
                  icon={faUser}
                  onClick={() => navigate("/login")}
                >
                  Account
                </MenuButton>
              ) : (
                <>
                  <MenuButton
                    icon={faUser}
                    title={user.name}
                    onClick={() => navigate("/")}
                  >
                    {user.name?.split(" ")[0] || "Account"}
                  </MenuButton>

                  <MenuButton
                    icon={faRightFromBracket}
                    onClick={handleLogout}
                  >
                    {logoutLoading
                      ? "Logging out..."
                      : "Logout"}
                  </MenuButton>
                </>
              )}
            </>
          )}

        </div>

        {/* MOBILE MENU BUTTON */}

        <button
          type="button"
          className={styles.mobileToggle}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <FontAwesomeIcon
            icon={menuOpen ? faTimes : faBars}
          />
        </button>

      </nav>

      {/* MOBILE MENU */}

      <div
        className={`${styles.mobileMenu} ${
          menuOpen ? styles.mobileMenuOpen : ""
        }`}
      >

        <MenuButton
          icon={faHome}
          onClick={() => navigate("/")}
        >
          Home
        </MenuButton>

        <MenuButton
          icon={faHeart}
          count={user ? wishlistCount : 0}
          onClick={() =>
            handleProtectedNavigation("/wishlist")
          }
        >
          Wishlist
        </MenuButton>

        <MenuButton
          icon={faShoppingCart}
          count={user ? cartCount : 0}
          onClick={() =>
            handleProtectedNavigation("/cart")
          }
        >
          Cart
        </MenuButton>

        <MenuButton
          icon={faClipboardList}
          count={user ? orderCount : 0}
          onClick={() =>
            handleProtectedNavigation("/orders")
          }
        >
          Orders
        </MenuButton>

        {!authLoading && (
          <>
            {!user ? (
              <MenuButton
                icon={faUser}
                onClick={() => navigate("/login")}
              >
                Account / Login
              </MenuButton>
            ) : (
              <>
                <MenuButton
                  icon={faUser}
                  onClick={() => navigate("/")}
                >
                  {user.name || "Account"}
                </MenuButton>

                <MenuButton
                  icon={faRightFromBracket}
                  onClick={handleLogout}
                >
                  {logoutLoading
                    ? "Logging out..."
                    : "Logout"}
                </MenuButton>
              </>
            )}
          </>
        )}

        {/* MOBILE LANGUAGE */}

        <div className={styles.mobileLanguage}>
          <span>🌐 Language</span>

          <select aria-label="Select language">
            <option>English</option>
            <option>தமிழ்</option>
          </select>
        </div>

      </div>

    </header>
  );
}
