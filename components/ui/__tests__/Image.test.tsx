import { render, screen } from "@testing-library/react";
import { Image } from "../Image";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

describe("Image", () => {
  it("renders an img element", () => {
    // Given / When
    render(<Image src="/test.webp" alt="test image" width={100} height={100} />);

    // Then
    expect(screen.getByAltText("test image")).toBeDefined();
  });

  it("forwards src to the underlying image", () => {
    // Given / When
    render(<Image src="/test.webp" alt="test image" width={100} height={100} />);

    // Then
    const img = screen.getByAltText("test image") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("/test.webp");
  });

  it("forwards all props to the underlying image", () => {
    // Given / When
    render(
      <Image
        src="/test.webp"
        alt="test image"
        width={100}
        height={100}
        priority
        className="object-cover"
      />,
    );

    // Then
    const img = screen.getByAltText("test image") as HTMLImageElement;
    expect(img.className).toContain("object-cover");
  });
});
