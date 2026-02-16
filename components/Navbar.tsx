import Link from "next/link";

export default function Navbar() {
  return (
    <nav
      className="p-6 border-b-2"
      style={{
        backgroundColor: "rgba(26, 13, 46, 0.6)",
        borderBottomColor: "#ff1493",
        boxShadow:
          "0 0 30px rgba(255, 20, 147, 0.25), inset 0 0 20px rgba(255, 20, 147, 0.05)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="container mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="text-3xl font-black neon-text tracking-widest"
          style={{ color: "#ff1493" }}
        >
          LIVESCORE
        </Link>
        <div className="space-x-12 flex">
          <Link href="/" className="nav-link font-bold text-base">
            HOME
          </Link>
          <Link
            href="/admin/dashboard"
            className="nav-link font-bold text-base"
          >
            ADMIN PANEL
          </Link>
        </div>
      </div>
    </nav>
  );
}
