import Link from "next/link";

const teamMembers = [
  { name: "Navitha Aken", role: "Frontend Developer" },
  { name: "Senura Perera", role: "Frontend Developer" },
  { name: "Vidul Sankalpa", role: "Backend Developer" },
  { name: "Dulina Duljaya", role: "Backend Developer" },
  { name: "Yesith Sankalpa", role: "Backend Developer" },
];

export default function CreditsPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 md:py-16">
      <section className="mb-8 text-center">
        <div className="hero-pill mb-4">
          <i className="fas fa-users"></i> credits
        </div>
        <h1 className="hero-heading mb-4 text-[color:var(--primary)]">
          Developer Team
        </h1>
        <p className="text-[color:var(--muted)]">
          This platform was built and maintained by the following team.
        </p>
      </section>

      <section className="grid gap-4">
        {teamMembers.map((member) => (
          <article
            key={member.name}
            className="neon-card flex flex-col gap-2 p-5 md:flex-row md:items-center md:justify-between"
          >
            <h2 className="text-xl font-bold">{member.name}</h2>
            <p className="text-[color:var(--muted)]">{member.role}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 flex justify-center">
        <Link href="/" className="cta-btn secondary">
          Back to Live Match
        </Link>
      </section>
    </main>
  );
}
