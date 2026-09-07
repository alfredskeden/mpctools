import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PadderActions } from "../padder-actions";

describe("PadderActions", () => {
  it("disables the download before a layout exists", () => {
    // Given / When
    render(
      <PadderActions
        canDownload={false}
        canContinue={false}
        isDownloaded={false}
        onDownload={vi.fn()}
      />,
    );

    // Then
    expect(
      screen.getByTestId("padder-download-btn").hasAttribute("disabled"),
    ).toBe(true);
  });

  it("downloads when the action is triggered", async () => {
    // Given
    const onDownload = vi.fn();
    render(
      <PadderActions
        canDownload
        canContinue={false}
        isDownloaded={false}
        onDownload={onDownload}
      />,
    );

    // When
    await userEvent.click(screen.getByTestId("padder-download-btn"));

    // Then
    expect(onDownload).toHaveBeenCalledOnce();
  });

  it("shows the downloaded state instead of the download action", () => {
    // Given / When
    render(
      <PadderActions
        canDownload
        canContinue
        isDownloaded
        onDownload={vi.fn()}
      />,
    );

    // Then
    expect(
      screen
        .getByTestId("padder-download-btn")
        .getAttribute("data-downloaded"),
    ).toBe("true");
  });

  it("blocks continuing until the file has been downloaded", () => {
    // Given / When
    render(
      <PadderActions
        canDownload
        canContinue={false}
        isDownloaded={false}
        onDownload={vi.fn()}
      />,
    );

    // Then
    expect(
      screen.getByTestId("padder-continue-link").getAttribute("aria-disabled"),
    ).toBe("true");
  });

  it("links on to the padder outpaint page once downloaded", () => {
    // Given / When
    render(
      <PadderActions
        canDownload
        canContinue
        isDownloaded
        onDownload={vi.fn()}
      />,
    );

    // Then
    const link = screen.getByTestId("padder-continue-link");
    expect(link.getAttribute("href")).toBe("/padder-outpaint");
    expect(link.getAttribute("aria-disabled")).toBe("false");
  });
});
