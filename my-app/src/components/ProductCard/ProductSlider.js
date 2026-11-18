
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
  "http://localhost:5000"
).replace(/\/+$/, "");

// GET PRODUCT ID
const getProductId = (product) => {
  const id =
    product?.id ??
    product?._id?.$oid ??
    product?._id ??
    product?.productId ??
    product?.sku;

  return id !== undefined && id !== null
    ? String(id)
    : "";
};

// GET PRODUCTS FROM DIFFERENT API RESPONSE FORMATS
const extractProducts = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.products)) {
    return data.products;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.data?.products)) {
    return data.data.products;
  }

  if (Array.isArray(data?.result)) {
    return data.result;
  }

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

  // FETCH PRODUCTS
  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");
        setProducts([]);

        const apiUrl = `${API_BASE_URL}/api/products`;

        console.log("PRODUCT API URL:", apiUrl);

        const response = await fetch(apiUrl, {
          method: "GET",
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `Product API failed: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        console.log("PRODUCT API RESPONSE:", data);

        let productList = extractProducts(data).filter(
          (product) => product && typeof product === "object"
        );

        // REMOVE PRODUCTS WITHOUT ID
        productList = productList.filter((product) =>
          getProductId(product)
        );

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

        // LIMIT PRODUCTS
        setProducts(productList.slice(0, 10));

      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

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

    return () => {
      controller.abort();
    };
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
        Unable to load products. Please try again later.
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

  // UI
  return (
    <div className={styles.wrapper}>

      {/* HEADER */}
      <div className={styles.header}>

        <h2 className={styles.title}>
          {title}
        </h2>

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

      {/* PRODUCT SLIDER */}
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

        {products.map((item) => {
          const itemId = getProductId(item);

          return (
            <SwiperSlide
              key={itemId}
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
