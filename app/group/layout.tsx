import { SessionProvider } from "next-auth/react";

export default function GroupLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
