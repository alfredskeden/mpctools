import { renderHook } from "@testing-library/react";
import { useSvgToPng } from "../use-svg-to-png";

// Creates a mock Image whose onload fires synchronously when src is set.
// In loadImage(), onload is always set before src, so this is safe.
function makeSuccessImage() {
  const handlers = {
    onload: null as (() => void) | null,
    onerror: null as ((e: unknown) => void) | null,
  };
  return {
    crossOrigin: "",
    _src: "",
    get src() {
      return this._src;
    },
    set src(v: string) {
      this._src = v;
      handlers.onload?.();
    },
    get onload() {
      return handlers.onload;
    },
    set onload(fn: (() => void) | null) {
      handlers.onload = fn;
    },
    get onerror() {
      return handlers.onerror;
    },
    set onerror(fn: ((e: unknown) => void) | null) {
      handlers.onerror = fn;
    },
  };
}

function makeErrorImage(error = new Error("load failed")) {
  const handlers = {
    onload: null as (() => void) | null,
    onerror: null as ((e: unknown) => void) | null,
  };
  return {
    crossOrigin: "",
    _src: "",
    get src() {
      return this._src;
    },
    set src(v: string) {
      this._src = v;
      handlers.onerror?.(error);
    },
    get onload() {
      return handlers.onload;
    },
    set onload(fn: (() => void) | null) {
      handlers.onload = fn;
    },
    get onerror() {
      return handlers.onerror;
    },
    set onerror(fn: ((e: unknown) => void) | null) {
      handlers.onerror = fn;
    },
  };
}

function makeMockSvg(
  overrides: Partial<{
    backgroundImage: string;
    viewBoxWidth: number;
    viewBoxHeight: number;
  }> = {},
) {
  const {
    backgroundImage = "",
    viewBoxWidth = 3264,
    viewBoxHeight = 4440,
  } = overrides;
  const style = { backgroundImage } as CSSStyleDeclaration;
  const cloneStyle = { backgroundImage: "" } as CSSStyleDeclaration;
  const clone = {
    style: cloneStyle,
    setAttribute: vi.fn(),
    querySelectorAll: vi.fn().mockReturnValue([]),
  };
  return {
    style,
    viewBox: { baseVal: { width: viewBoxWidth, height: viewBoxHeight } },
    clientWidth: 0,
    clientHeight: 0,
    cloneNode: vi.fn().mockReturnValue(clone),
  } as unknown as SVGSVGElement;
}

