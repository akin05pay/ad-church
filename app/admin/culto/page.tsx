import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicWorshipLink } from "@/components/public-worship-link";
import {
  createWorshipSession,
  endWorshipSession,
  publishHymn,
  publishNotice,
  publishScripture,
  startWorshipSession,
} from "./actions";

export const metadata: Metadata = { title: "Operação do culto" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type UnitRow = {
  id: string;
  organization_id: string;
  parent_unit_id: string | null;
  name: string;
  unit_type: string;
};

function withinScope(unitId: string, scopeId: string, byId: Map<string, UnitRow>) {
  let cursor: string | null = unitId;
  const seen = new Set<string>();

  while (cursor && !seen.has(cursor)) {
    if (cursor === scopeId) return true;
    seen.add(cursor);
    cursor = byId.get(cursor)?.parent_unit_id ?? null;
  }

  return false;
}

export default async function WorshipAdminPage({ searchParams }: Props) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login?next=/admin/culto");

  const { data: assignments } = await supabase
    .from("role_assignments")
    .select("id,role_id,organization_id,scope_unit_id")
    .eq("user_id", userId)
    .eq("status", "active");

  const roleIds = [...new Set((assignments ?? []).map((item) => item.role_id))];
  const { data: worshipPermission } = await supabase
    .from("permissions")
    .select("id")
    .eq("key", "worship.manage")
    .maybeSingle();

  const { data: mappedPermissions } = worshipPermission && roleIds.length
    ? await supabase
        .from("role_permissions")
        .select("role_id")
        .eq("permission_id", worshipPermission.id)
        .in("role_id", roleIds)
    : { data: [] as { role_id: string }[] };

  const worshipRoleIds = new Set((mappedPermissions ?? []).map((item) => item.role_id));
  const permittedAssignments = (assignments ?? []).filter((item) => worshipRoleIds.has(item.role_id));

  if (!permittedAssignments.length) {
    return (
      <main className="privateShell">
        <div className="eyebrow">MODO CULTO</div>
        <h1>Operação não liberada</h1>
        <p>Seu usuário ainda não possui a permissão <code>worship.manage</code> em nenhum escopo.</p>
        <p><Link href="/admin">Voltar para Administração</Link></p>
      </main>
    );
  }

  const orgIds = [...new Set(permittedAssignments.map((item) => item.organization_id))];
  const { data: rawUnits } = await supabase
    .from("units")
    .select("id,organization_id,parent_unit_id,name,unit_type")
    .in("organization_id", orgIds)
    .eq("active", true)
    .order("name");

  const allUnits = (rawUnits ?? []) as UnitRow[];
  const byId = new Map(allUnits.map((unit) => [unit.id, unit]));
  const allowedUnits = allUnits.filter((unit) =>
    permittedAssignments.some((assignment) =>
      assignment.organization_id === unit.organization_id &&
      (!assignment.scope_unit_id || withinScope(unit.id, assignment.scope_unit_id, byId)),
    ),
  );
  const allowedUnitIds = allowedUnits.map((unit) => unit.id);

  const { data: sessions } = allowedUnitIds.length
    ? await supabase
        .from("worship_sessions")
        .select("id,unit_id,title,starts_at,ends_at,public_slug,status,created_at")
        .in("unit_id", allowedUnitIds)
        .order("created_at", { ascending: false })
        .limit(25)
    : { data: [] };

  const requestedSession = typeof query.session === "string" ? query.session : null;
  const selected =
    (sessions ?? []).find((session) => session.id === requestedSession) ??
    (sessions ?? []).find((session) => session.status === "live") ??
    (sessions ?? [])[0] ??
    null;

  const { data: currentItems } = selected
    ? await supabase
        .from("worship_items")
        .select(`
          id,item_type,label,sequence,is_current,
          scripture_passages(book,chapter,verse_start,verse_end,external_reference),
          hymns(hymn_number,title,external_reference)
        `)
        .eq("worship_session_id", selected.id)
        .eq("is_current", true)
        .order("sequence")
    : { data: [] };

  const scripture = currentItems?.find((item) => item.item_type === "scripture");
  const hymn = currentItems?.find((item) => item.item_type === "hymn");
  const notice = currentItems?.find((item) => item.item_type === "notice");
  const ok = typeof query.ok === "string" ? query.ok : null;
  const error = typeof query.error === "string" ? query.error : null;

  return (
    <main className="privateShell worshipAdminShell">
      <div className="privateHeader">
        <div>
          <div className="eyebrow">WORSHIP 0.4 · REALTIME</div>
          <h1>Operação do culto</h1>
          <p>Publique a referência bíblica, o hino e avisos que aparecem nos celulares.</p>
        </div>
        <Link className="button secondary" href="/admin">Administração</Link>
      </div>

      {(ok || error) && (
        <div className={`operatorMessage ${error ? "operatorMessageError" : ""}`}>
          <strong>{error ? "Não foi possível concluir" : "Atualizado"}</strong>
          <span>{error ?? ok}</span>
        </div>
      )}

      <section className="operatorLayout">
        <aside className="operatorSidebar">
          <div className="operatorPanel">
            <div className="operatorPanelTitle">
              <span>Sessões</span>
              <small>{sessions?.length ?? 0}</small>
            </div>
            <div className="operatorSessionList">
              {(sessions ?? []).map((session) => (
                <Link
                  className={`operatorSession ${selected?.id === session.id ? "active" : ""}`}
                  href={`/admin/culto?session=${session.id}`}
                  key={session.id}
                >
                  <span className={`operatorStatus operatorStatus-${session.status}`} />
                  <div>
                    <strong>{session.title}</strong>
                    <small>{session.status}</small>
                  </div>
                </Link>
              ))}
              {!sessions?.length && <p className="muted">Nenhuma sessão criada.</p>}
            </div>
          </div>

          <div className="operatorPanel">
            <div className="operatorPanelTitle"><span>Nova sessão</span></div>
            <form action={createWorshipSession} className="operatorForm">
              <label>
                Congregação / unidade
                <select name="unit_id" required defaultValue="">
                  <option value="" disabled>Selecione</option>
                  {allowedUnits.map((unit) => (
                    <option value={unit.id} key={unit.id}>
                      {unit.name} · {unit.unit_type}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Nome do culto
                <input name="title" defaultValue="Culto de Celebração" required />
              </label>
              <button type="submit">Criar sessão</button>
            </form>
          </div>
        </aside>

        <section className="operatorMain">
          {selected ? (
            <>
              <div className="operatorHero">
                <div>
                  <span className={`operatorLiveTag operatorLiveTag-${selected.status}`}>
                    {selected.status === "live" ? "● AO VIVO" : selected.status.toUpperCase()}
                  </span>
                  <h2>{selected.title}</h2>
                  <p>{allowedUnits.find((unit) => unit.id === selected.unit_id)?.name}</p>
                </div>
                <div className="operatorHeroActions">
                  {selected.status !== "live" && selected.status !== "ended" && (
                    <form action={startWorshipSession}>
                      <input type="hidden" name="session_id" value={selected.id} />
                      <button type="submit">Iniciar ao vivo</button>
                    </form>
                  )}
                  {selected.status === "live" && (
                    <form action={endWorshipSession}>
                      <input type="hidden" name="session_id" value={selected.id} />
                      <button className="dangerButton" type="submit">Encerrar culto</button>
                    </form>
                  )}
                  <Link className="secondaryButton operatorPublicButton" target="_blank" href={`/culto/${selected.public_slug}`}>
                    Abrir público ↗
                  </Link>
                </div>
              </div>

              <PublicWorshipLink slug={selected.public_slug} />

              <div className="operatorCurrentGrid">
                <article>
                  <small>LEITURA ATUAL</small>
                  <strong>
                    {scripture?.scripture_passages
                      ? `${scripture.scripture_passages.book} ${scripture.scripture_passages.chapter}:${scripture.scripture_passages.verse_start ?? ""}`
                      : "Não definida"}
                  </strong>
                </article>
                <article>
                  <small>HINO ATUAL</small>
                  <strong>
                    {hymn?.hymns
                      ? `${hymn.hymns.hymn_number ?? ""} · ${hymn.hymns.title}`
                      : "Não definido"}
                  </strong>
                </article>
                <article>
                  <small>AVISO</small>
                  <strong>{notice?.label ?? "Nenhum aviso"}</strong>
                </article>
              </div>

              <div className="operatorPublishGrid">
                <div className="operatorPanel">
                  <div className="operatorPanelTitle">
                    <span>Publicar Bíblia</span>
                    <small>BPM</small>
                  </div>
                  <form action={publishScripture} className="operatorForm operatorBibleForm">
                    <input type="hidden" name="session_id" value={selected.id} />
                    <label className="operatorWide">
                      Livro
                      <input name="book" placeholder="João" required />
                    </label>
                    <label>
                      Capítulo
                      <input name="chapter" type="number" min="1" inputMode="numeric" required />
                    </label>
                    <label>
                      Versículo
                      <input name="verse_start" type="number" min="1" inputMode="numeric" required />
                    </label>
                    <label>
                      Até
                      <input name="verse_end" type="number" min="1" inputMode="numeric" />
                    </label>
                    <button className="operatorWide" type="submit">Publicar referência</button>
                  </form>
                </div>

                <div className="operatorPanel">
                  <div className="operatorPanelTitle">
                    <span>Publicar Harpa</span>
                    <small>licenciada</small>
                  </div>
                  <form action={publishHymn} className="operatorForm">
                    <input type="hidden" name="session_id" value={selected.id} />
                    <label>
                      Número
                      <input name="hymn_number" type="number" min="1" inputMode="numeric" placeholder="291" required />
                    </label>
                    <label>
                      Título
                      <input name="hymn_title" placeholder="Opcional se já estiver no catálogo" />
                    </label>
                    <button type="submit">Publicar hino</button>
                  </form>
                </div>

                <div className="operatorPanel">
                  <div className="operatorPanelTitle"><span>Aviso rápido</span></div>
                  <form action={publishNotice} className="operatorForm">
                    <input type="hidden" name="session_id" value={selected.id} />
                    <label>
                      Mensagem
                      <input name="notice" placeholder="Ex.: momento de oração" required />
                    </label>
                    <button type="submit">Publicar aviso</button>
                  </form>
                </div>
              </div>
            </>
          ) : (
            <div className="operatorEmpty">
              <span>◉</span>
              <h2>Crie a primeira sessão</h2>
              <p>Depois você poderá iniciar o culto e publicar Bíblia, Harpa e avisos.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
