import Link from "next/link";

export function PublicNav() {
  return (
    <header className="topbar">
      <Link href="/" className="brand" aria-label="AD Church — início">
        <span className="brandMark">AD</span>
        <span className="brandWords">
          <strong>Church</strong>
          <small>Assembleia de Deus</small>
        </span>
      </Link>

      <nav className="nav" aria-label="Navegação principal">
        <Link href="/biblia">Bíblia</Link>
        <Link href="/hinarios">Harpa</Link>
        <Link href="/online">Online</Link>
        <Link href="/culto" className="navLive">
          <span className="navLiveDot" aria-hidden="true" />
          Culto
        </Link>
        <Link href="/login" className="navLogin">Minha Igreja</Link>
      </nav>
    </header>
  );
}
