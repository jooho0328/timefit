import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const schedule = await db.schedule.findFirst({
    where: { id, userId: session.user.id },
    include: { blocks: true },
  });

  if (!schedule) return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(schedule);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const schedule = await db.schedule.findFirst({ where: { id, userId: session.user.id } });
  if (!schedule) return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });

  await db.schedule.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
