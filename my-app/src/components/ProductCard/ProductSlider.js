
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

import ProductCard from "./ProductCard";
import styles from "./ProductSlider.module.css";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ProductSlider({
  title = "Products",
  type = "all",
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const swiperRef = useRef(null);
  const router = useRouter();

  /* =========================
     FETCH PRODUCTS
  ========================= */

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      try {
        setLoading(true);
        setError(false);

        const res = await fetch(
          `${API_BASE_URL}/api/products`,
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!res.ok) {
          throw new Error(
            `Failed to fetch products: ${res.status}`
          );
        }

        const data = await res.json();

        let safeData = Array.isArray(data)
          ? data.filter(Boolean)
          : Array.isArray(data?.products)
          ? data.products.filter(Boolean)
          : [];

        /* =========================
           MOST SELLING
        ========================= */

        if (type === "most-selling") {
          safeData = safeData.filter((product) => {
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

        /* =========================
           MOST OFFER
           DISCOUNT >= 9%
        ========================= */

        if (type === "most-offer") {
          safeData = safeData.filter((product) => {
            const discount =
              product.discount ??
              product.pricing?.discount ??
              0;

            return Number(discount) >= 9;
          });
        }

        /* =========================
           REMOVE INVALID PRODUCTS
        ========================= */

        safeData = safeData.filter((product) => {
          const id =
            product.id ??
            product._id?.$oid ??
            product._id ??
            product.sku;

          return id !== undefined && id !== null;
        });

        /* =========================
           LIMIT PRODUCTS
        ========================= */

        setProducts(safeData.slice(0, 10));

      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(
            "PRODUCT SLIDER FETCH ERROR:",
            error
          );

          setProducts([]);
          setError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      controller.abort();
    };
  }, [type]);

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <h2 className={styles.loading}>
        Loading products...
      </h2>
    );
  }

  /* =========================
     ERROR
  ========================= */

  if (error) {
    return (
      <h2 className={styles.loading}>
        Unable to load products
      </h2>
    );
  }

  /* =========================
     EMPTY PRODUCTS
  ========================= */

  if (!products.length) {
    return (
      <h2 className={styles.loading}>
        No products found
      </h2>
    );
  }

  /* =========================
     UI
  ========================= */

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

          <span
            className={styles.viewAll}
            onClick={() =>
              router.push(`/product?type=${encodeURIComponent(type)}`)
            }
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                router.push(
                  `/product?type=${encodeURIComponent(type)}`
                );
              }
            }}
          >
            View All →
          </span>

        </div>
      </div>

      {/* SWIPER */}

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
          const itemId = String(
            item.id ??
            item._id?.$oid ??
            item._id ??
            item.sku
          );

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
