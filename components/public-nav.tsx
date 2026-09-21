import Link from "next/link";

export function PublicNav() {
  return (
    <header className="topbar">
      <Link href="/" className="brand" aria-label="AD Church — início">
        <span className="brandMark">AD</span>
        <span>Church</span>
      </Link>
      <nav className="nav" aria-label="Navegação principal">
        <Link href="/biblia">Bíblia</Link>
        <Link href="/hinarios">Hinários</Link>
        <Link href="/culto">Acompanhar culto</Link>
        <Link href="/login" className="navLogin">Entrar</Link>
      </nav>
    </header>
  );
}
