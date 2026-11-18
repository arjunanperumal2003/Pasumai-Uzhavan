
import { Suspense } from "react";
import PaymentForm from "./PaymentForm";
import styles from "./payment.module.css";

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.loadingContainer}>
          <h2 className={styles.loadingTitle}>
            Loading checkout...
          </h2>
        </div>
      }
    >
      <PaymentForm />
    </Suspense>
  );
}
