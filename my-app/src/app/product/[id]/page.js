
"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import styles from "./viewProduct.module.css";
import ProductSlider from "@/components/ProductCard/ProductSlider";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();

  const id = params?.id;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);

  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  // =====================================================
  // FETCH PRODUCT
  // =====================================================

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    const fetchProduct = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${API_BASE_URL}/api/products`,
          {
            method: "GET",
            signal: controller.signal,
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch products (${response.status})`
          );
        }

        const data = await response.json();

        const products = Array.isArray(data)
          ? data
          : Array.isArray(data.products)
          ? data.products
          : Array.isArray(data.data)
          ? data.data
          : [];

        const selectedProduct = products.find((item) => {
          const itemId =
            item.id ??
            item._id?.$oid ??
            item._id;

          return String(itemId) === String(id);
        });

        if (!selectedProduct) {
          throw new Error("Product not found");
        }

        setProduct(selectedProduct);
        setQuantity(1);
      } catch (error) {
        if (error.name === "AbortError") return;

        console.error("FETCH PRODUCT ERROR:", error);

        setProduct(null);

        toast.error(
          error.message || "Unable to load product"
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProduct();

    return () => controller.abort();
  }, [id]);

  // =====================================================
  // CHECK LOGIN
  // =====================================================

  useEffect(() => {
    let isMounted = true;

    const checkLogin = async () => {
      try {
        const response = await fetch(
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

        if (!response.ok) {
          if (isMounted) {
            setLoggedIn(false);
          }
          return;
        }

        const data = await response.json();

        if (isMounted) {
          setLoggedIn(
            data?.success === true &&
            Boolean(data?.user?.id)
          );
        }
      } catch (error) {
        console.error("LOGIN CHECK ERROR:", error);

        if (isMounted) {
          setLoggedIn(false);
        }
      } finally {
        if (isMounted) {
          setCheckingUser(false);
        }
      }
    };

    checkLogin();

    return () => {
      isMounted = false;
    };
  }, []);

  // =====================================================
  // DERIVED PRODUCT DATA
  // =====================================================

  const productId = product
    ? String(
        product.id ??
        product._id?.$oid ??
        product._id ??
        ""
      )
    : "";

  const productName = product?.name || "Product";
  const brand = product?.brand || "Pasumai Uzhavan";
  const category = product?.category || "";

  const image =
    product?.image || "/images/product-placeholder.jpg";

  const mrp = Number(product?.mrp ?? 0);

  const sellingPrice = Number(
    product?.sellingPrice ??
    product?.selling_price ??
    product?.price ??
    0
  );

  const discount = Number(
    product?.discountPercentage ??
    product?.discount ??
    0
  );

  const stock = Number(product?.stockQuantity ?? 99);

  const available =
    product?.available !== false &&
    Number.isFinite(stock) &&
    stock > 0;

  const about = product?.about || "";
  const technicalContent = product?.technicalContent || "";
  const classification = product?.classification || "";
  const description = product?.description || "";
  const applicationCrops = product?.applicationCrops || "";
  const features = product?.features || "";

  // =====================================================
  // FORMAT TEXT
  // =====================================================

  const formatText = (value) => {
    if (!value) return [];

    return String(value)
      .split(/\n|•/)
      .map((text) => text.trim())
      .filter(Boolean);
  };

  const cropList = formatText(applicationCrops);
  const featureList = formatText(features);

  // =====================================================
  // LOGIN REDIRECT
  // =====================================================

  const redirectToLogin = useCallback(
    (destination) => {
      router.push(
        `/login?redirect=${encodeURIComponent(destination)}`
      );
    },
    [router]
  );

  // =====================================================
  // ADD PRODUCT TO CART
  // =====================================================

  const addProductToCart = async () => {
    if (!productId) {
      toast.error("Product ID not found");
      return false;
    }

    if (checkingUser) {
      toast.error("Please wait, checking user session...");
      return false;
    }

    if (!loggedIn) {
      toast.error("Please login to add products to cart");

      redirectToLogin(`/product/${productId}`);
      return false;
    }

    if (!available || quantity > stock) {
      toast.error("Product is out of stock");
      return false;
    }

    if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) {
      toast.error("Invalid product price");
      return false;
    }

    const cartItem = {
      productId,
      name: productName,
      brand,
      sellingPrice,
      qty: quantity,
      image: product?.image ?? "",
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/cart`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(cartItem),
        }
      );

      const responseText = await response.text();

      let data = null;

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = null;
        }
      }

      if (response.status === 401) {
        setLoggedIn(false);

        toast.error("Session expired. Please login again.");

        redirectToLogin(`/product/${productId}`);
        return false;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          responseText ||
          `Failed to add cart item (${response.status})`
        );
      }

      window.dispatchEvent(new Event("cartUpdated"));

      return true;
    } catch (error) {
      console.error("ADD TO CART ERROR:", error);

      toast.error(
        error.message || "Could not add product to cart"
      );

      return false;
    }
  };

  const handleAddToCart = async () => {
    if (addingToCart || buyingNow) return;

    try {
      setAddingToCart(true);

      const success = await addProductToCart();

      if (success) {
        toast.success(`${productName} added to cart 🛒`);
      }
    } finally {
      setAddingToCart(false);
    }
  };

  // =====================================================
  // BUY NOW
  // =====================================================

  const handleBuyNow = () => {
    if (addingToCart || buyingNow) return;

    if (!productId) {
      toast.error("Product ID not found");
      return;
    }

    if (checkingUser) {
      toast.error("Please wait, checking user session...");
      return;
    }

    if (!available || quantity > stock) {
      toast.error("Product is out of stock");
      return;
    }

    if (!loggedIn) {
      toast.error("Please login to proceed");

      redirectToLogin(
        `/payment?buyNow=${encodeURIComponent(
          productId
        )}&qty=${quantity}`
      );

      return;
    }

    setBuyingNow(true);

    router.push(
      `/payment?buyNow=${encodeURIComponent(
        productId
      )}&qty=${quantity}`
    );
  };

  // =====================================================
  // QUANTITY
  // =====================================================

  const increaseQuantity = () => {
    if (quantity < stock) {
      setQuantity((previous) => previous + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((previous) => previous - 1);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <h2>Loading product...</h2>
      </div>
    );
  }

  // =====================================================
  // PRODUCT NOT FOUND
  // =====================================================

  if (!product) {
    return (
      <div className={styles.loadingContainer}>
        <h2>Product not found</h2>

        <button
          type="button"
          className={styles.backButton}
          onClick={() => router.back()}
        >
          ← Go Back
        </button>
      </div>
    );
  }

  // =====================================================
  // PRODUCT PAGE UI
  // =====================================================

  return (
    <main className={styles.productPage}>
      {/* BREADCRUMB */}

      <div className={styles.breadcrumb}>
        <span
          onClick={() => router.push("/")}
          style={{ cursor: "pointer" }}
        >
          Home
        </span>

        <span> / </span>

        <span
          onClick={() =>
            router.push(
              `/product?category=${encodeURIComponent(category)}`
            )
          }
          style={{ cursor: "pointer" }}
        >
          {category || "Products"}
        </span>

        <span> / </span>

        <strong>{productName}</strong>
      </div>

      {/* PRODUCT DETAILS */}

      <section className={styles.productContainer}>
        <div className={styles.imageSection}>
          <div className={styles.imageWrapper}>
            <Image
              src={image}
              alt={productName}
              width={600}
              height={600}
              className={styles.productImage}
              priority
            />
          </div>
        </div>

        <div className={styles.detailsSection}>
          <p className={styles.brand}>{brand}</p>

          <h1 className={styles.productTitle}>
            {productName}
          </h1>

          {classification && (
            <p className={styles.classification}>
              {classification}
            </p>
          )}

          {/* PRICE */}

          <div className={styles.priceSection}>
            <span className={styles.sellingPrice}>
              ₹{sellingPrice.toFixed(2)}
            </span>

            {mrp > sellingPrice && (
              <span className={styles.mrp}>
                ₹{mrp.toFixed(2)}
              </span>
            )}

            {discount > 0 && (
              <span className={styles.discount}>
                {discount}% OFF
              </span>
            )}
          </div>

          {/* STOCK */}

          <div className={styles.stockSection}>
            {available ? (
              <span className={styles.inStock}>
                ✓ In Stock
              </span>
            ) : (
              <span className={styles.outOfStock}>
                Out of Stock
              </span>
            )}
          </div>

          {/* ABOUT */}

          {about && (
            <div className={styles.aboutSection}>
              <h3>About this product</h3>
              <p>{about}</p>
            </div>
          )}

          {/* QUANTITY */}

          {available && (
            <div className={styles.quantitySection}>
              <span>Quantity:</span>

              <div className={styles.quantityControl}>
                <button
                  type="button"
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                >
                  −
                </button>

                <span>{quantity}</span>

                <button
                  type="button"
                  onClick={increaseQuantity}
                  disabled={quantity >= stock}
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}

          <div className={styles.actionButtons}>
            <button
              type="button"
              className={styles.cartButton}
              onClick={handleAddToCart}
              disabled={
                !available ||
                checkingUser ||
                addingToCart ||
                buyingNow
              }
            >
              {addingToCart
                ? "Adding..."
                : "🛒 Add to Cart"}
            </button>

            <button
              type="button"
              className={styles.buyButton}
              onClick={handleBuyNow}
              disabled={
                !available ||
                checkingUser ||
                addingToCart ||
                buyingNow
              }
            >
              {buyingNow ? "Loading..." : "Buy Now"}
            </button>
          </div>
        </div>
      </section>

      {/* PRODUCT INFORMATION */}

      <section className={styles.informationSection}>
        <h2>Product Information</h2>

        {description && (
          <div className={styles.infoBlock}>
            <h3>Description</h3>
            <p>{description}</p>
          </div>
        )}

        {technicalContent && (
          <div className={styles.infoBlock}>
            <h3>Technical Content</h3>
            <p>{technicalContent}</p>
          </div>
        )}

        {cropList.length > 0 && (
          <div className={styles.infoBlock}>
            <h3>Application / Crops</h3>

            <ul>
              {cropList.map((crop, index) => (
                <li key={index}>{crop}</li>
              ))}
            </ul>
          </div>
        )}

        {featureList.length > 0 && (
          <div className={styles.infoBlock}>
            <h3>Features</h3>

            <ul>
              {featureList.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* RELATED PRODUCTS */}

      <section className={styles.relatedProducts}>
        <ProductSlider
          title="Related Products"
          type="all"
        />
      </section>
    </main>
  );
}
