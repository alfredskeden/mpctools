import { render, screen } from "@testing-library/react";

import {
  DewatermarkPreviewCell,
  fitDisplaySize,
} from "@/components/dewatermark/DewatermarkPreviewCell";

beforeEach(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const baseProps = {
  imageSrc: "blob:test",
  imageWidth: 200,
  imageHeight: 100,
  resolvedCorner: "auto" as const,
  maskExpand: 4,
  feather: 0.5,
};

describe("fitDisplaySize", () => {
  it("returns 0×0 when any argument is 0 or negative-coerced", () => {
    expect(fitDisplaySize(0, 100, 100, 100)).toEqual({ w: 0, h: 0 });
    expect(fitDisplaySize(100, 0, 100, 100)).toEqual({ w: 0, h: 0 });
    expect(fitDisplaySize(100, 100, 0, 100)).toEqual({ w: 0, h: 0 });
    expect(fitDisplaySize(100, 100, 100, 0)).toEqual({ w: 0, h: 0 });
  });

  it("constrains by container width when image aspect is wide", () => {
    // 200×100 image into 400×400 container: width-bound to 400, height to 200
    expect(fitDisplaySize(400, 400, 200, 100)).toEqual({ w: 400, h: 200 });
  });

  it("constrains by container height when image aspect is tall", () => {
    // 100×200 image into 400×100 container: height-bound to 100, width to 50 → floored to 50
    expect(fitDisplaySize(400, 100, 100, 200)).toEqual({ w: 50, h: 100 });
  });

  it("clamps to a 20px minimum", () => {
    expect(fitDisplaySize(10, 10, 200, 100)).toEqual({ w: 20, h: 20 });
  });
});

describe("DewatermarkPreviewCell", () => {
  it("renders the detection ring on the original variant", () => {
    // Given/When
    render(
      <DewatermarkPreviewCell
        {...baseProps}
        label="Original"
        variant="original"
        testId="cell-original"
      />,
    );

    // Then
    expect(screen.queryByTestId("detection-ring")).not.toBeNull();
    expect(screen.queryByTestId("repair-mask")).toBeNull();
    expect(screen.queryByTestId("render-overlay")).toBeNull();
  });

  it("renders the repair mask and render overlay on the result variant", () => {
    // Given/When
    render(
      <DewatermarkPreviewCell
        {...baseProps}
        label="Result"
        variant="result"
        isProcessing
        detectionMeta={{ corner: "br", confidence: 0.92 }}
        testId="cell-result"
      />,
    );

    // Then
    expect(screen.queryByTestId("repair-mask")).not.toBeNull();
    expect(screen.queryByTestId("detection-ring")).toBeNull();
    expect(
      screen.getByTestId("render-overlay").getAttribute("data-active"),
    ).toBe("true");
    expect(screen.getByTestId("preview-meta-corner").textContent).toContain(
      "BR",
    );
    expect(
      screen.getByTestId("preview-meta-confidence").textContent,
    ).toContain("0.92");
  });

  it("hides the render overlay when not processing", () => {
    // Given/When
    render(
      <DewatermarkPreviewCell
        {...baseProps}
        label="Result"
        variant="result"
        isProcessing={false}
        detectionMeta={{ corner: "tl", confidence: 0.5 }}
      />,
    );

    // Then
    expect(
      screen.getByTestId("render-overlay").getAttribute("data-active"),
    ).toBe("false");
  });

  it("falls back to em-dash for empty corner in the meta strip", () => {
    // Given/When
    render(
      <DewatermarkPreviewCell
        {...baseProps}
        label="Result"
        variant="result"
        detectionMeta={{ corner: "", confidence: 0.74 }}
      />,
    );

    // Then
    expect(screen.getByTestId("preview-meta-corner").textContent).toContain(
      "—",
    );
  });

  it.each(["tl", "tr", "bl", "br"] as const)(
    "positions the detection ring for corner %s",
    (corner) => {
      // Given/When
      render(
        <DewatermarkPreviewCell
          {...baseProps}
          resolvedCorner={corner}
          label="Original"
          variant="original"
        />,
      );

      // Then — every corner branch produces a positioned ring without throwing
      expect(screen.queryByTestId("detection-ring")).not.toBeNull();
    },
  );

  it("does not render the image element when imageSrc is null", () => {
    // Given/When
    render(
      <DewatermarkPreviewCell
        {...baseProps}
        imageSrc={null}
        label="Original"
        variant="original"
      />,
    );

    // Then
    expect(screen.queryByRole("img")).toBeNull();
  });
});