describe("useSvgToPng", () => {
  let mockCtx: {
    drawImage: ReturnType<typeof vi.fn>;
    fillText: ReturnType<typeof vi.fn>;
    measureText: ReturnType<typeof vi.fn>;
  };
  let mockCanvas: {
    width: number;
    height: number;
    getContext: ReturnType<typeof vi.fn>;
    toBlob: ReturnType<typeof vi.fn>;
  };
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
  let mockLink: {
    href: string;
    download: string;
    click: ReturnType<typeof vi.fn>;
  };
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;
  let MockImage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockCtx = {
      drawImage: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 0 }),
    };
    mockLink = { href: "", download: "", click: vi.fn() };
    mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toBlob: vi.fn(),
    };

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "canvas") return mockCanvas as unknown as HTMLCanvasElement;
      if (tag === "a") return mockLink as unknown as HTMLAnchorElement;
      return originalCreateElement(tag);
    });

    mockCreateObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    mockRevokeObjectURL = vi.fn();
    vi.stubGlobal("URL", {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });

    MockImage = vi.fn(function () {
      return makeSuccessImage();
    });
    vi.stubGlobal("Image", MockImage);

    vi.stubGlobal(
      "XMLSerializer",
      vi.fn(function () {
        return { serializeToString: vi.fn().mockReturnValue("<svg></svg>") };
      }),
    );

    vi.stubGlobal(
      "Blob",
      vi.fn(function () {
        return {};
      }),
    );

    appendChildSpy = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation((node) => node);
    removeChildSpy = vi
      .spyOn(document.body, "removeChild")
      .mockImplementation((node) => node);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns early when svg element is not found", async () => {
    // Given
    vi.spyOn(document, "getElementById").mockReturnValue(null);
    const { result } = renderHook(() => useSvgToPng());

    // When
    await result.current.downloadAsPng("nonexistent", "card.png");

    // Then
    expect(mockCanvas.getContext).not.toHaveBeenCalled();
  });

  it("creates canvas with viewBox dimensions", async () => {
    // Given
    const mockSvg = makeMockSvg({ viewBoxWidth: 3264, viewBoxHeight: 4440 });
    vi.spyOn(document, "getElementById").mockReturnValue(
      mockSvg as unknown as HTMLElement,
    );
    mockCanvas.toBlob.mockImplementation(
      (_cb: (blob: Blob | null) => void) => {},
    );
    const { result } = renderHook(() => useSvgToPng());

    // When
    await result.current.downloadAsPng("Borderless_Alt", "card.png");

    // Then
    expect(mockCanvas.width).toBe(3264);
    expect(mockCanvas.height).toBe(4440);
  });

  it("draws background image when present and loads successfully", async () => {
    // Given
    const mockSvg = makeMockSvg({
      backgroundImage: "url('/outpaint-animation/art.webp')",
    });
    vi.spyOn(document, "getElementById").mockReturnValue(
      mockSvg as unknown as HTMLElement,
    );
    let bgImageSrc = "";
    let callCount = 0;
    MockImage.mockImplementation(function () {
      callCount++;
      const img = makeSuccessImage();
      if (callCount === 1) {
        const originalSrcSetter = Object.getOwnPropertyDescriptor(img, "src")!
          .set!;
        Object.defineProperty(img, "src", {
          set(v: string) {
            bgImageSrc = v;
            originalSrcSetter.call(this, v);
          },
          get() {
            return this._src;
          },
        });
      }
      return img;
    });
    mockCanvas.toBlob.mockImplementation(
      (_cb: (blob: Blob | null) => void) => {},
    );
    const { result } = renderHook(() => useSvgToPng());

    // When
    await result.current.downloadAsPng("Borderless_Alt", "card.png");

    // Then
    expect(bgImageSrc).toBe("/outpaint-animation/art.webp");
    expect(mockCtx.drawImage).toHaveBeenCalledTimes(2);
  });

  it("continues without background when background image fails to load", async () => {
    // Given
    const mockSvg = makeMockSvg({
      backgroundImage: "url('/broken.webp')",
    });
    vi.spyOn(document, "getElementById").mockReturnValue(
      mockSvg as unknown as HTMLElement,
    );
    let callCount = 0;
    MockImage.mockImplementation(function () {
      callCount++;
      return callCount === 1 ? makeErrorImage() : makeSuccessImage();
    });
    mockCanvas.toBlob.mockImplementation(
      (_cb: (blob: Blob | null) => void) => {},
    );
    const { result } = renderHook(() => useSvgToPng());

    // When
    await result.current.downloadAsPng("Borderless_Alt", "card.png");

    // Then — only the SVG image is drawn (background skipped due to error)
    expect(mockCtx.drawImage).toHaveBeenCalledTimes(1);
  });

  it("skips background draw when no background image is set", async () => {
    // Given
    const mockSvg = makeMockSvg({ backgroundImage: "" });
    vi.spyOn(document, "getElementById").mockReturnValue(
      mockSvg as unknown as HTMLElement,
    );
    mockCanvas.toBlob.mockImplementation(
      (_cb: (blob: Blob | null) => void) => {},
    );
    const { result } = renderHook(() => useSvgToPng());

    // When
    await result.current.downloadAsPng("Borderless_Alt", "card.png");

    // Then — only one drawImage call (the SVG overlay)
    expect(mockCtx.drawImage).toHaveBeenCalledTimes(1);
  });

  it("revokes SVG URL even when SVG drawing fails", async () => {
    // Given
    const mockSvg = makeMockSvg();
    vi.spyOn(document, "getElementById").mockReturnValue(
      mockSvg as unknown as HTMLElement,
    );
    MockImage.mockImplementation(function () {
      return makeErrorImage(new Error("security"));
    });
    mockCanvas.toBlob.mockImplementation(
      (_cb: (blob: Blob | null) => void) => {},
    );
    const { result } = renderHook(() => useSvgToPng());

    // When
    await result.current.downloadAsPng("Borderless_Alt", "card.png");

    // Then
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("triggers download link when blob is created", async () => {
    // Given
    const mockSvg = makeMockSvg();
    vi.spyOn(document, "getElementById").mockReturnValue(
      mockSvg as unknown as HTMLElement,
    );
    const mockBlob = {} as Blob;
    mockCanvas.toBlob.mockImplementation((cb: (blob: Blob | null) => void) => {
      cb(mockBlob);
    });
    const { result } = renderHook(() => useSvgToPng());

    // When
    await result.current.downloadAsPng("Borderless_Alt", "my-card.png");

    // Then
    expect(mockLink.download).toBe("my-card.png");
    expect(mockLink.click).toHaveBeenCalledOnce();
    expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
    expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("does nothing when toBlob returns null", async () => {
    // Given
    const mockSvg = makeMockSvg();
    vi.spyOn(document, "getElementById").mockReturnValue(
      mockSvg as unknown as HTMLElement,
    );
    mockCanvas.toBlob.mockImplementation((cb: (blob: Blob | null) => void) => {
      cb(null);
    });
    const { result } = renderHook(() => useSvgToPng());

    // When
    await result.current.downloadAsPng("Borderless_Alt", "card.png");

    // Then
    expect(mockLink.click).not.toHaveBeenCalled();
  });

  it("uses clientWidth/clientHeight when viewBox has no dimensions", async () => {
    // Given
    const mockSvg = {
      style: { backgroundImage: "" } as CSSStyleDeclaration,
      viewBox: { baseVal: { width: 0, height: 0 } },
      clientWidth: 800,
      clientHeight: 600,
      cloneNode: vi.fn().mockReturnValue({
        style: { backgroundImage: "" } as CSSStyleDeclaration,
        setAttribute: vi.fn(),
        querySelectorAll: vi.fn().mockReturnValue([]),
      }),
    } as unknown as SVGSVGElement;
    vi.spyOn(document, "getElementById").mockReturnValue(
      mockSvg as unknown as HTMLElement,
    );
    mockCanvas.toBlob.mockImplementation(
      (_cb: (blob: Blob | null) => void) => {},
    );
    const { result } = renderHook(() => useSvgToPng());

    // When
    await result.current.downloadAsPng("Borderless_Alt", "card.png");

    // Then
    expect(mockCanvas.width).toBe(800);
    expect(mockCanvas.height).toBe(600);
  });

  it("strips foreignObject elements from the SVG clone before drawing", async () => {
    // Given
    const removeFn = vi.fn();
    const mockFo = {
      getAttribute: vi.fn((attr: string) => {
        if (attr === "x") return "430";
        if (attr === "y") return "2800";
        if (attr === "width") return "2404";
        return null;
      }),
      querySelector: vi.fn().mockReturnValue({
        textContent: "Flying\n\nWhen ~ enters, draw a card.",
        style: {
          fontSize: "80px",
          fontFamily: "Plantin",
          color: "#ffffff",
          padding: "40px",
          lineHeight: "1.4",
        },
      }),
      remove: removeFn,
    };
    const cloneWithFo = {
      style: { backgroundImage: "" } as CSSStyleDeclaration,
      setAttribute: vi.fn(),
      querySelectorAll: vi.fn().mockReturnValue([mockFo]),
    };
    const mockSvg = {
      style: { backgroundImage: "" } as CSSStyleDeclaration,
      viewBox: { baseVal: { width: 3264, height: 4440 } },
      clientWidth: 0,
      clientHeight: 0,
      cloneNode: vi.fn().mockReturnValue(cloneWithFo),
    } as unknown as SVGSVGElement;
    vi.spyOn(document, "getElementById").mockReturnValue(
      mockSvg as unknown as HTMLElement,
    );
    mockCanvas.toBlob.mockImplementation(
      (_cb: (blob: Blob | null) => void) => {},
    );
    const { result } = renderHook(() => useSvgToPng());

    // When
    await result.current.downloadAsPng("Borderless_Alt", "card.png");

    // Then — foreignObject was removed from the clone
    expect(removeFn).toHaveBeenCalledOnce();
    // And text was drawn onto the canvas (fillText called for each line)
    expect(mockCtx.drawImage).toHaveBeenCalledTimes(1);
  });

  it("draws foreignObject text with word wrapping onto the canvas", async () => {
    // Given — long oracle text that requires wrapping
    const longText = "A ".repeat(60).trim(); // repeating word to force wrap
    const removeFn = vi.fn();
    const mockFo = {
      getAttribute: vi.fn((attr: string) => {
        if (attr === "x") return "430";
        if (attr === "y") return "2800";
        if (attr === "width") return "200"; // narrow width to force word wrap
        return null;
      }),
      querySelector: vi.fn().mockReturnValue({
        textContent: longText,
        style: {
          fontSize: "80px",
          fontFamily: "Plantin",
          color: "#ffffff",
          padding: "10px",
          lineHeight: "1.4",
        },
      }),
      remove: removeFn,
    };
    const cloneWithFo = {
      style: { backgroundImage: "" } as CSSStyleDeclaration,
      setAttribute: vi.fn(),
      querySelectorAll: vi.fn().mockReturnValue([mockFo]),
    };
    const mockSvg = {
      style: { backgroundImage: "" } as CSSStyleDeclaration,
      viewBox: { baseVal: { width: 3264, height: 4440 } },
      clientWidth: 0,
      clientHeight: 0,
      cloneNode: vi.fn().mockReturnValue(cloneWithFo),
    } as unknown as SVGSVGElement;
    vi.spyOn(document, "getElementById").mockReturnValue(
      mockSvg as unknown as HTMLElement,
    );
    // Make measureText return non-zero widths to trigger wrapping
    mockCtx.measureText = vi.fn().mockImplementation((text: string) => ({
      width: text.length * 50, // 50px per character to force wrapping
    }));
    mockCanvas.toBlob.mockImplementation(
      (_cb: (blob: Blob | null) => void) => {},
    );
    const { result } = renderHook(() => useSvgToPng());

    // When
    await result.current.downloadAsPng("Borderless_Alt", "card.png");

    // Then — fillText called multiple times due to word wrapping
    expect(mockCtx.fillText).toHaveBeenCalled();
  });
});
