import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PrepActions } from "./prep-actions";

describe("PrepActions", () => {
  it("renders download and continue buttons", () => {
    render(
      <PrepActions canDownload={false} canContinue={false} onDownload={vi.fn()} />,
    );

    expect(screen.getByText("Download PNG")).toBeDefined();
    expect(screen.getByText("Continue to Outpaint")).toBeDefined();
  });

  it("disables download button when canDownload is false", () => {
    render(
      <PrepActions canDownload={false} canContinue={false} onDownload={vi.fn()} />,
    );

    expect(
      screen.getByRole("button", { name: /download png/i }),
    ).toBeDisabled();
  });

  it("enables download button when canDownload is true", () => {
    render(
      <PrepActions canDownload={true} canContinue={true} onDownload={vi.fn()} />,
    );

    expect(
      screen.getByRole("button", { name: /download png/i }),
    ).not.toBeDisabled();
  });

  it("calls onDownload when download button is clicked", async () => {
    const onDownload = vi.fn();
    render(
      <PrepActions canDownload={true} canContinue={true} onDownload={onDownload} />,
    );

    await userEvent.click(screen.getByRole("button", { name: /download png/i }));
    expect(onDownload).toHaveBeenCalledOnce();
  });

  it("disables continue link when canContinue is false", () => {
    render(
      <PrepActions canDownload={false} canContinue={false} onDownload={vi.fn()} />,
    );

    const link = screen.getByText("Continue to Outpaint");
    expect(link.closest("a")?.getAttribute("aria-disabled")).toBe("true");
  });

  it("sets continue link href to /outpaint", () => {
    render(
      <PrepActions canDownload={true} canContinue={true} onDownload={vi.fn()} />,
    );

    const link = screen.getByText("Continue to Outpaint");
    expect(link.closest("a")?.getAttribute("href")).toBe("/outpaint");
  });
});
