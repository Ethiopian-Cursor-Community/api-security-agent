import { UploadZone } from "@/components/upload-zone";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-full bg-[#07090c]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.08),_transparent_50%)]" />

      <header className="relative border-b border-zinc-800/80 bg-zinc-950/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              ◈
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-100">
                API Security Agent
              </p>
              <p className="text-xs text-zinc-500">
                Autonomous pentest & remediation
              </p>
            </div>
          </div>
          <a
            href="https://cursor.com/docs/api/sdk/typescript"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 hover:text-emerald-400"
          >
            Cursor SDK
          </a>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 py-16">
        <section className="mb-16 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-emerald-500/90">
            AI-powered API security
          </p>
          <h1 className="mx-auto max-w-2xl text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
            Paste a GitHub repo.{" "}
            <span className="text-emerald-400">We find, explain, and patch.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-400">
            Clones the repo, discovers OpenAPI, maps attack surface, simulates
            scans, explains findings, and auto-remediates with the Cursor SDK.
          </p>
        </section>

        <section className="flex flex-col items-center">
          <UploadZone />
        </section>

        <section className="mt-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Feature
            title="GitHub clone"
            desc="Clone public or private repos, then find OpenAPI specs inside."
          />
          <Feature
            title="Attack surface map"
            desc="Endpoint graph, auth coverage, and risk scoring."
          />
          <Feature
            title="Simulated scanning"
            desc="IDOR, injection, BOLA, mass assignment, and more."
          />
          <Feature
            title="Cursor remediation"
            desc="Generate patch diffs via Agent.prompt or simulated mode."
          />
        </section>

        <section className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-sm font-medium text-zinc-300">How it works</h2>
          <ol className="mt-4 grid gap-3 text-sm text-zinc-400 sm:grid-cols-2 lg:grid-cols-5">
            <li>1. Paste GitHub link</li>
            <li>2. Map API structure</li>
            <li>3. Plan & simulate scans</li>
            <li>4. Explain findings</li>
            <li>5. Patch with Cursor SDK</li>
          </ol>
        </section>
      </main>

      <footer className="relative border-t border-zinc-800/80 py-8 text-center text-xs text-zinc-600">
        <Link href="/" className="hover:text-zinc-400">
          API Security Agent — hackathon demo
        </Link>
      </footer>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-5">
      <h3 className="font-medium text-zinc-200">{title}</h3>
      <p className="mt-2 text-sm text-zinc-500">{desc}</p>
    </div>
  );
}
