"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const storedTheme = window.localStorage.getItem("theme");
    if (storedTheme) {
      return storedTheme === "dark";
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDarkMode ? "dark" : "light");
    window.localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((previousMode) => !previousMode);
  };

  return (
    <nav className="nav-shell">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="brand">
          BOM<span className="text-[color:var(--text)]">LiveScore</span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <button
            onClick={toggleTheme}
            type="button"
            aria-label="Toggle theme"
            className="nav-link rounded-full border border-[color:var(--border)] px-3 py-1.5"
          >
            <i className={`fas ${isDarkMode ? "fa-sun" : "fa-moon"}`}></i>
          </button>
          <Link href="/" className="nav-link">
            Home
          </Link>
          <Link href="/admin/dashboard" className="nav-link">
            Admin
          </Link>
        </div>
        {/* Hamburger Menu Button (visible on small screens) */}
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
      {/* Mobile Menu (shown when isMenuOpen is true) */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="flex flex-col gap-4 px-6 pb-4">
            <button
              onClick={toggleTheme}
              type="button"
              aria-label="Toggle theme"
              className="nav-link w-fit rounded-full border border-[color:var(--border)] px-3 py-1.5"
            >
              <i className={`fas ${isDarkMode ? "fa-sun" : "fa-moon"}`}></i>
              <span className="ml-2">{isDarkMode ? "Light" : "Dark"} Mode</span>
            </button>
            <Link href="/" className="nav-link">
              Home
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
