"use client";

import Image from "next/image";
import styles from "./AboutSection.module.css";


export default function AboutSection(){

return(

<section className={styles.section}>

<div className={styles.container}>

{/* IMAGE */}

<div className={styles.imageBox}>

<Image
src="/logo/logo.jpeg"
alt="Farmer Agriculture"
width={500}
height={350}
className={styles.image}
/>

</div>


{/* CONTENT */}

<div className={styles.content}>

<h1 className={styles.heading}>

Welcome to Pasumai Uzhavan

</h1>

<p>

Pasumai Uzhavan is a trusted agricultural eCommerce platform dedicated to supporting farmers with high-quality farming products. We provide a wide range of fertilizers, pesticides, herbicides, fungicides, growth boosters, soil conditioners, and organic products to improve crop health and increase productivity. Our goal is to make modern agricultural solutions easily accessible to farmers and help them achieve better yields with sustainable farming practices.

</p>

<p>

With over 1000+ agricultural products and connections to 50,000+ farmers, Pasumai Uzhavan ensures reliable service and quality assurance. Backed by 20+ years of experience and 500+ trusted brands, we aim to empower farmers with the right tools, knowledge, and products for successful farming.

</p>

</div>

</div>

</section>

);

}