import { render, screen } from "@testing-library/react";
import StepsLayout from "./layout";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

describe("StepsLayout", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/prep");
  });

  it("renders the header with step indicator", () => {
    render(<StepsLayout><div>child</div></StepsLayout>);

    expect(screen.getByRole("banner")).toBeDefined();
    expect(screen.getByText("STEP 1")).toBeDefined();
  });

  it("renders children", () => {
    render(<StepsLayout><div>test content</div></StepsLayout>);

    expect(screen.getByText("test content")).toBeDefined();
  });

  it("uses a full-height flex column layout", () => {
    render(<StepsLayout><div>child</div></StepsLayout>);

    const wrapper = screen.getByRole("banner").parentElement!;
    expect(wrapper.className).toContain("h-dvh");
    expect(wrapper.className).toContain("flex-col");
  });

  it("shows step 1 on /prep route", () => {
    mockUsePathname.mockReturnValue("/prep");
    render(<StepsLayout><div>child</div></StepsLayout>);

    expect(screen.getByText("STEP 1")).toBeDefined();
    expect(screen.getByText("Prepare Image")).toBeDefined();
  });

  it("shows step 2 on /outpaint route", () => {
    mockUsePathname.mockReturnValue("/outpaint");
    render(<StepsLayout><div>child</div></StepsLayout>);

    expect(screen.getByText("STEP 2")).toBeDefined();
    expect(screen.getByText("Outpaint Image")).toBeDefined();
  });

  it("shows step 3 on /merger route", () => {
    mockUsePathname.mockReturnValue("/merger");
    render(<StepsLayout><div>child</div></StepsLayout>);

    expect(screen.getByText("STEP 3")).toBeDefined();
    expect(screen.getByText("Merge Cards")).toBeDefined();
  });

  it("marks previous steps as completed", () => {
    mockUsePathname.mockReturnValue("/outpaint");
    render(<StepsLayout><div>child</div></StepsLayout>);

    expect(screen.getByText("Prep").getAttribute("aria-current")).toBe("step");
    expect(screen.getByText("Outpaint").getAttribute("aria-current")).toBe("step");
    expect(screen.getByText("Merge").getAttribute("aria-current")).toBeNull();
  });

  it("defaults to step 1 for unknown routes", () => {
    mockUsePathname.mockReturnValue("/unknown");
    render(<StepsLayout><div>child</div></StepsLayout>);

    expect(screen.getByText("STEP 1")).toBeDefined();
  });
});
