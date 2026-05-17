import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

  const schedules = await db.schedule.findMany({
    where: { userId: session.user.id },
    include: { blocks: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(schedules);
}

export async function POST(req: NextRequest) {
  try {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { date, blocks } = body as { date?: string; blocks?: unknown[] };
  if (!date) return NextResponse.json({ error: "날짜를 입력해주세요." }, { status: 400 });

  const existing = await db.schedule.findUnique({
    where: { userId_date: { userId: session.user.id, date } },
  });

  if (existing) {
    await db.timeBlock.deleteMany({ where: { scheduleId: existing.id } });
    const updated = await db.schedule.update({
      where: { id: existing.id },
      data: {
        blocks: {
          create: (blocks ?? []).map((b: { startMin: number; endMin: number; category: string; label?: string; color?: string }) => ({
            startMin: b.startMin,
            endMin: b.endMin,
            category: b.category,
            label: b.label ?? null,
            color: b.color ?? null,
          })),
        },
      },
      include: { blocks: true },
    });
    return NextResponse.json(updated);
  }

  const schedule = await db.schedule.create({
    data: {
      userId: session.user.id,
      date,
      blocks: {
        create: (blocks ?? []).map((b: { startMin: number; endMin: number; category: string; label?: string; color?: string }) => ({
          startMin: b.startMin,
          endMin: b.endMin,
          category: b.category,
          label: b.label ?? null,
          color: b.color ?? null,
        })),
      },
    },
    include: { blocks: true },
  });

  return NextResponse.json(schedule, { status: 201 });
  } catch (e) {
    console.error("[schedules POST]", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
