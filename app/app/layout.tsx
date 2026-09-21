import type { ReactNode } from "react";
import { MemberNav } from "@/components/member-nav";

export default function MemberAppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="memberAppFrame">
      <MemberNav />
      {children}
    </div>
  );
}
