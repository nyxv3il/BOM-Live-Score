export default function AdminPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-16 px-4">
      <div className="w-full max-w-4xl">
        <h1
          className="text-5xl font-black mb-4 neon-text text-center"
          style={{ color: "var(--primary)" }}
        >
          ⚡ ADMIN PORTAL
        </h1>
        <p
          className="text-xl mb-12 text-center"
          style={{ color: "var(--purple)" }}
        >
          Match Management & Control Center
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div
            className="neon-card p-8"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.88)" }}
          >
            <h2
              className="text-2xl font-black mb-3"
              style={{ color: "var(--primary)" }}
            >
              📊 Dashboard
            </h2>
            <p style={{ color: "var(--silver)" }}>
              Update live match scores, player stats, and real-time match
              information
            </p>
          </div>

          <div
            className="neon-card p-8"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.88)" }}
          >
            <h2
              className="text-2xl font-black mb-3"
              style={{ color: "var(--purple)" }}
            >
              🔐 Security
            </h2>
            <p style={{ color: "var(--silver)" }}>
              Secure login with session management for authorized personnel only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
