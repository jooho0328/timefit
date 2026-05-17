import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

  const memberships = await db.groupMember.findMany({
    where: { userId: session.user.id },
    include: {
      group: {
        include: {
          members: { include: { user: { select: { id: true, name: true } } } },
        },
      },
    },
  });

  return NextResponse.json(memberships.map((m: { group: unknown }) => m.group));
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { name } = body as { name?: string };
    if (!name?.trim()) return NextResponse.json({ error: "그룹 이름을 입력해주세요." }, { status: 400 });

    const inviteToken = randomBytes(8).toString("hex");

    const group = await db.group.create({
      data: {
        name: name.trim(),
        inviteToken,
        ownerId: session.user.id,
        members: { create: { userId: session.user.id } },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (e) {
    console.error("[groups POST]", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
