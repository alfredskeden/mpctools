import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OutpaintPageContent } from "./outpaint-page-content";

describe("OutpaintPageContent", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("renders both step cards initially", () => {
    render(<OutpaintPageContent />);

    expect(screen.getByText("THE HANDSHAKE")).toBeDefined();
    expect(screen.getByText("OUTPAINT COMMAND")).toBeDefined();
  });

  it("shows handshake card as active initially", () => {
    render(<OutpaintPageContent />);

    // Handshake has a Copy button (active), outpaint command does not (inactive)
    const copyButtons = screen.getAllByRole("button", { name: /copy/i });
    expect(copyButtons).toHaveLength(1);
  });

  it("shows handshake button initially", () => {
    render(<OutpaintPageContent />);

    expect(
      screen.getByRole("button", { name: /I've sent the handshake/i }),
    ).toBeDefined();
  });

  it("shows disabled Continue to Merge initially", () => {
    render(<OutpaintPageContent />);

    const link = screen.getByText("Continue to Merge");
    expect(link.getAttribute("aria-disabled")).toBe("true");
  });

  it("collapses handshake and activates command after sending handshake", async () => {
    render(<OutpaintPageContent />);

    await userEvent.click(
      screen.getByRole("button", { name: /I've sent the handshake/i }),
    );

    // Handshake is now collapsed with "Sent" label
    expect(screen.getByText("Sent")).toBeDefined();

    // Outpaint command is now active with Copy button
    expect(screen.getByRole("button", { name: /copy/i })).toBeDefined();

    // Continue to Merge is now enabled
    const link = screen.getByText("Continue to Merge");
    expect(link.getAttribute("aria-disabled")).toBe("false");
  });

  it("hides handshake button after sending", async () => {
    render(<OutpaintPageContent />);

    await userEvent.click(
      screen.getByRole("button", { name: /I've sent the handshake/i }),
    );

    expect(
      screen.queryByRole("button", { name: /I've sent the handshake/i }),
    ).toBeNull();
  });

  it("expands handshake card when collapsed step is toggled", async () => {
    render(<OutpaintPageContent />);

    // Send handshake to collapse it
    await userEvent.click(
      screen.getByRole("button", { name: /I've sent the handshake/i }),
    );

    expect(screen.getByText("Sent")).toBeDefined();

    // Click collapsed step to expand
    await userEvent.click(
      screen.getByRole("button", { name: /THE HANDSHAKE/i }),
    );

    // Now handshake is expanded (not collapsed), showing as inactive card
    expect(screen.queryByText("Sent")).toBeNull();
    // Both cards visible, but handshake is inactive (no copy button for it)
    // Command is active with a copy button
    expect(screen.getByRole("button", { name: /copy/i })).toBeDefined();
  });

  it("copies handshake prompt when copy is clicked", async () => {
    render(<OutpaintPageContent />);

    await userEvent.click(screen.getByRole("button", { name: /copy/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining("High-Fidelity Neutral Photo Extender"),
    );
  });

  it("copies outpaint command when copy is clicked after handshake", async () => {
    render(<OutpaintPageContent />);

    // Send handshake first
    await userEvent.click(
      screen.getByRole("button", { name: /I've sent the handshake/i }),
    );

    await userEvent.click(screen.getByRole("button", { name: /copy/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining("NEW PROJECT / MEMORY FLUSH"),
    );
  });
});
