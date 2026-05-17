"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SHOP_ITEMS, type ShopItem } from "@/lib/shopItems";
import { apiFetch } from "@/lib/fetchJson";

interface UserProfile {
  id: string;
  name: string;
  cash: number;
  badge: string | null;
  activeTheme: string | null;
  purchases: { itemId: string }[];
}

export default function ShopPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [equipping, setEquipping] = useState<string | null>(null);
  const [tab, setTab] = useState<"badge" | "circle_theme">("circle_theme");

  const loadProfile = async () => {
    const res = await fetch("/api/user/me");
    if (res.ok) setProfile(await res.json());
    setLoading(false);
  };

  useEffect(() => { loadProfile(); }, []);

  const ownedIds = new Set(profile?.purchases.map((p) => p.itemId) ?? []);

  const handlePurchase = async (item: ShopItem) => {
    setPurchasing(item.id);
    try {
      const result = await apiFetch<{ remainingCash: number }>("/api/shop/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });
      if (!result.ok) { toast.error(result.error); return; }
      toast.success(`${item.name} 구매 완료! 잔여 캐시: ${result.data.remainingCash}`);
      await loadProfile();
    } finally {
      setPurchasing(null);
    }
  };

  const handleEquip = async (item: ShopItem) => {
    setEquipping(item.id);
    try {
      const isEquipped =
        item.type === "badge" ? profile?.badge === item.id : profile?.activeTheme === item.id;

      const body =
        item.type === "badge"
          ? { badge: isEquipped ? null : item.id }
          : { activeTheme: isEquipped ? null : item.id };

      const result = await apiFetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!result.ok) { toast.error(result.error); return; }
      toast.success(isEquipped ? "해제했어요" : `${item.name} 장착!`);
      await loadProfile();
    } finally {
      setEquipping(null);
    }
  };

  const filteredItems = SHOP_ITEMS.filter((i) => i.type === tab);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-400">불러오는 중...</div>
  );

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">←</button>
        <h1 className="font-bold flex-1 text-zinc-900 dark:text-white">상점</h1>
        <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/40 px-3 py-1.5 rounded-xl">
          <span className="text-amber-600 dark:text-amber-400 text-sm font-bold">💰</span>
          <span className="text-amber-700 dark:text-amber-300 font-bold text-sm">{profile?.cash ?? 0}</span>
        </div>
      </header>

      <div className="px-4 md:px-8 pt-4 space-y-4 max-w-5xl mx-auto">
        {/* 현재 장착 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="text-3xl">{profile?.badge ?? "👤"}</div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-white text-sm">{profile?.name}</p>
            <p className="text-xs text-zinc-400">
              {profile?.badge ? `뱃지: ${profile.badge}` : "뱃지 없음"} ·{" "}
              {profile?.activeTheme
                ? `테마: ${SHOP_ITEMS.find((i) => i.id === profile.activeTheme)?.name ?? profile.activeTheme}`
                : "기본 테마"}
            </p>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1 gap-1">
          {(["circle_theme", "badge"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}>
              {t === "circle_theme" ? "🎨 원형 테마" : "🏅 뱃지"}
            </button>
          ))}
        </div>

        {/* 아이템 목록 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {filteredItems.map((item) => {
            const owned = ownedIds.has(item.id);
            const equipped =
              item.type === "badge" ? profile?.badge === item.id : profile?.activeTheme === item.id;

            return (
              <div key={item.id}
                className={`bg-white dark:bg-zinc-900 border rounded-2xl p-4 space-y-3 transition-all ${
                  equipped
                    ? "border-violet-400 dark:border-violet-500 ring-1 ring-violet-400"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}>
                {/* 미리보기 */}
                <div className="flex justify-center items-center h-16">
                  {item.type === "badge" ? (
                    <span className="text-5xl">{item.preview}</span>
                  ) : (
                    <div className="w-16 h-16 rounded-full border-4 border-zinc-200 dark:border-zinc-700"
                      style={{ background: `radial-gradient(circle, ${item.preview}88 0%, ${item.preview} 100%)` }} />
                  )}
                </div>

                <div>
                  <p className="font-semibold text-sm text-zinc-900 dark:text-white">{item.name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{item.description}</p>
                </div>

                {equipped && (
                  <Badge className="bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 border-0 text-xs">
                    장착 중
                  </Badge>
                )}

                {owned ? (
                  <Button
                    size="sm"
                    onClick={() => handleEquip(item)}
                    disabled={equipping === item.id}
                    className={`w-full rounded-xl text-xs ${
                      equipped
                        ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                        : "bg-violet-600 hover:bg-violet-500 text-white"
                    }`}>
                    {equipping === item.id ? "..." : equipped ? "해제" : "장착"}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handlePurchase(item)}
                    disabled={purchasing === item.id || (profile?.cash ?? 0) < item.price}
                    className="w-full rounded-xl text-xs bg-amber-500 hover:bg-amber-400 text-black font-semibold disabled:opacity-50">
                    {purchasing === item.id ? "..." : `💰 ${item.price}`}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
