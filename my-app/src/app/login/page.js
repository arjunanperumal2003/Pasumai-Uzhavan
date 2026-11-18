
import { Suspense } from "react";
import LoginForm from "./LoginForm";
import styles from "./login.module.css";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <div className={styles.card}>
            Loading login...
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
