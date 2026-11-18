import "./globals.css";

import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

import { Toaster } from "react-hot-toast";

export const metadata = {
title: "Pasumai Uzhavan",
description: "Agri ecommerce"
};

export default function RootLayout({ children }) {

return(

<html lang="en">

<body suppressHydrationWarning>

{/* common navbar */}

<Navbar />

{children}

<Footer />


{/* TOAST CONTAINER */}

<Toaster

position="top-right"

toastOptions={{

duration:2000,

style:{

background:"#1f2937",

color:"#fff"

}

}}

/>

</body>

</html>

);

}