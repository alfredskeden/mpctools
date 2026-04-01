// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { mockWritePsd, mockGenerateCombinedMask } = vi.hoisted(() => ({
  mockWritePsd: vi.fn((_psd: any) => new ArrayBuffer(8)),
  mockGenerateCombinedMask: vi.fn(),
}));

vi.mock("ag-psd", () => ({ writePsd: mockWritePsd }));
vi.mock("@/lib/merger-utils", () => ({
  generateCombinedMask: mockGenerateCombinedMask,
}));

import { buildPsdBuffer, downloadPsd, type PsdExportParams } from "./psd-export";

const realCreateElement = document.createElement.bind(document);

const mockCtx = {
  drawImage: vi.fn(),
  putImageData: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray([100, 100, 100, 200, 50, 50, 50, 0]),
  })),
};

function makeCanvas(w = 10, h = 10) {
  return {
    width: w,
    height: h,
    getContext: vi.fn(() => mockCtx),
  } as unknown as HTMLCanvasElement;
}

function makeImage(w = 100, h = 100) {
  return { naturalWidth: w, naturalHeight: h } as HTMLImageElement;
}

const baseParams: PsdExportParams = {
  ogImage: makeImage(400, 600),
  outpaintImage: makeImage(800, 1200),
  ogPosition: { x: 50, y: 80, w: 400, h: 600 },
  canvasW: 800,
  canvasH: 1200,
  featherStrength: 40,
  irregMagnitude: 100,
  irregRadius: 0,
  irregDensity: 100,
  irregSeed: 42,
  irregBlur: 12,
};

beforeEach(() => {
  vi.clearAllMocks();

  const maskCanvas = makeCanvas(400, 600);
  mockGenerateCombinedMask.mockReturnValue(maskCanvas);

  vi.spyOn(document, "createElement").mockImplementation(
    (...args: Parameters<typeof document.createElement>) => {
      if (args[0] === "canvas") return makeCanvas();
      return realCreateElement(...args);
    },
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("buildPsdBuffer", () => {
  it("calls generateCombinedMask with correct feather params", () => {
    buildPsdBuffer(baseParams);

    expect(mockGenerateCombinedMask).toHaveBeenCalledWith(
      baseParams.ogPosition.w,
      baseParams.ogPosition.h,
      baseParams.featherStrength,
      10,
      baseParams.irregMagnitude,
      baseParams.irregRadius,
      baseParams.irregDensity,
      baseParams.irregSeed,
      baseParams.irregBlur,
    );
  });

  it("calls writePsd with correct canvas dimensions", () => {
    buildPsdBuffer(baseParams);

    expect(mockWritePsd).toHaveBeenCalledWith(
      expect.objectContaining({
        width: baseParams.canvasW,
        height: baseParams.canvasH,
      }),
    );
  });

  it("passes Artwork group with two children to writePsd", () => {
    buildPsdBuffer(baseParams);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const psd = (mockWritePsd.mock.calls as any)[0][0];
    expect(psd.children).toHaveLength(1);
    expect(psd.children[0].name).toBe("Artwork");
    expect(psd.children[0].children).toHaveLength(2);
  });

  it("positions Outpaint layer at full canvas bounds (bottom layer)", () => {
    buildPsdBuffer(baseParams);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const outpaintLayer = (mockWritePsd.mock.calls as any)[0][0].children[0].children[0];
    expect(outpaintLayer.name).toBe("Outpaint");
    expect(outpaintLayer.top).toBe(0);
    expect(outpaintLayer.left).toBe(0);
    expect(outpaintLayer.bottom).toBe(baseParams.canvasH);
    expect(outpaintLayer.right).toBe(baseParams.canvasW);
  });

  it("positions OG Image layer using ogPosition (top layer)", () => {
    buildPsdBuffer(baseParams);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ogLayer = (mockWritePsd.mock.calls as any)[0][0].children[0].children[1];
    expect(ogLayer.name).toBe("OG Image");
    expect(ogLayer.top).toBe(baseParams.ogPosition.y);
    expect(ogLayer.left).toBe(baseParams.ogPosition.x);
    expect(ogLayer.bottom).toBe(baseParams.ogPosition.y + baseParams.ogPosition.h);
    expect(ogLayer.right).toBe(baseParams.ogPosition.x + baseParams.ogPosition.w);
  });

  it("attaches mask to OG Image layer at same position", () => {
    buildPsdBuffer(baseParams);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ogLayer = (mockWritePsd.mock.calls as any)[0][0].children[0].children[1];
    expect(ogLayer.mask).toBeDefined();
    expect(ogLayer.mask.top).toBe(baseParams.ogPosition.y);
    expect(ogLayer.mask.left).toBe(baseParams.ogPosition.x);
    expect(ogLayer.mask.bottom).toBe(baseParams.ogPosition.y + baseParams.ogPosition.h);
    expect(ogLayer.mask.right).toBe(baseParams.ogPosition.x + baseParams.ogPosition.w);
  });

  it("converts alpha channel to luminance in mask canvas", () => {
    buildPsdBuffer(baseParams);

    expect(mockCtx.getImageData).toHaveBeenCalled();
    expect(mockCtx.putImageData).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.any(Uint8ClampedArray),
      }),
      0,
      0,
    );

    const putData = (mockCtx.putImageData.mock.calls[0] as unknown[])[0] as { data: Uint8ClampedArray };
    // First pixel: alpha was 200, so R=G=B=200, A=255
    expect(putData.data[0]).toBe(200);
    expect(putData.data[1]).toBe(200);
    expect(putData.data[2]).toBe(200);
    expect(putData.data[3]).toBe(255);
    // Second pixel: alpha was 0, so R=G=B=0, A=255
    expect(putData.data[4]).toBe(0);
    expect(putData.data[5]).toBe(0);
    expect(putData.data[6]).toBe(0);
    expect(putData.data[7]).toBe(255);
  });

  it("returns the ArrayBuffer from writePsd", () => {
    const result = buildPsdBuffer(baseParams);

    expect(result).toBeInstanceOf(ArrayBuffer);
  });
});

describe("downloadPsd", () => {
  it("creates a Blob with PSD mime type and triggers download", () => {
    const mockClick = vi.fn();
    const mockLink = { click: mockClick, download: "", href: "" };

    vi.spyOn(document, "createElement").mockImplementation(
      (...args: Parameters<typeof document.createElement>) => {
        if (args[0] === "a") return mockLink as unknown as HTMLAnchorElement;
        if (args[0] === "canvas") return makeCanvas();
        return realCreateElement(...args);
      },
    );

    const mockCreateObjectURL = vi.fn(() => "blob:psd-url");
    const mockRevokeObjectURL = vi.fn();
    vi.stubGlobal("URL", {
      ...globalThis.URL,
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });

    downloadPsd(baseParams, "export.psd");

    expect(mockCreateObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({ type: "image/vnd.adobe.photoshop" }),
    );
    expect(mockLink.download).toBe("export.psd");
    expect(mockLink.href).toBe("blob:psd-url");
    expect(mockClick).toHaveBeenCalledOnce();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:psd-url");
  });
});
