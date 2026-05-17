"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiFetch } from "@/lib/fetchJson";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [groupName, setGroupName] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then((r) => r.ok ? r.json() : r.json().then((d: { error?: string }) => { throw new Error(d.error ?? "유효하지 않은 링크"); }))
      .then((data: { name: string }) => setGroupName(data.name))
      .catch((e: Error) => setError(e.message));
  }, [token]);

  useEffect(() => {
    if (status === "unauthenticated") {
      sessionStorage.setItem("pendingInvite", token);
      router.push(`/auth/login?callbackUrl=/invite/${token}`);
    }
  }, [status, token, router]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const result = await apiFetch<{ groupId: string }>(`/api/invite/${token}`, { method: "POST" });
      if (!result.ok) { toast.error(result.error); return; }
      toast.success(`${groupName} 그룹에 참여했어요!`);
      router.push(`/group/${result.data.groupId}`);
    } finally {
      setJoining(false);
    }
  };

  if (status === "loading" || (!groupName && !error)) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-400">불러오는 중...</div>
  );
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center space-y-3">
        <p className="text-zinc-400">{error}</p>
        <Button onClick={() => router.push("/dashboard")} variant="outline" className="rounded-xl">대시보드로</Button>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="text-5xl">👋</div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{groupName}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            그룹에 초대됐어요.<br />{session?.user?.name}으로 참여할까요?
          </p>
        </div>
        <Button onClick={handleJoin} disabled={joining}
          className="w-full h-12 font-semibold bg-gradient-to-r from-violet-600 to-blue-600 border-0 rounded-xl text-white">
          {joining ? "참여 중..." : "그룹 참여하기"}
        </Button>
        <button onClick={() => router.push("/dashboard")} className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
          나중에 하기
        </button>
      </div>
    </main>
  );
}
