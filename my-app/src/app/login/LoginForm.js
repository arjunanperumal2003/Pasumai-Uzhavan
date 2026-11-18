
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./login.module.css";
import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getSafeRedirect(value) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return "/";
  }

  try {
    const url = new URL(value, window.location.origin);

    if (url.origin !== window.location.origin) {
      return "/";
    }

    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}

async function getApiResponse(res) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const responseText = await res.text();

  console.error("NON-JSON API RESPONSE:", responseText);

  return {
    success: false,
    message: "Invalid server response.",
  };
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirect = getSafeRedirect(
    searchParams.get("redirect")
  );

  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    country: "India",
    state: "Tamil Nadu",
    district: "",
    pincode: "",
    landmark: "",
    farmSize: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!form.email.trim() || !form.password) {
      toast.error("Please enter email and password");
      return;
    }

    if (isSignup && (!form.name.trim() || !form.mobile.trim())) {
      toast.error("Fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isSignup
        ? "/api/auth/register"
        : "/api/auth/login";

      const payload = isSignup
        ? form
        : {
            email: form.email.trim(),
            password: form.password,
          };

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await getApiResponse(res);

      if (!res.ok || data?.success !== true) {
        toast.error(data?.message || "Authentication failed");
        return;
      }

      const verifyRes = await fetch(
        `${API_BASE_URL}/api/auth/me`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const verifyData = await getApiResponse(verifyRes);

      if (
        !verifyRes.ok ||
        verifyData?.success !== true ||
        !verifyData?.user?.id
      ) {
        toast.error(
          "Login succeeded, but session verification failed. Please try again."
        );
        return;
      }

      toast.success(
        isSignup ? "Signup successful" : "Login successful"
      );

      window.dispatchEvent(new Event("authUpdated"));

      router.replace(redirect);
      router.refresh();

    } catch (error) {
      console.error("AUTH ERROR:", error);
      toast.error("Unable to connect to authentication server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          {isSignup ? "Farmer Sign Up 🌱" : "Pasumai Uzhavan 🚜"}
        </h1>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <input
              className={styles.input}
              name="name"
              placeholder="Full Name *"
              value={form.name}
              onChange={handleChange}
              required
            />
          )}

          <input
            className={styles.input}
            type="email"
            name="email"
            placeholder="Email *"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            className={styles.input}
            type="password"
            name="password"
            placeholder="Password *"
            value={form.password}
            onChange={handleChange}
            required
          />

          {isSignup && (
            <>
              <input
                className={styles.input}
                name="mobile"
                placeholder="Mobile Number *"
                value={form.mobile}
                onChange={handleChange}
                required
              />

              <input
                className={styles.input}
                name="district"
                placeholder="District"
                value={form.district}
                onChange={handleChange}
              />

              <input
                className={styles.input}
                name="pincode"
                placeholder="Pincode"
                value={form.pincode}
                onChange={handleChange}
              />

              <input
                className={styles.input}
                name="landmark"
                placeholder="Near Landmark"
                value={form.landmark}
                onChange={handleChange}
              />

              <input
                className={styles.input}
                type="number"
                name="farmSize"
                placeholder="Farm Size (Acres)"
                value={form.farmSize}
                onChange={handleChange}
              />
            </>
          )}

          <button
            type="submit"
            className={styles.loginBtn}
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : isSignup
              ? "Sign Up & Continue"
              : "Login & Continue"}
          </button>
        </form>

        <p
          className={styles.switch}
          onClick={() => {
            if (!loading) {
              setIsSignup((prev) => !prev);
            }
          }}
        >
          {isSignup
            ? "Already have account? Login"
            : "New farmer? Sign up"}
        </p>
      </div>
    </div>
  );
}
