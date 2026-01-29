import HeroSection from "@/components/hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { featuresData, howItWorksData, statsData, testimonialsData } from "@/data/landing";
import Image from "next/image";
import Link from "next/link";


export default function Home() {
  return (
    <div className="mt-4">
      <HeroSection />

      <section className="w-full bg-gradient-to-br from-green-50 via-white to-green-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 text-center">
            {statsData.map((stats, index) => (
              <div
                key={index}
                className="bg-white border border-green-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:bg-green-50 transition-all duration-300"
              >
                <div className="text-3xl sm:text-4xl font-semibold text-emerald-600">
                  {stats.value}
                </div>
                <div className="mt-1 text-sm text-gray-500 font-medium tracking-wide">
                  {stats.label}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 text-center text-xs text-gray-500 italic">
          Note : All these Data are Dummy and used for development purpose only
        </div>
      </section>
      {/* Here is the Features section */}
      <section className="w-full bg-gradient-to-b from-white to-green-50 py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          {/* Section Heading */}
          <h2 className="text-3xl sm:text-4xl font-semibold text-gray-800 mb-12">
            From Data to Decisions — Achieve Financial Clarity with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-500 font-bold">
              DhanAI
            </span>
            .
          </h2>

          {/* Features Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresData.map((feature, indx) => (
              <Card
                key={indx}
                className="border border-green-100 bg-white hover:bg-green-50 transition-all duration-300 shadow-sm hover:shadow-md rounded-2xl"
              >
                <CardContent className="flex flex-col items-center text-center p-8">
                  <div className="text-emerald-600 text-4xl mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* Here is the How it Works Section */}
      <section className="w-full bg-gradient-to-b from-white to-green-50 py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          {/* Section Heading */}
          <h2 className="text-3xl sm:text-4xl font-semibold text-gray-800 mb-12 relative inline-block">
            How It Works?
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"></span>
          </h2>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {howItWorksData.map((step, indx) => (
              <div
                key={indx}
                className="bg-white border border-green-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 p-8"
              >
                <div className="flex flex-col items-center">
                  <div className="text-emerald-600 text-5xl mb-4">
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/*  Last Section */}
      <section className="w-full bg-gradient-to-b from-white to-green-50 py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          {/* Section Heading */}
          <h2 className="text-3xl sm:text-4xl font-semibold text-gray-800 mb-6 relative inline-block">
            Let’s Get Started
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"></span>
          </h2>

          {/* Subtext */}
          <p className="text-gray-600 max-w-md mx-auto mb-10 text-sm sm:text-base">
            Don’t be behind — join us and be the smarter one. Step into the
            future of financial intelligence with{" "}
            <span className="font-semibold text-emerald-600">DhanAI</span>.
          </p>

          {/* CTA Button */}
          <Link href="/dashboard">
            <button className="relative px-8 py-3 bg-gradient-to-r from-emerald-600 to-green-500 text-white font-semibold rounded-full shadow-md transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:translate-y-0 active:shadow-sm">
              Start Free Trial
              <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-20"></span>
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
} 
