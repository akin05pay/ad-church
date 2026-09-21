import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { login, signup } from "./actions";

export const metadata: Metadata = { title: "Entrar" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/app";
  const error = typeof params.error === "string" ? params.error : null;
  const created = params.created === "1";

  return (
    <main>
      <PublicNav />
      <section className="shell section narrow authWrap">
        <div className="authCard">
          <div className="eyebrow">ÁREA PRIVADA</div>
          <h1>Entrar no AD Church</h1>
          <p>
            O login libera a área autenticada. Congregações, ministérios e funções
            administrativas continuam protegidos por papéis, escopo e RLS.
          </p>

          {created && (
            <div className="notice">
              <strong>Conta criada.</strong>
              <span>
                Se receber um e-mail de confirmação, confirme o endereço e depois entre.
                O primeiro administrador autorizado será ativado automaticamente após o login.
              </span>
            </div>
          )}

          {error && (
            <div className="notice">
              <strong>Não foi possível continuar.</strong>
              <span>
                Confira e-mail e senha. Para cadastro, use uma senha com pelo menos 8 caracteres.
              </span>
            </div>
          )}

          <form className="authForm">
            <input type="hidden" name="next" value={next} />

            <label>
              E-mail
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="nome@exemplo.com"
              />
            </label>

            <label>
              Senha
              <input
                name="password"
                type="password"
                minLength={8}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </label>

            <button formAction={login}>Entrar</button>
            <button formAction={signup} className="secondaryButton">
              Criar conta
            </button>
          </form>

          <p className="authFoot">
            Quer apenas acompanhar o culto? <Link href="/culto">Não precisa entrar.</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
