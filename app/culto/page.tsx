import type { Metadata } from "next";
import { PublicNav } from "@/components/public-nav";
import { WorshipLive } from "@/components/worship-live";

export const metadata: Metadata = { title: "Acompanhar culto" };

export default function WorshipPage() {
  return (
    <main>
      <PublicNav />
      <section className="shell section narrow">
        <div className="livePill">MODO CULTO · PÚBLICO</div>
        <h1 className="pageTitle">Acompanhe pelo celular</h1>
        <p className="muted">Passagens bíblicas e hinos podem ser acompanhados sem criar conta. Quando houver uma sessão ativa, a tela é sincronizada em tempo real.</p>
        <WorshipLive />
      </section>
    </main>
  );
}
