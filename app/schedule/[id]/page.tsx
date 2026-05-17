"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { TimeBlock, CircleThemeVars } from "@/components/CircleEditor";
import { blockDisplayName, blockColor } from "@/components/CircleEditor";
import { getItem } from "@/lib/shopItems";
import type { CircleThemeData } from "@/lib/shopItems";

const CircleEditor = dynamic(() => import("@/components/CircleEditor"), { ssr: false });

interface Schedule { id: string; date: string; blocks: TimeBlock[]; }

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
}

export default function ScheduleDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [circleTheme, setCircleTheme] = useState<CircleThemeVars | undefined>();

  useEffect(() => {
    fetch("/api/user/me")
      .then((r) => r.ok ? r.json() : null)
      .then((u) => {
        if (u?.activeTheme) {
          const item = getItem(u.activeTheme);
          if (item) setCircleTheme(JSON.parse(item.data) as CircleThemeData);
        }
      }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/schedules/${id}`)
      .then((r) => { if (!r.ok) throw new Error("not found"); return r.json(); })
      .then((data) => { setSchedule(data); setBlocks(data.blocks ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!schedule) return;
    setSaving(true);
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: schedule.date, blocks }),
      });
      if (!res.ok) { toast.error("저장에 실패했어요."); return; }
      toast.success("저장됐어요!");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm("이 시간표를 삭제할까요?")) return;
    const res = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("삭제에 실패했어요."); return; }
    toast.success("삭제됐어요.");
    router.push("/dashboard");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-400">불러오는 중...</div>
  );
  if (!schedule) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-400">찾을 수 없어요.</div>
  );

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 px-4 md:px-8 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-lg">←</button>
        <h1 className="font-semibold flex-1 text-zinc-900 dark:text-white">{formatDate(schedule.date)}</h1>
        <Button onClick={handleSave} disabled={saving}
          className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl h-9 px-5 text-sm">
          {saving ? "저장 중..." : "저장"}
        </Button>
        <Button onClick={handleDelete} variant="ghost"
          className="text-red-500 dark:text-red-400 hover:text-red-600 h-9 px-3 text-sm">
          삭제
        </Button>
      </header>

      <div className="px-4 md:px-8 pt-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-5 md:gap-8 md:items-start">
          {/* 원형 에디터 */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 md:p-6 md:flex-1">
            <div className="md:max-w-[480px] mx-auto">
              <CircleEditor blocks={blocks} onChange={setBlocks} theme={circleTheme} />
            </div>
          </div>

          {/* 블록 목록 */}
          <div className="md:w-80 md:flex-shrink-0 space-y-3">
            {blocks.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-8 text-center text-zinc-400 text-sm">
                블록을 추가하면 여기에 표시돼요
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-2">
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">블록 목록 ({blocks.length})</p>
                {blocks.map((b) => {
                  const dur = ((b.endMin - b.startMin + 1440) % 1440) / 60;
                  const sh = String(Math.floor(b.startMin / 60)).padStart(2, "0");
                  const sm = String(b.startMin % 60).padStart(2, "0");
                  const eh = String(Math.floor(b.endMin / 60) % 24).padStart(2, "0");
                  const em = String(b.endMin % 60).padStart(2, "0");
                  return (
                    <div key={b.id} className="flex items-center gap-2 py-1.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: blockColor(b) }} />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">{blockDisplayName(b)}</span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                        {sh}:{sm}~{eh}:{em} <span className="text-zinc-300 dark:text-zinc-600">({dur.toFixed(1)}h)</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
