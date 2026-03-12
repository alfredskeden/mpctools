import { render, act } from "@testing-library/react";
import { GhostCard } from "./ghost-card";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

describe("GhostCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with aria-hidden", () => {
    const { container } = render(
      <GhostCard side="left" images={["/img1.webp", "/img2.webp"]} />,
    );

    expect(
      container.querySelector("[aria-hidden='true']"),
    ).toBeDefined();
  });

  it("applies left positioning for left side", () => {
    const { container } = render(
      <GhostCard side="left" images={["/img1.webp", "/img2.webp"]} />,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("-left-10");
  });

  it("applies right positioning for right side", () => {
    const { container } = render(
      <GhostCard side="right" images={["/img1.webp", "/img2.webp"]} />,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("-right-8");
  });

  it("renders two images", () => {
    const { container } = render(
      <GhostCard side="left" images={["/img1.webp", "/img2.webp"]} />,
    );

    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(2);
  });

  it("shows second image after display duration", () => {
    const { container } = render(
      <GhostCard
        side="left"
        images={["/img1.webp", "/img2.webp"]}
        displayDuration={1000}
        fadeDuration={500}
      />,
    );

    const images = container.querySelectorAll("img");
    expect(images[1].style.opacity).toBe("0");

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(images[1].style.opacity).toBe("1");
  });

  it("hides second image after full cycle", () => {
    const { container } = render(
      <GhostCard
        side="left"
        images={["/img1.webp", "/img2.webp"]}
        displayDuration={1000}
        fadeDuration={500}
      />,
    );

    const images = container.querySelectorAll("img");

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(images[1].style.opacity).toBe("1");

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(images[1].style.opacity).toBe("0");
  });

  it("applies transition only when showing second image", () => {
    const { container } = render(
      <GhostCard
        side="left"
        images={["/img1.webp", "/img2.webp"]}
        displayDuration={1000}
        fadeDuration={500}
      />,
    );

    const images = container.querySelectorAll("img");
    expect(images[1].style.transition).toBe("none");

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(images[1].style.transition).toContain("opacity");
  });
});
