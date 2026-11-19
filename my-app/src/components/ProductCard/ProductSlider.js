
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

import ProductCard from "./ProductCard";
import styles from "./ProductSlider.module.css";

// API CONFIGURATION
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://pasumai-uzhavan.onrender.com"
).replace(/\/+$/, "");

const PRODUCT_API_URL = `${API_BASE_URL}/api/products`;

// GET PRODUCT ID
const getProductId = (product) => {
  const id =
    product?.id ??
    product?._id?.$oid ??
    product?._id ??
    product?.productId ??
    product?.sku;

  return id !== undefined && id !== null ? String(id) : "";
};

// EXTRACT PRODUCTS
const extractProducts = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.products)) return data.data.products;
  if (Array.isArray(data?.result)) return data.result;

  return [];
};

export default function ProductSlider({
  title = "Products",
  type = "all",
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const swiperRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");
        setProducts([]);

        console.log("PRODUCT API URL:", PRODUCT_API_URL);

        const response = await fetch(PRODUCT_API_URL, {
          method: "GET",
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        });

        console.log("PRODUCT API STATUS:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `API Error ${response.status}: ${errorText}`
          );
        }

        const data = await response.json();

        console.log("PRODUCT API RESPONSE:", data);

        if (data?.success === false) {
          throw new Error(data.message || "Product API returned an error");
        }

        let productList = extractProducts(data).filter(
          (product) =>
            product &&
            typeof product === "object" &&
            getProductId(product)
        );

        console.log("TOTAL PRODUCTS:", productList.length);

        // MOST SELLING FILTER
        if (type === "most-selling") {
          productList = productList.filter((product) => {
            const value =
              product.mostSelling ??
              product.most_selling;

            return (
              value === true ||
              value === 1 ||
              value === "1" ||
              value === "true"
            );
          });
        }

        // MOST OFFER FILTER
        if (type === "most-offer") {
          productList = productList.filter((product) => {
            const discount = Number(
              product.discount ??
              product.pricing?.discount ??
              0
            );

            return discount >= 9;
          });
        }

        setProducts(productList.slice(0, 10));
      } catch (err) {
        if (err.name === "AbortError") return;

        console.error("PRODUCT SLIDER ERROR:", err);

        setProducts([]);
        setError(err.message || "Unable to load products");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => controller.abort();
  }, [type]);

  // LOADING
  if (loading) {
    return (
      <h2 className={styles.loading}>
        Loading products...
      </h2>
    );
  }

  // ERROR
  if (error) {
    return (
      <h2 className={styles.loading}>
        Unable to load products. {error}
      </h2>
    );
  }

  // EMPTY
  if (!products.length) {
    return (
      <h2 className={styles.loading}>
        No products found.
      </h2>
    );
  }

  // PRODUCT SLIDER
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.prev}
            onClick={() => swiperRef.current?.slidePrev()}
            aria-label="Previous products"
          >
            ←
          </button>

          <button
            type="button"
            className={styles.next}
            onClick={() => swiperRef.current?.slideNext()}
            aria-label="Next products"
          >
            →
          </button>

          <button
            type="button"
            className={styles.viewAll}
            onClick={() =>
              router.push(
                `/product?type=${encodeURIComponent(type)}`
              )
            }
          >
            View All →
          </button>
        </div>
      </div>

      <Swiper
        modules={[Navigation]}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        spaceBetween={18}
        slidesPerView="auto"
        navigation={false}
        className={styles.slider}
      >
        {products.map((item, index) => {
          const itemId = getProductId(item);

          return (
            <SwiperSlide
              key={itemId || index}
              className={styles.slide}
            >
              <ProductCard
                product={{
                  ...item,
                  id: itemId,
                }}
              />
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
