// app/page.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { useState } from "react";

export default function Home() {
  const [openModal, setOpenModal] = useState<string | null>(null);

  const closeModal = () => setOpenModal(null);

  const modals = {
    growth: {
      title: "Growth Analyzer",
      description:
        "Dive deep into your business performance with our AI-driven Growth Analyzer. Track key metrics like revenue trends, customer acquisition costs, and churn rates in real-time. Predictive analytics help forecast future growth, while customizable dashboards let you visualize data your way.",
      features: [
        "AI-Powered Insights",
        "Predictive Forecasting",
        "Custom Dashboards",
        "Real-Time Alerts",
      ],
      image: "/images/growth-analyzer.png",
    },
    budget: {
      title: "Budget Allocator",
      description:
        "Effortlessly manage your finances with the Budget Allocator. Automate allocation across departments, track variances against actual spend, and get instant notifications for overages. Integrate with your accounting software for seamless reconciliation.",
      features: [
        "Automated Allocations",
        "Variance Tracking",
        "Departmental Budgets",
        "Integration Ready",
      ],
      image: "/images/budget-allocator.png",
    },
    secure: {
      title: "Secure Investments",
      description:
        "Protect and grow your portfolio with enterprise-grade security. Our Secure Investments module offers end-to-end encryption, multi-factor authentication, and compliance reporting for global standards like GDPR and SOX. Monitor investments with advanced risk assessment tools.",
      features: [
        "End-to-End Encryption",
        "MFA Protection",
        "Compliance Reporting",
        "Risk Analytics",
      ],
      image: "/images/secure-investments.png",
    },
  };

  const renderModal = (type: string) => {
    const modal = modals[type as keyof typeof modals];
    if (!modal) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={closeModal}
      >
        <div
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-zinc-800"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            onClick={closeModal}
          >
            ×
          </button>

          <div className="text-center">
            <Image
              src={modal.image}
              alt={modal.title}
              width={400}
              height={250}
              className="mx-auto mb-4 rounded-lg object-cover"
            />
            <h2 className="mb-4 text-2xl font-bold text-black dark:text-white">
              {modal.title}
            </h2>
            <p className="mb-6 text-lg text-zinc-600 dark:text-zinc-300">
              {modal.description}
            </p>
            <ul className="mb-6 space-y-2 text-left">
              {modal.features.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300"
                >
                  <span className="text-green-500">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <Button onClick={closeModal} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      <Header />

      <main className="flex-1">
        {/* 🌐 Hero Section with 3D Background */}
        <section className="relative flex min-h-[60vh] md:min-h-[70vh] items-center justify-center overflow-hidden">
          {/* 3D Background */}
          <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 0, 4] }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[2, 2, 2]} />
              <Sphere args={[1.2, 64, 64]} scale={2.5}>
                <MeshDistortMaterial
                  color="#3b82f6"
                  attach="material"
                  distort={0.4}
                  speed={1.5}
                  roughness={0.2}
                />
              </Sphere>
              <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />
            </Canvas>
          </div>

          {/* Overlay content */}
          <div className="relative z-10 container mx-auto px-4 py-12 text-center text-white">
            <h1 className="mb-4 max-w-4xl text-4xl md:text-6xl font-bold leading-tight">
              Secure Financial Management System
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg md:text-xl text-zinc-200">
              Streamline revenue tracking, expense approvals, and reporting with
              role-based hierarchy. Empower your team with real-time dashboards
              and compliance-ready workflows.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/login">
                <Button size="lg" className="px-8 py-4 text-lg">
                  Get Started - Login
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* 🔹 Features Section */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="mb-12 text-center text-3xl md:text-4xl font-bold text-black dark:text-white">
            Key Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-10">
            {Object.entries(modals).map(([key, modal]) => (
              <div
                key={key}
                className="relative group cursor-pointer rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                onClick={() => setOpenModal(key)}
              >
                <Image
                  src={modal.image}
                  alt={modal.title}
                  width={400}
                  height={260}
                  className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </section>

        {/* 👥 Team Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center">
            <h2 className="mb-6 text-3xl md:text-4xl font-bold text-black dark:text-white">
              Meet Our Team
            </h2>
            <div className="mb-6 aspect-[2/1] sm:aspect-video max-w-full mx-auto rounded-xl shadow-lg overflow-hidden">
              <Image
                src="/images/team-photo.png"
                alt="Our diverse team"
                fill
                className="object-cover"
              />
            </div>
            <p className="max-w-2xl mx-auto text-lg text-zinc-600 dark:text-zinc-400">
              A global team of finance experts driving innovation in financial
              management.
            </p>
          </div>
        </section>
      </main>

      <Footer />
      {openModal && renderModal(openModal)}
    </div>
  );
}
