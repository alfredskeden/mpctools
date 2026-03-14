import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CollapsedStep } from "./collapsed-step";

describe("CollapsedStep", () => {
  it("renders the title", () => {
    render(<CollapsedStep title="THE HANDSHAKE" onToggle={vi.fn()} />);

    expect(screen.getByText("THE HANDSHAKE")).toBeDefined();
  });

  it("shows Sent label", () => {
    render(<CollapsedStep title="THE HANDSHAKE" onToggle={vi.fn()} />);

    expect(screen.getByText("Sent")).toBeDefined();
  });

  it("renders a green checkmark", () => {
    const { container } = render(
      <CollapsedStep title="THE HANDSHAKE" onToggle={vi.fn()} />,
    );

    const checkCircle = container.querySelector(".bg-status-success");
    expect(checkCircle).not.toBeNull();
  });

  it("calls onToggle when clicked", async () => {
    const onToggle = vi.fn();
    render(<CollapsedStep title="THE HANDSHAKE" onToggle={onToggle} />);

    await userEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalled();
  });

  it("renders a chevron icon", () => {
    const { container } = render(
      <CollapsedStep title="THE HANDSHAKE" onToggle={vi.fn()} />,
    );

    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(2); // checkmark + chevron
  });
});
