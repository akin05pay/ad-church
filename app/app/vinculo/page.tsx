import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requestChurchLink } from "./actions";

export const metadata: Metadata = { title: "Solicitar vínculo" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ChurchLinkPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = (claimsData?.claims ?? {}) as Record<string, unknown>;
  const email = typeof claims.email === "string" ? claims.email : "";

  const [{ data: organizations }, { data: units }] = await Promise.all([
    supabase.from("organizations").select("id,name").order("name"),
    supabase
      .from("units")
      .select("id,organization_id,name,city,state")
      .eq("unit_type", "congregation")
      .eq("active", true)
      .order("name"),
  ]);

  const organizationNames = new Map(
    (organizations ?? []).map((organization) => [organization.id, organization.name])
  );

  return (
    <main className="privateShell">
      <div className="eyebrow">MINHA IGREJA</div>
      <div className="privateHeader">
        <div>
          <h1>Solicitar vínculo</h1>
          <p>
            Escolha sua congregação. A conta continuará sem privilégios até a aprovação da secretaria responsável.
          </p>
        </div>
        <Link href="/app">Voltar</Link>
      </div>

      {params.created === "1" && (
        <div className="notice">
          <strong>Solicitação enviada.</strong>
          <span>A secretaria verá o pedido na fila de aprovação.</span>
        </div>
      )}

      {params.pending === "1" && (
        <div className="notice">
          <strong>Já existe uma solicitação pendente.</strong>
          <span>Não é necessário enviar novamente.</span>
        </div>
      )}

      {!units?.length ? (
        <div className="notice">
          <strong>Cadastro oficial ainda não carregado.</strong>
          <span>
            A tela já está pronta. Assim que a relação de congregações for importada, elas aparecerão automaticamente aqui.
          </span>
        </div>
      ) : (
        <form action={requestChurchLink} className="adminForm linkForm">
          <label>
            Congregação
            <select name="target" required defaultValue="">
              <option value="">Selecione sua congregação</option>
              {units.map((unit) => (
                <option key={unit.id} value={`${unit.organization_id}:${unit.id}`}>
                  {organizationNames.get(unit.organization_id) ?? "Organização"} · {unit.name}
                  {unit.city ? ` · ${unit.city}${unit.state ? `/${unit.state}` : ""}` : ""}
                </option>
              ))}
            </select>
          </label>

          <label>
            Nome completo
            <input name="full_name" required autoComplete="name" />
          </label>

          <label>
            E-mail
            <input name="email" type="email" defaultValue={email} autoComplete="email" />
          </label>

          <label>
            Telefone / WhatsApp
            <input name="phone" type="tel" autoComplete="tel" />
          </label>

          <label>
            Data de nascimento — opcional
            <input name="birth_date" type="date" />
          </label>

          <small className="muted">
            E-mail, telefone e data de nascimento são usados apenas para auxiliar a conciliação com o cadastro oficial.
            Uma coincidência nunca aprova acesso automaticamente.
          </small>

          <button type="submit">Enviar solicitação</button>
        </form>
      )}
    </main>
  );
}
