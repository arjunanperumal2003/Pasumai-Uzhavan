"use client";

import styles from "./Brands.module.css";
import BrandsDetails from "./BrandsDetails";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Brands(){

  const router = useRouter();

  return(

    <div className={styles.brand}>

      <h1>Brands</h1>

      <div className={styles.brandContainer}>

        {BrandsDetails.map((brand)=>(

          <div
            key={brand.id}
            className={styles.brandCard}

            onClick={()=>
              router.push(
                `/product?brand=${brand.name}`
              )
            }
          >

            <Image
              src={brand.logo}
              alt={brand.name}
              width={150}
              height={150}
            />

            <p>
              {brand.name}
            </p>

          </div>

        ))}

      </div>

    </div>

  );

}