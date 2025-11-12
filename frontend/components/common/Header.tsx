// components/common/Header.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui
import { motion } from "framer-motion";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800 dark:bg-black/95 dark:supports-[backdrop-filter]:bg-black/60">
      <div className="container flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Animated Logo + Title */}
        <Link href="/" className="flex items-center gap-2 group">
          {/* Logo Animation */}
          <motion.div
            initial={{ rotate: -15, opacity: 0, scale: 0.8 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 10 }}
            whileHover={{ rotate: 10, scale: 1.1 }}
          >
            <Image
              src="/log.png" // Replace with your logo path
              alt="Financial Management System"
              width={40}
              height={40}
              className="dark:invert drop-shadow-md"
            />
          </motion.div>

          {/* Animated Text */}
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            whileHover={{
              scale: 1.05,
              backgroundImage:
                "linear-gradient(to right, #3b82f6, #8b5cf6, #06b6d4)",
              backgroundClip: "text",
              color: "transparent",
            }}
            className="font-bold text-lg sm:text-xl text-black dark:text-white tracking-tight transition-all duration-300"
          >
            Financial Management System
          </motion.span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden items-center gap-6 lg:flex">
          {[
            ["Features", "/features"],
            ["Pricing", "/pricing"],
            ["About", "/about"],
            ["Contact", "/contact"],
          ].map(([label, href]) => (
            <motion.div key={href} whileHover={{ y: -2 }}>
              <Link
                href={href}
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors"
              >
                {label}
              </Link>
            </motion.div>
          ))}
        </nav>

        {/* CTA Button */}
        <div className="flex items-center gap-2">
          <Link href="/auth/login">
            <Button
              variant="ghost"
              size="sm"
              className="px-4 cursor-pointer transition-all duration-300 text-zinc-700 dark:text-zinc-300 
                         hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 
                         hover:scale-105 hover:shadow-[0_0_10px_rgba(99,102,241,0.3)]"
            >
              Login
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
