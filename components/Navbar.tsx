import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="nav-shell">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="brand">
          LiveScore<span className="text-white">.io</span>
        </Link>
        <div className="flex items-center gap-8">
          <Link href="/" className="nav-link">
            Home
          </Link>
          <Link href="/admin/dashboard" className="nav-link">
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}
