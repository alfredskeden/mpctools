import { render, screen } from "@testing-library/react";
import { BorderlessAltWithEffect } from "../BorderlessAltWithEffect";

describe("BorderlessAltWithEffect", () => {
  it("renders the SVG element", () => {
    // Given / When
    render(<BorderlessAltWithEffect />);

    // Then
    expect(document.querySelector("svg")).toBeDefined();
  });

  it("uses the default art as background when no imageUrl is provided", () => {
    // Given / When
    render(<BorderlessAltWithEffect />);

    // Then
    const svg = document.querySelector("svg") as SVGElement;
    expect(svg.style.backgroundImage).toContain(
      "commercial_district.webp",
    );
  });

  it("uses the provided imageUrl as background", () => {
    // Given / When
    render(
      <BorderlessAltWithEffect imageUrl="https://example.com/art.jpg" />,
    );

    // Then
    const svg = document.querySelector("svg") as SVGElement;
    expect(svg.style.backgroundImage).toContain("https://example.com/art.jpg");
  });

  it("does not render card name text when cardName is not provided", () => {
    // Given / When
    render(<BorderlessAltWithEffect />);

    // Then
    expect(screen.queryByTestId("card-name")).toBeNull();
  });

  it("renders card name text when cardName is provided", () => {
    // Given / When
    render(<BorderlessAltWithEffect cardName="Lightning Bolt" />);

    // Then
    expect(screen.getByTestId("card-name")).toBeDefined();
  });

  it("does not render type line text when typeLine is not provided", () => {
    // Given / When
    render(<BorderlessAltWithEffect />);

    // Then
    expect(screen.queryByTestId("card-type-line")).toBeNull();
  });

  it("renders type line text when typeLine is provided", () => {
    // Given / When
    render(<BorderlessAltWithEffect typeLine="Instant" />);

    // Then
    expect(screen.getByTestId("card-type-line")).toBeDefined();
  });

  it("does not render oracle text when oracleText is not provided", () => {
    // Given / When
    render(<BorderlessAltWithEffect />);

    // Then
    expect(screen.queryByTestId("card-oracle-text")).toBeNull();
  });

  it("renders oracle text foreignObject when oracleText is provided", () => {
    // Given / When
    render(
      <BorderlessAltWithEffect oracleText="Deals 3 damage to any target." />,
    );

    // Then
    expect(screen.getByTestId("card-oracle-text")).toBeDefined();
  });

  it("applies border fill when border is true (default)", () => {
    // Given / When
    render(<BorderlessAltWithEffect border={true} />);

    // Then
    const style = document.querySelector("style");
    expect(style?.textContent).toContain("fill: #000");
  });

  it("applies no fill to border when border is false", () => {
    // Given / When
    render(<BorderlessAltWithEffect border={false} />);

    // Then
    const style = document.querySelector("style");
    expect(style?.textContent).toContain("fill: none");
  });

  it("applies custom pinline color", () => {
    // Given / When
    render(<BorderlessAltWithEffect pinlineColor="#ff0000" />);

    // Then
    const stops = document.querySelectorAll('stop[stop-color="#ff0000"]');
    expect(stops.length).toBeGreaterThan(0);
  });

  it("applies custom pinline end color", () => {
    // Given / When
    render(
      <BorderlessAltWithEffect
        pinlineColor="#ff0000"
        pinlineColorEnd="#0000ff"
      />,
    );

    // Then
    const blueStops = document.querySelectorAll('stop[stop-color="#0000ff"]');
    expect(blueStops.length).toBeGreaterThan(0);
  });

  it("applies custom opacity to highlight and shadow elements", () => {
    // Given / When
    render(<BorderlessAltWithEffect opacity={0.8} />);

    // Then
    const style = document.querySelector("style");
    expect(style?.textContent).toContain("opacity: 0.8");
  });

  it("does not render any mana pip groups when manaCost is not provided", () => {
    // Given / When
    render(<BorderlessAltWithEffect />);

    // Then
    expect(document.querySelector("[data-testid^='mana-pip-']")).toBeNull();
  });

  it("renders one pip group per pip in the mana cost", () => {
    // Given / When
    render(<BorderlessAltWithEffect manaCost="{2}{W}" />);

    // Then
    expect(document.querySelectorAll("[data-testid^='mana-pip-']").length).toBe(
      2,
    );
  });

  it("renders a circle per pip with the pip's background color", () => {
    // Given / When
    render(<BorderlessAltWithEffect manaCost="{U}" />);

    // Then
    const pip = document.querySelector("[data-testid='mana-pip-0']");
    const circle = pip?.querySelector("circle");
    expect(circle?.getAttribute("fill")).toBe("#0175be");
  });

  it("renders the glyph text with black fill per pip", () => {
    // Given / When
    render(<BorderlessAltWithEffect manaCost="{R}" />);

    // Then
    const pip = document.querySelector("[data-testid='mana-pip-0']");
    const text = pip?.querySelector("text");
    expect(text?.getAttribute("fill")).toBe("#000000");
  });
});
