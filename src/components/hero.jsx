"use client";
import React, { useEffect } from "react";
import { useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const HeroSection = () => {
  const imageRef = useRef(null);

  useEffect(() => {
    const imageElement = imageRef.current;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const scrollThreshold = 100;

      if (scrollPosition > scrollThreshold) {
        imageElement.classList.add("scrolled");
      } else {
        imageElement.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="pt-20 md:pt-20 pb-20 bg-gradient-to-b from-[#f7fff8] to-white overflow-hidden">
      <div className="container mx-auto flex flex-col-reverse md:flex-row items-center justify-between px-6 md:px-12 lg:px-20">
        {/* Left Content */}
        <div className="w-full md:w-1/2 text-center md:text-left space-y-6">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
            AI <span className="text-green-600">Manages</span> Your Finance
          </h1>

          <p className="text-gray-600 text-lg md:text-xl max-w-md mx-auto md:mx-0">
            Let artificial intelligence take care of your financial planning and
            analysis — smart, fast, and reliable.
          </p>

          <div className="flex justify-center md:justify-start gap-4 pt-2">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="px-8 text-lg bg-green-600 hover:bg-green-700 text-white rounded-full shadow-md transition-all duration-300"
              >
                Get Started
              </Button>
            </Link>

            <Link href="https://www.youtube.com/roadsidecoder">
              <Button
                size="lg"
                variant="outline"
                className="px-8 text-lg rounded-full border-green-600 text-green-600 hover:bg-green-50 transition-all duration-300"
              >
                Watch Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Image */}
        <div className="hero-image-wrapper w-full md:w-1/2 flex justify-center md:justify-end mb-10 md:mb-0">
          <div
            ref={imageRef}
            className="hero-image relative w-[90%] max-w-[520px] aspect-square"
          >
            <Image
              src="/HeroBotLogo.png"
              alt="AI Finance Illustration"
              fill
              className="object-contain drop-shadow-xl"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );  
};

export default HeroSection;
