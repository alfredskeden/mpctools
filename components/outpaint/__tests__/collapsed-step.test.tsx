import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CollapsedStep } from "../collapsed-step";

describe("CollapsedStep", () => {
  it("renders the title prop", () => {
    render(<CollapsedStep title="THE HANDSHAKE" onToggle={vi.fn()} />);

    expect(screen.getByText("THE HANDSHAKE")).toBeDefined();
  });

  it("shows a sent status indicator", () => {
    const { container } = render(
      <CollapsedStep title="THE HANDSHAKE" onToggle={vi.fn()} />,
    );

    expect(container.querySelector("[data-testid='sent-indicator']")).not.toBeNull();
    expect(container.querySelector("[data-testid='sent-label']")).not.toBeNull();
  });

  it("renders a success checkmark icon", () => {
    const { container } = render(
      <CollapsedStep title="THE HANDSHAKE" onToggle={vi.fn()} />,
    );

    const indicator = container.querySelector("[data-testid='sent-indicator']")!;
    expect(indicator.querySelector("svg")).not.toBeNull();
  });

  it("calls onToggle when clicked", async () => {
    const onToggle = vi.fn();
    render(<CollapsedStep title="THE HANDSHAKE" onToggle={onToggle} />);

    await userEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalled();
  });

  it("renders a chevron icon alongside the status icon", () => {
    const { container } = render(
      <CollapsedStep title="THE HANDSHAKE" onToggle={vi.fn()} />,
    );

    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(2); // checkmark + chevron
  });
});
