"use client";

import React from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from "react-responsive-carousel";
import Image from "next/image";

const heroImages = [
  { imageurl: "/assets/images/hero-1.svg", alt: "smartwatch" },
  { imageurl: "/assets/images/hero-2.svg", alt: "bag" },
  { imageurl: "/assets/images/hero-3.svg", alt: "lamp" },
  { imageurl: "/assets/images/hero-4.svg", alt: "air fryer" },
  { imageurl: "/assets/images/hero-5.svg", alt: "chair" },
];
const HeroCarousel = () => {
  return (
    <div className="hero-carousel">
      <Carousel
        showThumbs={false}
        autoPlay
        infiniteLoop
        interval={2000}
        showArrows={false}
        showStatus={false}
      >
        {heroImages.map((image) => (
          <Image
            src={image.imageurl}
            alt={image.alt}
            width={484}
            height={484}
            className="object-centain"
            key={image.alt}
          />
        ))}
      </Carousel>

      <Image
      src={"assets/icons/hand-drawn-arrow.svg"}
      alt="arraw"
      width={175}
      height={175}
      className="max-xl:hidden absolute -left-[15%] bottom-0 z-0"
      />
    </div>
  );
};

export default HeroCarousel;
