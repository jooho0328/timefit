import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getItem } from "@/lib/shopItems";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

  const { itemId } = await req.json();
  const item = getItem(itemId);
  if (!item) return NextResponse.json({ error: "존재하지 않는 아이템입니다." }, { status: 404 });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "유저를 찾을 수 없습니다." }, { status: 404 });

  const alreadyOwned = await db.userPurchase.findUnique({
    where: { userId_itemId: { userId: session.user.id, itemId } },
  });
  if (alreadyOwned) return NextResponse.json({ error: "이미 보유한 아이템입니다." }, { status: 409 });

  if (user.cash < item.price) {
    return NextResponse.json({ error: `캐시가 부족합니다. (보유: ${user.cash} / 필요: ${item.price})` }, { status: 402 });
  }

  const [purchase] = await db.$transaction([
    db.userPurchase.create({ data: { userId: session.user.id, itemId } }),
    db.user.update({
      where: { id: session.user.id },
      data: { cash: { decrement: item.price } },
    }),
  ]);

  return NextResponse.json({ success: true, purchase, remainingCash: user.cash - item.price }, { status: 201 });
}
