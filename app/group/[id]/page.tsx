"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { TimeBlock } from "@/components/CircleEditor";

const CircleView = dynamic(() => import("@/components/CircleView"), { ssr: false });

interface MemberSchedule {
  id: string;
  date: string;
  blocks: TimeBlock[];
  user: { id: string; name: string };
}

interface Group {
  id: string;
  name: string;
  inviteToken: string;
  members: { user: { id: string; name: string; badge?: string | null } }[];
}

function formatMin(min: number) {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function calcOverlap(schedules: MemberSchedule[]) {
  if (schedules.length === 0) return [];
  const filled = new Set<number>();
  for (const s of schedules) {
    for (const b of s.blocks) {
      let cur = b.startMin;
      while (cur !== b.endMin) { filled.add(cur); cur = (cur + 1) % 1440; }
    }
  }
  const free: number[] = [];
  for (let m = 0; m < 1440; m++) { if (!filled.has(m)) free.push(m); }
  if (free.length === 0) return [];
  const ranges: { startMin: number; endMin: number }[] = [];
  let start = free[0]; let prev = free[0];
  for (let i = 1; i < free.length; i++) {
    if (free[i] !== prev + 1) { ranges.push({ startMin: start, endMin: prev + 1 }); start = free[i]; }
    prev = free[i];
  }
  ranges.push({ startMin: start, endMin: prev + 1 });
  return ranges.filter((r) => r.endMin - r.startMin >= 30);
}

export default function GroupPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [schedules, setSchedules] = useState<MemberSchedule[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [gRes, sRes] = await Promise.all([
        fetch(`/api/groups/${id}`),
        fetch(`/api/groups/${id}/schedules?date=${date}`),
      ]);
      if (gRes.ok) setGroup(await gRes.json());
      if (sRes.ok) setSchedules(await sRes.json());
    } finally { setLoading(false); }
  }, [id, date]);

  useEffect(() => { loadData(); }, [loadData]);

  const copyInviteLink = () => {
    if (!group) return;
    navigator.clipboard.writeText(`${window.location.origin}/invite/${group.inviteToken}`);
    toast.success("초대 링크가 복사됐어요!");
  };

  const overlapBlocks = calcOverlap(schedules);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-400">불러오는 중...</div>
  );
  if (!group) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-400">찾을 수 없어요.</div>
  );

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 px-4 md:px-8 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-lg">←</button>
        <h1 className="font-semibold flex-1 text-zinc-900 dark:text-white text-lg">{group.name}</h1>
        <div className="flex flex-wrap gap-1.5 hidden md:flex">
          {group.members.map((m) => (
            <Badge key={m.user.id} variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {m.user.badge && <span className="mr-1">{m.user.badge}</span>}
              {m.user.name}{m.user.id === session?.user?.id && " (나)"}
            </Badge>
          ))}
        </div>
        <Button onClick={copyInviteLink} size="sm" variant="outline"
          className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs">
          🔗 초대
        </Button>
      </header>

      <div className="px-4 md:px-8 pt-5 max-w-6xl mx-auto space-y-5 pb-24">
        {/* 모바일에만 멤버 뱃지 */}
        <div className="flex flex-wrap gap-1.5 md:hidden">
          {group.members.map((m) => (
            <Badge key={m.user.id} variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {m.user.badge && <span className="mr-1">{m.user.badge}</span>}
              {m.user.name}{m.user.id === session?.user?.id && " (나)"}
            </Badge>
          ))}
        </div>

        {/* 날짜 + 겹치는 시간 */}
        <div className="flex flex-col md:flex-row gap-4 md:items-start">
          <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 md:w-64">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">날짜</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="flex-1 bg-transparent text-zinc-900 dark:text-white text-sm outline-none" />
          </div>

          {schedules.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-green-200 dark:border-zinc-700 rounded-2xl p-4 space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <p className="font-semibold text-sm text-zinc-900 dark:text-white">모두 가능한 시간</p>
              </div>
              {overlapBlocks.length === 0 ? (
                <p className="text-sm text-zinc-400">겹치는 빈 시간이 없어요</p>
              ) : (
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  {overlapBlocks.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        {formatMin(b.startMin)} ~ {formatMin(b.endMin)}
                      </span>
                      <span className="text-zinc-400 text-xs">{((b.endMin - b.startMin) / 60).toFixed(1)}h</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 멤버별 시간표 */}
        <div>
          <p className="font-semibold text-sm text-zinc-700 dark:text-zinc-300 mb-3">멤버별 시간표</p>
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-zinc-400 text-sm">이 날짜에 등록된 시간표가 없어요</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {schedules.map((s) => (
                <div key={s.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col items-center gap-2">
                  <CircleView blocks={s.blocks} overlapBlocks={overlapBlocks} label={s.user.name} />
                </div>
              ))}
            </div>
          )}
        </div>

        {!schedules.find((s) => s.user.id === session?.user?.id) && (
          <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-5 text-center space-y-3">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">이 날짜에 내 시간표가 없어요</p>
            <Button onClick={() => router.push("/schedule/new")} variant="outline"
              className="border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-xl">
              시간표 만들러 가기
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
