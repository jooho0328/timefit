import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { REFERRAL_REWARD_NEW_USER, REFERRAL_REWARD_REFERRER } from "@/lib/shopItems";

function generateReferralCode(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9가-힣]/g, "").slice(0, 3).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return (base + rand).slice(0, 8).padEnd(6, rand);
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, referralCode } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "모든 항목을 입력해주세요." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "비밀번호는 6자 이상이어야 합니다." }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "이미 사용 중인 이메일입니다." }, { status: 409 });
    }

    // 추천인 확인
    let referrer = null;
    if (referralCode) {
      referrer = await db.user.findUnique({ where: { referralCode: referralCode.toUpperCase() } });
      if (!referrer) {
        return NextResponse.json({ error: "유효하지 않은 추천인 코드입니다." }, { status: 400 });
      }
    }

    // 추천인 코드 생성 (중복 방지)
    let myCode = generateReferralCode(name);
    while (await db.user.findUnique({ where: { referralCode: myCode } })) {
      myCode = generateReferralCode(name);
    }

    const hashed = await bcrypt.hash(password, 12);

    const newCash = referrer ? REFERRAL_REWARD_NEW_USER : 0;

    const user = await db.user.create({
      data: {
        email,
        password: hashed,
        name,
        referralCode: myCode,
        referredBy: referrer?.id ?? null,
        cash: newCash,
      },
    });

    // 추천인에게 캐시 지급
    if (referrer) {
      await db.user.update({
        where: { id: referrer.id },
        data: { cash: { increment: REFERRAL_REWARD_REFERRER } },
      });
    }

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name, cash: user.cash },
      { status: 201 }
    );
  } catch (e) {
    console.error("[register error]", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
