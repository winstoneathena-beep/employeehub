import type { Metadata } from "next";
import { Signpost, Sparkles } from "lucide-react";
import { PillNavbar } from "@/components/hub/pill-navbar";
import { WelcomeHeader } from "@/components/hub/welcome-header";
import { ToolTile } from "@/components/hub/tool-tile";

export const metadata: Metadata = { title: "Hub" };

export default function HubPage() {
  return (
    <div className="relative min-h-screen w-full">
      <PillNavbar />

      <main className="mx-auto w-full max-w-5xl px-4 pt-28 pb-20 sm:px-6">
        <WelcomeHeader />

        <section id="tools" className="mt-12">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Available tools
            </h2>
            <span className="text-xs text-muted-foreground">
              1 of 1 active
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ToolTile
              title="Signs"
              description="Order on-brand signage with full Parkwell brand guardrails baked in."
              href="https://signs.parkwellteamhub.com"
              icon={<Signpost className="h-5 w-5" />}
              state="available"
            />
            <ToolTile
              title="Future tool"
              description="As Parkwell builds more internal tools, they appear here. One login covers everything."
              href="#"
              icon={<Sparkles className="h-5 w-5" />}
              state="soon"
            />
          </div>
        </section>

        <footer className="mt-20 border-t border-border pt-6 text-xs text-muted-foreground">
          Signed in once, everywhere. Sessions are shared across every tool on{" "}
          <span className="font-mono text-foreground">
            parkwellteamhub.com
          </span>
          .
        </footer>
      </main>
    </div>
  );
}
