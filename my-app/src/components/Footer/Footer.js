"use client";

import { useRouter } from "next/navigation";
import styles from "./Footer.module.css";

export default function Footer(){

const router = useRouter();

return(

<footer className={styles.footer}>


<div className={styles.container}>


{/* BRAND */}

<div className={styles.col}>

<h2 className={styles.logo}>
🌱 Pasumai Uzhavan
</h2>

<p className={styles.text}>

Trusted agriculture eCommerce platform providing
quality fertilizers, pesticides and organic
solutions for farmers.

</p>

<p className={styles.mail}>
📧 pasumaiuzhavan@gmail.com
</p>

</div>



{/* QUICK LINKS */}

<div className={styles.col}>

<h3>Quick Links</h3>

<ul>

<li onClick={()=>router.push("/")}>
Home
</li>

<li onClick={()=>router.push("/products")}>
Products
</li>

<li onClick={()=>router.push("/cart")}>
Cart
</li>

<li onClick={()=>router.push("/orders")}>
Orders
</li>

<li onClick={()=>router.push("/contact")}>
Contact
</li>

</ul>

</div>



{/* CATEGORIES */}

<div className={styles.col}>

<h3>Categories</h3>

<ul>

<li onClick={()=>router.push("/products?category=Fertilizer")}>
Fertilizers
</li>

<li onClick={()=>router.push("/products?category=Pesticides")}>
Pesticides
</li>

<li onClick={()=>router.push("/products?category=Herbicides")}>
Herbicides
</li>

<li onClick={()=>router.push("/products?category=Organic Products")}>
Organic
</li>

</ul>

</div>



{/* SUPPORT */}

<div className={styles.col}>

<h3>Support</h3>

<ul>

<li>Delivery Info</li>

<li>Payment Options</li>

<li>Privacy Policy</li>

<li>Terms & Conditions</li>

</ul>

</div>



</div>



{/* bottom */}

<div className={styles.bottom}>

© {new Date().getFullYear()} Pasumai Uzhavan.
All rights reserved.

</div>


</footer>

);

}