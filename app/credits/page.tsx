import Link from "next/link";
import Image from "next/image";

const teamMembers = [
  { name: "Navitha Aken", role: "Frontend Developer" },
  { name: "Senura Perera", role: "Frontend Developer" },
  { name: "Gesandu Rajapaksha", role: "Frontend Developer" },
  { name: "Vidul Batawala", role: "Backend Developer" },
  { name: "Dulina Duljaya", role: "Backend Developer" },
  { name: "Yesith Sankalpa", role: "Backend Developer" },
];

export default function CreditsPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 md:py-16">
      <section className="mb-10 text-center">
        <p className="mb-4 text-xl font-black uppercase tracking-[0.14em] text-[color:var(--primary)] md:text-2xl">
          Media Partnership By ACBU
        </p>
        <div className="mx-auto w-fit rounded-2xl border border-[color:var(--border)] bg-white/80 p-4 shadow-[0_10px_28px_rgba(128,0,32,0.14)]">
          <Image
            src="/acbu.png"
            alt="ACBU logo"
            width={280}
            height={280}
            className="h-auto w-[180px] md:w-[230px]"
            priority
          />
        </div>
      </section>

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
