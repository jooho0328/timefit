"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { apiFetch } from "@/lib/fetchJson";

interface UserProfile {
  cash: number;
  referralCode: string;
  badge: string | null;
}

interface Schedule {
  id: string;
  date: string;
  blocks: { id: string; category: string; startMin: number; endMin: number }[];
}

interface Group {
  id: string;
  name: string;
  inviteToken: string;
  members: { user: { id: string; name: string } }[];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}

function totalHours(blocks: Schedule["blocks"]) {
  return blocks.reduce((acc, b) => {
    let dur = b.endMin - b.startMin;
    if (dur < 0) dur += 1440;
    return acc + dur;
  }, 0) / 60;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<"schedules" | "groups">("schedules");

  // 그룹 패널
  const [groupPanel, setGroupPanel] = useState<"none" | "create" | "join">("none");
  const [newGroupName, setNewGroupName] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [groupLoading, setGroupLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/schedules").then((r) => r.json()).then(setSchedules).catch(() => {});
    fetch("/api/groups").then((r) => r.json()).then(setGroups).catch(() => {});
    fetch("/api/user/me").then((r) => r.json()).then(setUserProfile).catch(() => {});
  }, [status]);

  const copyReferralCode = () => {
    if (!userProfile) return;
    navigator.clipboard.writeText(userProfile.referralCode);
    toast.success("추천인 코드가 복사됐어요!");
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setGroupLoading(true);
    try {
      const result = await apiFetch<{ id: string; name: string }>("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName.trim() }),
      });
      if (!result.ok) { toast.error(result.error); return; }
      toast.success(`"${result.data.name}" 그룹이 만들어졌어요!`);
      setNewGroupName("");
      setGroupPanel("none");
      fetch("/api/groups").then((r) => r.json()).then(setGroups).catch(() => {});
    } finally {
      setGroupLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    const raw = inviteLink.trim();
    if (!raw) return;
    const token = raw.includes("/invite/") ? raw.split("/invite/").pop()!.split("?")[0] : raw;
    setGroupLoading(true);
    try {
      const result = await apiFetch(`/api/invite/${token}`, { method: "POST" });
      if (!result.ok) { toast.error(result.error); return; }
      toast.success("그룹에 참가했어요!");
      setInviteLink("");
      setGroupPanel("none");
      fetch("/api/groups").then((r) => r.json()).then(setGroups).catch(() => {});
    } finally {
      setGroupLoading(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("초대 링크가 복사됐어요!");
  };

  const today = new Date().toISOString().slice(0, 10);
  const hasToday = schedules.some((s) => s.date === today);

  if (status === "loading") return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
      <div className="text-zinc-400">불러오는 중...</div>
    </div>
  );

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 px-4 md:px-8 py-3 flex items-center justify-between">
        <h1 className="font-extrabold text-xl md:text-2xl text-zinc-900 dark:text-white tracking-tight">
          Time<span className="text-violet-500">Fit</span>
        </h1>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link href="/shop">
            <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1.5 rounded-xl cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-800/40 transition-colors">
              <span className="text-amber-600 dark:text-amber-400 text-xs">💰</span>
              <span className="text-amber-700 dark:text-amber-300 font-bold text-xs">{userProfile?.cash ?? 0}</span>
            </div>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })} className="text-zinc-500 dark:text-zinc-400 text-xs">
            로그아웃
          </Button>
        </div>
      </header>

      <div className="px-4 md:px-8 pt-6 max-w-6xl mx-auto">
        {/* 데스크톱: 2컬럼 / 모바일: 1컬럼 */}
        <div className="flex flex-col md:flex-row gap-5 md:gap-8 md:items-start">

          {/* 왼쪽 사이드바 (데스크톱) / 상단 (모바일) */}
          <div className="flex flex-col gap-5 md:w-72 md:flex-shrink-0">
            {/* 오늘 시간표 CTA */}
            <div className="bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-900/40 dark:to-blue-900/40 border border-violet-200 dark:border-violet-700/30 rounded-2xl p-5">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                {new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" })}
              </p>
              <p className="font-semibold text-base text-zinc-900 dark:text-white mb-3">
                {hasToday ? "오늘 시간표가 있어요" : "오늘 시간표를 아직 안 그렸어요"}
              </p>
              <Link href={hasToday ? `/schedule/${schedules.find((s) => s.date === today)?.id}` : "/schedule/new"}>
                <Button className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-100 font-semibold rounded-xl w-full">
                  {hasToday ? "오늘 시간표 보기" : "지금 그리기"}
                </Button>
              </Link>
            </div>

            {/* 추천인 코드 카드 */}
            {userProfile && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700/40 rounded-2xl p-4">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">내 추천인 코드</p>
                <p className="font-mono font-bold text-2xl tracking-widest text-amber-700 dark:text-amber-300 mb-1">
                  {userProfile.referralCode}
                </p>
                <p className="text-xs text-zinc-400 mb-3">친구가 가입 시 입력하면 💰1000 지급</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={copyReferralCode}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-xs">
                    코드 복사
                  </Button>
                  <Link href="/shop" className="flex-1">
                    <Button size="sm" variant="outline"
                      className="w-full border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 rounded-xl text-xs">
                      상점
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽 메인 콘텐츠 */}
          <div className="flex-1 min-w-0 space-y-5 pb-24">
            {/* 탭 */}
            <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1 gap-1">
              {(["schedules", "groups"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    tab === t
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}>
                  {t === "schedules" ? `시간표 (${schedules.length})` : `그룹 (${groups.length})`}
                </button>
              ))}
            </div>

        {/* 시간표 목록 */}
        {tab === "schedules" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-700 dark:text-zinc-200">내 시간표</h2>
              <Link href="/schedule/new">
                <Button size="sm" variant="outline" className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  + 새로 만들기
                </Button>
              </Link>
            </div>
            {schedules.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 text-sm">아직 시간표가 없어요</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {schedules.map((s) => (
                  <Link key={s.id} href={`/schedule/${s.id}`}>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between hover:border-violet-300 dark:hover:border-zinc-600 transition-colors h-full">
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{formatDate(s.date)}</p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {s.blocks.length}개 블록 · 총 {totalHours(s.blocks).toFixed(1)}시간 채움
                        </p>
                      </div>
                      <span className="text-zinc-400 text-lg">›</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 그룹 목록 */}
        {tab === "groups" && (
          <div className="space-y-3">
            {/* 헤더 + 버튼 */}
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-700 dark:text-zinc-200">내 그룹</h2>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setGroupPanel(groupPanel === "join" ? "none" : "join")}
                  variant="outline" className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  참가하기
                </Button>
                <Button size="sm" onClick={() => setGroupPanel(groupPanel === "create" ? "none" : "create")}
                  className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs">
                  + 만들기
                </Button>
              </div>
            </div>

            {/* 인라인 만들기 폼 */}
            {groupPanel === "create" && (
              <div className="bg-white dark:bg-zinc-900 border border-violet-200 dark:border-violet-700/50 rounded-2xl p-4 space-y-3">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">새 그룹 만들기</p>
                <input
                  type="text"
                  placeholder="그룹 이름 (예: 우리 팀, 친구들)"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-400"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => { setGroupPanel("none"); setNewGroupName(""); }}
                    variant="outline" className="flex-1 border-zinc-300 dark:border-zinc-700 rounded-xl text-xs">
                    취소
                  </Button>
                  <Button size="sm" onClick={handleCreateGroup} disabled={groupLoading || !newGroupName.trim()}
                    className="flex-1 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs">
                    {groupLoading ? "만드는 중..." : "만들기"}
                  </Button>
                </div>
              </div>
            )}

            {/* 인라인 참가 폼 */}
            {groupPanel === "join" && (
              <div className="bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-700/50 rounded-2xl p-4 space-y-3">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">초대 링크로 참가</p>
                <input
                  type="text"
                  placeholder="초대 링크 또는 토큰을 붙여넣으세요"
                  value={inviteLink}
                  onChange={(e) => setInviteLink(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinGroup()}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-400"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => { setGroupPanel("none"); setInviteLink(""); }}
                    variant="outline" className="flex-1 border-zinc-300 dark:border-zinc-700 rounded-xl text-xs">
                    취소
                  </Button>
                  <Button size="sm" onClick={handleJoinGroup} disabled={groupLoading || !inviteLink.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs">
                    {groupLoading ? "참가 중..." : "참가하기"}
                  </Button>
                </div>
              </div>
            )}

            {/* 그룹 없을 때 */}
            {groups.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <p className="text-zinc-400 text-sm">아직 그룹이 없어요</p>
                <p className="text-zinc-300 dark:text-zinc-600 text-xs">새 그룹을 만들거나 초대 링크로 참가해보세요</p>
              </div>
            ) : (
              groups.map((g) => (
                <div key={g.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{g.name}</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{g.members.length}명</p>
                    </div>
                    <Link href={`/group/${g.id}`}>
                      <Button size="sm" variant="outline" className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs">보기</Button>
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.members.map((m) => (
                      <Badge key={m.user.id} variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs">
                        {m.user.name}
                      </Badge>
                    ))}
                  </div>
                  <button onClick={() => copyInviteLink(g.inviteToken)}
                    className="w-full text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl py-2 transition-colors">
                    🔗 초대 링크 복사
                  </button>
                </div>
              ))
            )}
          </div>
        )}
          </div>{/* 오른쪽 메인 끝 */}
        </div>{/* 2컬럼 끝 */}
      </div>
    </main>
  );
}
