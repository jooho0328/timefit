import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

  const { id: groupId } = await params;
  const date = req.nextUrl.searchParams.get("date");

  const member = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: { members: { select: { userId: true } } },
  });
  if (!group) return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });

  const memberIds = group.members.map((m: { userId: string }) => m.userId);

  const schedules = await db.schedule.findMany({
    where: {
      userId: { in: memberIds },
      ...(date ? { date } : {}),
    },
    include: {
      blocks: true,
      user: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(schedules);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

  const { id: groupId } = await params;
  const { scheduleId } = await req.json();

  const member = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });

  const schedule = await db.schedule.findFirst({
    where: { id: scheduleId, userId: session.user.id },
  });
  if (!schedule) return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });

  const gs = await db.groupSchedule.upsert({
    where: { groupId_scheduleId: { groupId, scheduleId } },
    update: {},
    create: { groupId, scheduleId },
  });

  return NextResponse.json(gs, { status: 201 });
}
