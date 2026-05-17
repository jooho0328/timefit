"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch } from "@/lib/fetchJson";

export default function NewGroupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const result = await apiFetch<{ id: string; name: string }>("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!result.ok) { toast.error(result.error); return; }
      toast.success("그룹이 만들어졌어요!");
      router.push(`/group/${result.data.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">←</button>
        <h1 className="font-semibold text-zinc-900 dark:text-white">새 그룹 만들기</h1>
      </header>

      <div className="px-4 pt-8 max-w-sm mx-auto space-y-6">
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">친구들을 초대할 그룹의 이름을 정해주세요</p>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">그룹 이름</Label>
            <Input id="name" placeholder="우리 팀, 친구들, ..." value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 h-12 rounded-xl" required />
          </div>
          <Button type="submit" disabled={loading}
            className="w-full h-12 font-semibold bg-gradient-to-r from-violet-600 to-blue-600 border-0 rounded-xl text-white">
            {loading ? "만드는 중..." : "그룹 만들기"}
          </Button>
        </form>
      </div>
    </main>
  );
}
