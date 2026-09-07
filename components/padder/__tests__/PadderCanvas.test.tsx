import { render, screen } from "@testing-library/react";
import { PadderCanvas } from "../PadderCanvas";
import { computePadLayout, PAD_TARGETS } from "@/lib/padder-math";
import type { PadLayout } from "@/lib/padder-math";

const layoutFor = (target = PAD_TARGETS[0]): PadLayout =>
  computePadLayout({ width: 745, height: 1040 }, target)!;

const makeImage = () => {
  const image = document.createElement("canvas");
  image.width = 745;
  image.height = 1040;
  return image as unknown as HTMLImageElement;
};

describe("PadderCanvas", () => {
  it("renders no canvas before an image is uploaded", () => {
    // Given / When
    render(<PadderCanvas image={null} layout={null} />);

    // Then
    expect(screen.queryByTestId("padder-canvas")).toBeNull();
  });

  it("renders no canvas when no layout could be computed", () => {
    // Given / When
    render(<PadderCanvas image={makeImage()} layout={null} />);

    // Then
    expect(screen.queryByTestId("padder-canvas")).toBeNull();
  });

  it("sizes the canvas bitmap to the layout's full pixel size", () => {
    // Given
    const layout = layoutFor();

    // When
    render(<PadderCanvas image={makeImage()} layout={layout} />);

    // Then
    const canvas = screen.getByTestId("padder-canvas") as HTMLCanvasElement;
    expect(canvas.width).toBe(816);
    expect(canvas.height).toBe(1110);
  });

  it("resizes the canvas bitmap when the target changes", () => {
    // Given
    const { rerender } = render(
      <PadderCanvas image={makeImage()} layout={layoutFor()} />,
    );

    // When
    rerender(
      <PadderCanvas image={makeImage()} layout={layoutFor(PAD_TARGETS[1])} />,
    );

    // Then
    const canvas = screen.getByTestId("padder-canvas") as HTMLCanvasElement;
    expect(canvas.height).toBe(1013);
  });
});
