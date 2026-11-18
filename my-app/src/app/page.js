
import Carsole from "../components/Carsole/Carsole";
import Feature from "../components/Feature/Feature";
import Brands from "../components/Brands/Brands";
import AboutSection from "@/components/AboutSection/AboutSection";
import ProductSlider from "@/components/ProductCard/ProductSlider";
import Contact from "@/components/Contact/Contact";

export default function Home() {
  return (
  <div>
  
    <Carsole/>
    <Feature/>
    <AboutSection/>
    <Brands/>
         
<ProductSlider
  title="All Products"
  type="all"
/>
       <Contact/>

  </div>
   
  );
}

