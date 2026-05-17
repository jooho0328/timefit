import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

  const { token } = await params;

  const group = await db.group.findUnique({ where: { inviteToken: token } });
  if (!group) return NextResponse.json({ error: "유효하지 않은 초대 링크입니다." }, { status: 404 });

  await db.groupMember.upsert({
    where: { groupId_userId: { groupId: group.id, userId: session.user.id } },
    update: {},
    create: { groupId: group.id, userId: session.user.id },
  });

  return NextResponse.json({ groupId: group.id });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const group = await db.group.findUnique({
    where: { inviteToken: token },
    select: { id: true, name: true },
  });
  if (!group) return NextResponse.json({ error: "유효하지 않은 초대 링크입니다." }, { status: 404 });
  return NextResponse.json(group);
}
