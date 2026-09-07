import sitemap from "./sitemap";

describe("sitemap", () => {
  it("includes the homepage with priority 1", () => {
    const entries = sitemap();
    const home = entries.find((e) => !new URL(e.url).pathname.replace("/", ""));
    expect(home?.priority).toBe(1);
  });

  it("includes the /design route", () => {
    const entries = sitemap();
    const paths = entries.map((e) => new URL(e.url).pathname);
    expect(paths).toContain("/design");
  });

  it("includes /prep, /outpaint, and /merger routes", () => {
    const entries = sitemap();
    const paths = entries.map((e) => new URL(e.url).pathname);
    expect(paths).toContain("/prep");
    expect(paths).toContain("/outpaint");
    expect(paths).toContain("/merger");
  });

  it("includes the /dewatermark route", () => {
    const entries = sitemap();
    const paths = entries.map((e) => new URL(e.url).pathname);
    expect(paths).toContain("/dewatermark");
  });

  it("includes the padder routes", () => {
    const entries = sitemap();
    const paths = entries.map((e) => new URL(e.url).pathname);
    expect(paths).toContain("/padder");
    expect(paths).toContain("/padder-outpaint");
  });

  it("assigns /design a higher priority than other workflow routes", () => {
    const entries = sitemap();
    const design = entries.find((e) => new URL(e.url).pathname === "/design");
    const prep = entries.find((e) => new URL(e.url).pathname === "/prep");
    expect(design!.priority).toBeGreaterThan(prep!.priority!);
  });

  it("includes a lastModified date for every entry", () => {
    const entries = sitemap();
    for (const entry of entries) {
      expect(entry.lastModified).toBeInstanceOf(Date);
    }
  });

  it("all entry URLs share the same origin", () => {
    const entries = sitemap();
    const origins = new Set(entries.map((e) => new URL(e.url).origin));
    expect(origins.size).toBe(1);
  });
});
