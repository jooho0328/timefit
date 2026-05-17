import { SessionProvider } from "next-auth/react";

export default function ScheduleLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
