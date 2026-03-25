import { render, act } from "@testing-library/react";
import { GhostCard } from "../GhostCard";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
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

    expect(container.querySelector("[aria-hidden='true']")).toBeDefined();
  });

  it("applies left side attribute for left side", () => {
    const { container } = render(
      <GhostCard side="left" images={["/img1.webp", "/img2.webp"]} />,
    );

    const wrapper = container.querySelector("[data-side='left']");
    expect(wrapper).not.toBeNull();
  });

  it("applies right side attribute for right side", () => {
    const { container } = render(
      <GhostCard side="right" images={["/img1.webp", "/img2.webp"]} />,
    );

    const wrapper = container.querySelector("[data-side='right']");
    expect(wrapper).not.toBeNull();
  });

  it("renders two images when given two", () => {
    const { container } = render(
      <GhostCard side="left" images={["/img1.webp", "/img2.webp"]} />,
    );

    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(2);
  });

  it("renders only one image when given a single image", () => {
    const { container } = render(
      <GhostCard side="left" images={["/img1.webp"]} />,
    );

    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(1);
    expect(images[0].getAttribute("src")).toBe("/img1.webp");
  });

  it("does not cycle when given a single image", () => {
    const { container } = render(
      <GhostCard
        side="left"
        images={["/img1.webp"]}
        displayDuration={1000}
        fadeDuration={500}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(1);
    expect(images[0].getAttribute("src")).toBe("/img1.webp");
  });

  it("fades in next image after display duration", () => {
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

  it("advances to next image after full cycle", () => {
    const { container } = render(
      <GhostCard
        side="left"
        images={["/img1.webp", "/img2.webp", "/img3.webp"]}
        displayDuration={1000}
        fadeDuration={500}
      />,
    );

    // Initially: base=img1, overlay=img2
    let images = container.querySelectorAll("img");
    expect(images[0].getAttribute("src")).toBe("/img1.webp");
    expect(images[1].getAttribute("src")).toBe("/img2.webp");

    // After displayDuration: fade in overlay
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    images = container.querySelectorAll("img");
    expect(images[1].style.opacity).toBe("1");

    // After fadeDuration + displayDuration: advance index
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    images = container.querySelectorAll("img");
    expect(images[0].getAttribute("src")).toBe("/img2.webp");
    expect(images[1].getAttribute("src")).toBe("/img3.webp");
    expect(images[1].style.opacity).toBe("0");
  });

  it("wraps back to first image after cycling through all", () => {
    const { container } = render(
      <GhostCard
        side="left"
        images={["/img1.webp", "/img2.webp", "/img3.webp"]}
        displayDuration={1000}
        fadeDuration={500}
      />,
    );

    // Full cycle duration: displayDuration (wait) + fadeDuration + displayDuration (fade visible)
    const fullCycle = 1000 + 500 + 1000;

    // Cycle 1: img1 -> img2
    act(() => {
      vi.advanceTimersByTime(fullCycle);
    });
    let images = container.querySelectorAll("img");
    expect(images[0].getAttribute("src")).toBe("/img2.webp");

    // Cycle 2: img2 -> img3
    act(() => {
      vi.advanceTimersByTime(fullCycle);
    });
    images = container.querySelectorAll("img");
    expect(images[0].getAttribute("src")).toBe("/img3.webp");

    // Cycle 3: img3 -> img1 (wraps)
    act(() => {
      vi.advanceTimersByTime(fullCycle);
    });
    images = container.querySelectorAll("img");
    expect(images[0].getAttribute("src")).toBe("/img1.webp");
  });

  it("applies transition only when fading", () => {
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
