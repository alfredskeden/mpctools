import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PrepActions } from "../prep-actions";

describe("PrepActions", () => {
  it("renders download and continue buttons", () => {
    render(
      <PrepActions
        canDownload={false}
        canContinue={false}
        isDownloaded={false}
        onDownload={vi.fn()}
      />,
    );

    expect(screen.getByText("Download PNG")).toBeDefined();
    expect(screen.getByText("Continue to Outpaint")).toBeDefined();
  });

  it("disables download button when canDownload is false", () => {
    render(
      <PrepActions
        canDownload={false}
        canContinue={false}
        isDownloaded={false}
        onDownload={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /download png/i }),
    ).toBeDisabled();
  });

  it("enables download button when canDownload is true", () => {
    render(
      <PrepActions
        canDownload={true}
        canContinue={false}
        isDownloaded={false}
        onDownload={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /download png/i }),
    ).not.toBeDisabled();
  });

  it("calls onDownload when download button is clicked", async () => {
    const onDownload = vi.fn();
    render(
      <PrepActions
        canDownload={true}
        canContinue={false}
        isDownloaded={false}
        onDownload={onDownload}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /download png/i }),
    );
    expect(onDownload).toHaveBeenCalledOnce();
  });

  it("disables continue link when canContinue is false", () => {
    render(
      <PrepActions
        canDownload={false}
        canContinue={false}
        isDownloaded={false}
        onDownload={vi.fn()}
      />,
    );

    const link = screen.getByText("Continue to Outpaint");
    expect(link.getAttribute("aria-disabled")).toBe("true");
  });

  it("sets continue link href to /outpaint", () => {
    render(
      <PrepActions
        canDownload={true}
        canContinue={true}
        isDownloaded={false}
        onDownload={vi.fn()}
      />,
    );

    const link = screen.getByText("Continue to Outpaint");
    expect(link.getAttribute("href")).toBe("/outpaint");
  });

  it("applies disabled opacity to download button when disabled", () => {
    render(
      <PrepActions
        canDownload={false}
        canContinue={false}
        isDownloaded={false}
        onDownload={vi.fn()}
      />,
    );

    const btn = screen.getByRole("button", { name: /download png/i });
    expect(btn.className).toContain("opacity-40");
  });

  it("applies disabled opacity to continue link when disabled", () => {
    render(
      <PrepActions
        canDownload={false}
        canContinue={false}
        isDownloaded={false}
        onDownload={vi.fn()}
      />,
    );

    const link = screen.getByText("Continue to Outpaint");
    expect(link.className).toContain("opacity-40");
  });

  it("shows downloaded state with green border", () => {
    render(
      <PrepActions
        canDownload={true}
        canContinue={true}
        isDownloaded={true}
        onDownload={vi.fn()}
      />,
    );

    const btn = screen.getByRole("button", { name: /downloaded/i });
    expect(btn.className).toContain("border-status-success-dark");
    expect(btn).toBeDisabled();
  });

  it("shows blue continue button when canContinue is true", () => {
    render(
      <PrepActions
        canDownload={true}
        canContinue={true}
        isDownloaded={true}
        onDownload={vi.fn()}
      />,
    );

    const link = screen.getByText("Continue to Outpaint");
    expect(link.className).toContain("border-surface-border");
  });
});
