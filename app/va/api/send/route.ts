import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "";

  const body = await request.text();

  const country = request.headers.get("cf-ipcountry");
  const city = request.headers.get("cf-ipcity");
  const region = request.headers.get("cf-ipregion");

  const forwardedHeaders: Record<string, string> = {
    "Content-Type": request.headers.get("content-type") ?? "application/json",
    "User-Agent": request.headers.get("user-agent") ?? "",
    "X-Forwarded-For": ip,
  };

  if (country) forwardedHeaders["X-Vercel-IP-Country"] = country;
  if (city) forwardedHeaders["X-Vercel-IP-City"] = city;
  if (region) forwardedHeaders["X-Vercel-IP-Country-Region"] = region;

  const response = await fetch("https://cloud.umami.is/api/send", {
    method: "POST",
    headers: forwardedHeaders,
    body,
  });

  const text = await response.text();
  return new NextResponse(text, { status: response.status });
}
