"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { apiFetch } from "@/lib/fetchJson";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", referralCode: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result0 = await apiFetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, referralCode: form.referralCode || undefined }),
      });
      if (!result0.ok) { toast.error(result0.error); return; }

      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.ok) router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-white dark:bg-zinc-950">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">회원가입</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">TimeFit에 오신 걸 환영해요 👋</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input id="name" placeholder="홍길동" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 h-12 rounded-xl" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" type="email" placeholder="hello@example.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 h-12 rounded-xl" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" type="password" placeholder="6자 이상" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 h-12 rounded-xl" required minLength={6} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="referralCode">
              추천인 코드
              <span className="ml-2 text-xs text-amber-500 dark:text-amber-400 font-normal">
                입력 시 500 캐시 지급 🎁
              </span>
            </Label>
            <Input id="referralCode" placeholder="추천인 코드 (선택)" value={form.referralCode}
              onChange={(e) => setForm({ ...form, referralCode: e.target.value.toUpperCase() })}
              className="bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 h-12 rounded-xl tracking-widest font-mono" />
          </div>
          <Button type="submit" disabled={loading}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 border-0 rounded-xl mt-2 text-white">
            {loading ? "처리 중..." : "가입하기"}
          </Button>
        </form>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          이미 계정이 있으신가요?{" "}
          <Link href="/auth/login" className="text-violet-500 dark:text-violet-400 hover:underline">로그인</Link>
        </p>
      </div>
    </main>
  );
}
