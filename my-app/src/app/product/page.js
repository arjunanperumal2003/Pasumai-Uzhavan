import { Suspense } from "react";
import ProductForm from "./ProductForm";

export default function ProductListingPage() {
  return (
    <Suspense fallback={<div>Loading products...</div>}>
      <ProductForm />
    </Suspense>
  );
}