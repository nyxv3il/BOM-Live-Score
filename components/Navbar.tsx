"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="nav-shell">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="brand flex items-center">
          <Image
            src="/livescore.png"
            alt="logo"
            width={32}
            height={32}
            className="mr-2"
          />
          BOM<span className="text-[color:var(--text)]">LiveScore</span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <Link href="/" className="nav-link">
            Home
          </Link>
          <Link href="/summary" className="nav-link">
            Summary
          </Link>
          <Link href="/credits" className="nav-link">
            Credits
          </Link>
          <Link href="/admin/dashboard" className="nav-link">
            Admin
          </Link>
        </div>
        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-[color:var(--text)] focus:outline-none"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              )}
            </svg>
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="flex flex-col gap-4 px-6 pb-4">
            <Link href="/" className="nav-link">
              Home
            </Link>
            <Link href="/summary" className="nav-link">
              Summary
            </Link>
            <Link href="/credits" className="nav-link">
              Credits
            </Link>
            <Link href="/admin/dashboard" className="nav-link">
              Admin
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
