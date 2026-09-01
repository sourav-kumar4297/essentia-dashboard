import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    allowTestLogin: process.env.ALLOW_TEST_LOGIN !== "false",
  });
}
