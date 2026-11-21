import Image from "next/image";
import "./auth.css";
export function AuthCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <main className="bbs-auth-page"><section className="bbs-auth-card">
    <Image src="/brand/bbs-primary-horizontal-color.png" alt="Biomedical Business and Service" width={500} height={128} priority />
    <h1>{title}</h1><p>{description}</p>{children}
  </section></main>;
}
