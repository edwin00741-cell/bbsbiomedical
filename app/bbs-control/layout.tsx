import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Back-office",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BbsControlLayout({ children }: { children: React.ReactNode }) {
  return children;
}


