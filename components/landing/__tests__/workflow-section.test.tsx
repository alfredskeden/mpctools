import { render, screen, within } from "@testing-library/react";
import { WorkflowSection } from "../workflow-section";

describe("WorkflowSection", () => {
  it("renders a section element with the how-it-works id", () => {
    const { container } = render(<WorkflowSection />);
    expect(container.querySelector("#how-it-works")).not.toBeNull();
  });

  it("renders a workflow steps list landmark", () => {
    render(<WorkflowSection />);
    expect(
      screen.getByRole("list", { name: "Workflow steps" }),
    ).toBeDefined();
  });

  it("renders three workflow step items", () => {
    render(<WorkflowSection />);
    const list = screen.getByRole("list", { name: "Workflow steps" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
  });

  it("renders three step headings", () => {
    render(<WorkflowSection />);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
  });

  it("renders a section heading", () => {
    render(<WorkflowSection />);
    expect(screen.getByRole("heading", { level: 2 })).toBeDefined();
  });
});
