import Link from "next/link";
import { PublicNav } from "@/components/public-nav";

export default function AuthErrorPage() {
  return (
    <main>
      <PublicNav />
      <section className="shell section narrow authWrap">
        <div className="authCard">
          <div className="eyebrow">ACESSO</div>
          <h1>Não foi possível confirmar o acesso.</h1>
          <p>
            O link pode ter expirado ou já ter sido utilizado. Volte ao login e tente novamente.
          </p>
          <Link className="button" href="/login">Voltar ao login</Link>
        </div>
      </section>
    </main>
  );
}
