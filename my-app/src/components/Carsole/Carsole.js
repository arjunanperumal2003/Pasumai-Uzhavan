"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";
import styles from "./Carsole.module.css";

const slides = [

  {
    video: "/carsoleVideos/clip01.mp4",
    title: "High Quality Fertilizers",
    desc: "Boost crop growth with trusted plant nutrients"
  },

  {
    video: "/carsoleVideos/clip02.mp4",
    title: "Healthy Seeds for Better Yield",
    desc: "Strong seeds produce strong harvest"
  },

  {
    video: "/carsoleVideos/clip03.mp4",
    title: "Protect Crops from Pests",
    desc: "Effective pesticides for safe farming"
  },

  {
    video: "/carsoleVideos/clip04.mp4",
    title: "Improve Soil Fertility",
    desc: "Soil conditioners for better productivity"
  },

  {
    video: "/carsoleVideos/clip05.mp4",
    title: "Organic Farming Solutions",
    desc: "Eco friendly products for sustainable agriculture"
  }

];

export default function Carsole() {

  return (

    <Swiper
      modules={[Autoplay]}
      loop={true}
      autoplay={{ delay: 3500 }}
      className={styles.videoContainer}
    >

      {slides.map((item, index) => (

        <SwiperSlide key={index}>

          <video
            className={styles.videoPlayer}
            src={item.video}
            autoPlay
            muted
            loop
          />

          <div className={styles.videoText}>

            <h1 className={styles.videoTextH1}>
              {item.title}
            </h1>

            <p className={styles.videoTextP}>
              {item.desc}
            </p>

          </div>

        </SwiperSlide>

      ))}

    </Swiper>

  );

}