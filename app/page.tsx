import Link from "next/link";
import { PublicNav } from "@/components/public-nav";

export default function HomePage() {
  return (
    <main>
      <PublicNav />
      <section className="hero shell">
        <div className="eyebrow">AD CHURCH · PWA</div>
        <h1>A igreja no culto.<br />A igreja durante a semana.</h1>
        <p className="lead">
          Bíblia e hinários sem login. Vida congregacional, ministérios, EBD e comunicação
          com acesso autenticado e aprovado pela igreja.
        </p>
        <div className="actions">
          <Link className="button primary" href="/culto">Acompanhar o culto</Link>
          <Link className="button secondary" href="/biblia">Abrir a Bíblia</Link>
        </div>
      </section>
      <section className="shell grid3 section">
        <Link href="/biblia" className="featureCard">
          <span className="featureIcon">01</span>
          <h2>Bíblia</h2>
          <p>Leitura pública, busca por livro, capítulo e versículo. Sem cadastro obrigatório.</p>
        </Link>
        <Link href="/hinarios" className="featureCard">
          <span className="featureIcon">02</span>
          <h2>Hinários</h2>
          <p>Busca por número ou título, com conteúdo disponibilizado conforme autorização de uso.</p>
        </Link>
        <Link href="/login" className="featureCard">
          <span className="featureIcon">03</span>
          <h2>Minha Igreja</h2>
          <p>Área privada para membros, líderes, ministérios, congregações e administração setorial.</p>
        </Link>
      </section>
    </main>
  );
}
