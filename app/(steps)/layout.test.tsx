import { render, screen } from "@testing-library/react";
import PrepLayout from "./layout";

describe("PrepLayout", () => {
  it("renders the header with step indicator", () => {
    render(<PrepLayout><div>child</div></PrepLayout>);

    expect(screen.getByRole("banner")).toBeDefined();
    expect(screen.getByText("STEP 1")).toBeDefined();
  });

  it("renders children", () => {
    render(<PrepLayout><div>test content</div></PrepLayout>);

    expect(screen.getByText("test content")).toBeDefined();
  });

  it("uses a full-height flex column layout", () => {
    render(<PrepLayout><div>child</div></PrepLayout>);

    const wrapper = screen.getByRole("banner").parentElement!;
    expect(wrapper.className).toContain("h-dvh");
    expect(wrapper.className).toContain("flex-col");
  });
});
