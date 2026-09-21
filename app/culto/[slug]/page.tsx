import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { WorshipLive } from "@/components/worship-live";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: "Acompanhar culto",
    description: `Acompanhe o culto ${slug} pelo AD Church.`,
  };
}

export default async function PublicWorshipSessionPage({ params }: Props) {
  const { slug } = await params;

  return (
    <main>
      <PublicNav />
      <section className="shell section narrow worshipPublicPage">
        <Link className="backToBooks" href="/culto">← Modo Culto</Link>
        <div className="livePill">ACOMPANHAMENTO PÚBLICO</div>
        <h1 className="pageTitle">Acompanhe pelo celular</h1>
        <p className="muted">
          Esta página não exige login. Quando a liderança altera a referência ou o hino,
          a tela é atualizada em tempo real.
        </p>
        <WorshipLive slug={slug} />
      </section>
    </main>
  );
}
