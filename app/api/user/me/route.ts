import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true,
      cash: true, referralCode: true, badge: true, activeTheme: true,
      purchases: { select: { itemId: true, purchasedAt: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

  const { badge, activeTheme } = await req.json();

  const updated = await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(badge !== undefined ? { badge } : {}),
      ...(activeTheme !== undefined ? { activeTheme } : {}),
    },
    select: { badge: true, activeTheme: true },
  });

  return NextResponse.json(updated);
}
