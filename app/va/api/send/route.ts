import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "";

  const body = await request.text();

  const response = await fetch("https://cloud.umami.is/api/send", {
    method: "POST",
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
      "User-Agent": request.headers.get("user-agent") ?? "",
      "X-Forwarded-For": ip,
    },
    body,
  });

  const text = await response.text();
  return new NextResponse(text, { status: response.status });
}
