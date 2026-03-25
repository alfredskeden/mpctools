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

    expect(screen.getByRole("button", { name: /download/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /continue/i })).toBeDefined();
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
      screen.getByRole("button", { name: /download/i }),
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
      screen.getByRole("button", { name: /download/i }),
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
      screen.getByRole("button", { name: /download/i }),
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

    const link = screen.getByRole("link", { name: /continue/i });
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

    const link = screen.getByRole("link", { name: /continue/i });
    expect(link.getAttribute("href")).toBe("/outpaint");
  });

  it("shows downloaded state as a disabled button", () => {
    render(
      <PrepActions
        canDownload={true}
        canContinue={true}
        isDownloaded={true}
        onDownload={vi.fn()}
      />,
    );

    const btn = screen.getByRole("button", { name: /downloaded/i });
    expect(btn.getAttribute("data-downloaded")).toBe("true");
    expect(btn).toBeDisabled();
  });
});
