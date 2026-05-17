import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* 히어로 */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-20">
        <div className="w-full max-w-3xl text-center space-y-10">
          <div className="space-y-5">
            <div className="flex justify-center">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-5xl md:text-6xl shadow-2xl">
                🕐
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Time<span className="text-violet-500">Fit</span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg md:text-xl leading-relaxed max-w-lg mx-auto">
              친한 친구들과 하루 시간표를 공유하고<br className="hidden md:block" />
              모두가 가능한 시간을 한눈에 찾아보세요
            </p>
          </div>

          {/* 피처 카드 */}
          <div className="grid grid-cols-3 gap-4 md:gap-6 text-center">
            {[
              { icon: "🎯", title: "원형 시간표", desc: "드래그로 직접 그리기" },
              { icon: "👥", title: "그룹 공유", desc: "친구들과 함께 비교" },
              { icon: "✨", title: "빈 시간 자동 계산", desc: "겹치는 여유 시간 확인" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-zinc-100 dark:bg-zinc-800/60 rounded-2xl p-5 md:p-7 border border-zinc-200 dark:border-zinc-700/50 space-y-2">
                <div className="text-3xl md:text-4xl">{icon}</div>
                <p className="font-semibold text-sm md:text-base text-zinc-700 dark:text-zinc-200">{title}</p>
                <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400">{desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup">
              <Button className="w-full sm:w-48 h-13 md:h-14 text-base md:text-lg font-semibold bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 border-0 rounded-xl text-white px-10">
                시작하기
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full sm:w-48 h-13 md:h-14 text-base md:text-lg rounded-xl border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-10">
                로그인
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
