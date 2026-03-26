import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeRequest(
  body: string,
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest("http://localhost/va/api/send", {
    method: "POST",
    body,
    headers: { "content-type": "application/json", ...headers },
  });
}

function mockUmamiResponse(status: number, body: string) {
  mockFetch.mockResolvedValueOnce({
    status,
    text: async () => body,
  });
}

describe("POST /va/api/send", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("prefers cf-connecting-ip over all other IP headers", async () => {
    // Given
    mockUmamiResponse(200, "ok");
    const request = makeRequest("{}", {
      "cf-connecting-ip": "9.9.9.9",
      "x-forwarded-for": "1.2.3.4, 10.0.0.1",
      "x-real-ip": "5.6.7.8",
    });

    // When
    await POST(request);

    // Then
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(options.headers["X-Forwarded-For"]).toBe("9.9.9.9");
  });

  it("forwards x-forwarded-for (first IP from comma-separated list) to Umami", async () => {
    // Given
    mockUmamiResponse(200, "ok");
    const request = makeRequest("{}", {
      "x-forwarded-for": "1.2.3.4, 10.0.0.1",
    });

    // When
    await POST(request);

    // Then
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(options.headers["X-Forwarded-For"]).toBe("1.2.3.4");
  });

  it("uses empty string when no ip header is present", async () => {
    // Given
    mockUmamiResponse(200, "ok");
    const request = makeRequest("{}");

    // When
    await POST(request);

    // Then
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(options.headers["X-Forwarded-For"]).toBe("");
  });

  it("passes through Umami response status and body", async () => {
    // Given
    mockUmamiResponse(201, "created");
    const request = makeRequest("{}");

    // When
    const response = await POST(request);

    // Then
    expect(response.status).toBe(201);
    expect(await response.text()).toBe("created");
  });

  it("forwards content-type and user-agent headers to Umami", async () => {
    // Given
    mockUmamiResponse(200, "ok");
    const request = makeRequest("{}", {
      "content-type": "application/json",
      "user-agent": "Mozilla/5.0",
    });

    // When
    await POST(request);

    // Then
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.headers["User-Agent"]).toBe("Mozilla/5.0");
  });

  it("forwards Cloudflare location headers as x-vercel-ip headers when present", async () => {
    // Given
    mockUmamiResponse(200, "ok");
    const request = makeRequest("{}", {
      "cf-ipcountry": "CN",
      "cf-ipcity": "Shanghai",
      "cf-ipregion": "SH",
    });

    // When
    await POST(request);

    // Then
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(options.headers["X-Vercel-IP-Country"]).toBe("CN");
    expect(options.headers["X-Vercel-IP-City"]).toBe("Shanghai");
    expect(options.headers["X-Vercel-IP-Country-Region"]).toBe("SH");
  });

  it("omits x-vercel-ip location headers when Cloudflare headers are absent", async () => {
    // Given
    mockUmamiResponse(200, "ok");
    const request = makeRequest("{}");

    // When
    await POST(request);

    // Then
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(options.headers["X-Vercel-IP-Country"]).toBeUndefined();
    expect(options.headers["X-Vercel-IP-City"]).toBeUndefined();
    expect(options.headers["X-Vercel-IP-Country-Region"]).toBeUndefined();
  });

  it("sends request body to Umami", async () => {
    // Given
    mockUmamiResponse(200, "ok");
    const payload = JSON.stringify({ type: "pageview" });
    const request = makeRequest(payload);

    // When
    await POST(request);

    // Then
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://cloud.umami.is/api/send");
    expect(options.body).toBe(payload);
  });
});
