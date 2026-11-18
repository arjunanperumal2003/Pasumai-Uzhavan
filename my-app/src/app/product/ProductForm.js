
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard/ProductCard";
import styles from "./products.module.css";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export default function ProductForm() {
  const searchParams = useSearchParams();

  const brand = searchParams.get("brand");
  const type = searchParams.get("type");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE_URL}/api/products`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(
            `Failed to fetch product list: ${res.status}`
          );
        }

        const data = await res.json();

        // Handle different REST API response formats
        const safeData = Array.isArray(data)
          ? data
          : Array.isArray(data.products)
          ? data.products
          : Array.isArray(data.data)
          ? data.data
          : [];

        // Normalize database fields
        let formattedProducts = safeData
          .filter((item) => item && typeof item === "object")
          .map((item) => {
            const itemId =
              item.id ??
              item._id?.$oid ??
              item._id ??
              item.sku;

            if (itemId == null) return null;

            const discount = Number(
              item.discount ??
              item.discount_percentage ??
              item.pricing?.discount ??
              0
            );

            const sellingPrice = Number(
              item.selling_price ??
              item.sellingPrice ??
              item.special_price ??
              item.price ??
              0
            );

            return {
              ...item,

              id: String(itemId),

              name:
                item.name ??
                item.product_name ??
                "",

              brand: item.brand ?? "",
              category: item.category ?? "",

              sellingPrice,
              selling_price: sellingPrice,

              mrp: Number(item.mrp ?? 0),

              discount,
              discount_percentage: discount,

              mostSelling:
                item.most_selling === true ||
                item.mostSelling === true ||
                Number(
                  item.most_selling ??
                  item.mostSelling ??
                  0
                ) === 1,

              ratingAverage: Number(
                item.rating_average ??
                item.ratingAverage ??
                0
              ),

              stock: Number(
                item.stock ??
                item.stock_quantity ??
                item.stockQuantity ??
                0
              ),

              image:
                item.image ??
                item.image_url ??
                "/placeholder.png",
            };
          })
          .filter(Boolean);

        // Filter by brand
        if (brand) {
          const formattedBrand = brand.toLowerCase().trim();

          formattedProducts = formattedProducts.filter(
            (p) =>
              String(p.brand).toLowerCase().trim() ===
              formattedBrand
          );
        }

        // Filter by most selling
        if (type === "most-selling") {
          formattedProducts = formattedProducts.filter(
            (p) => p.mostSelling
          );
        }

        // Filter by most offer
        if (type === "most-offer") {
          formattedProducts = formattedProducts.filter(
            (p) => p.discount >= 9
          );
        }

        setProducts(formattedProducts);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("PRODUCT API ERROR:", error);
          setError(error.message);
          setProducts([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => controller.abort();
  }, [brand, type]);

  // Page title
  const getTitle = () => {
    if (brand) return `${brand} Products`;

    if (type === "most-selling") {
      return "Most Selling Products";
    }

    if (type === "most-offer") {
      return "Best Offers (9%+ Discount)";
    }

    return "All Products";
  };

  // Loading
  if (loading) {
    return (
      <h2 className={styles.loading}>
        Loading products...
      </h2>
    );
  }

  // Product listing
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        {getTitle()}
      </h1>

      {error ? (
        <p className={styles.noProducts}>
          Unable to load products: {error}
        </p>
      ) : (
        <div className={styles.grid}>
          {products.length > 0 ? (
            products.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
              />
            ))
          ) : (
            <p className={styles.noProducts}>
              No products found
            </p>
          )}
        </div>
      )}
    </div>
  );
}
