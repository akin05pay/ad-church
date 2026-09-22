import Link from "next/link";
import { logout } from "@/app/login/actions";

export function MemberNav() {
  return (
    <>
      <header className="memberTopbar">
        <Link className="memberBrand" href="/app" aria-label="Minha Igreja — início">
          <span className="brandMark">AD</span>
          <span>
            <strong>Church</strong>
            <small>Minha Igreja</small>
          </span>
        </Link>

        <nav className="memberDesktopNav" aria-label="Área do membro">
          <Link href="/app">Início</Link>
          <Link href="/biblia">Bíblia</Link>
          <Link href="/hinarios">Harpa</Link>
          <Link href="/culto">Culto</Link>
          <Link href="/app/agenda">Agenda</Link>
          <Link href="/app/grupos">Grupos</Link>
          <Link href="/online">Online</Link>
          <Link href="/app/perfil">Perfil</Link>
        </nav>

        <form className="memberLogout">
          <button formAction={logout}>Sair</button>
        </form>
      </header>

      <nav className="memberBottomNav" aria-label="Navegação do aplicativo">
        <Link href="/app"><span>⌂</span><small>Início</small></Link>
        <Link href="/biblia"><span>✦</span><small>Bíblia</small></Link>
        <Link href="/culto" className="memberBottomLive"><span>●</span><small>Culto</small></Link>
        <Link href="/app/agenda"><span>▦</span><small>Agenda</small></Link>
        <Link href="/app/perfil"><span>○</span><small>Perfil</small></Link>
      </nav>
    </>
  );
}
