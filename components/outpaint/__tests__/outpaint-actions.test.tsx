import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OutpaintActions } from "../outpaint-actions";

describe("OutpaintActions", () => {
  it("shows handshake button when handshake not sent", () => {
    render(<OutpaintActions handshakeSent={false} onSendHandshake={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /I've sent the handshake/i }),
    ).toBeDefined();
  });

  it("shows disabled Continue to Merge when handshake not sent", () => {
    render(<OutpaintActions handshakeSent={false} onSendHandshake={vi.fn()} />);

    const link = screen.getByText("Continue to Merge");
    expect(link.getAttribute("aria-disabled")).toBe("true");
    expect(link.className).toContain("opacity-40");
    expect(link.className).toContain("pointer-events-none");
  });

  it("calls onSendHandshake when handshake button is clicked", async () => {
    const onSendHandshake = vi.fn();
    render(
      <OutpaintActions
        handshakeSent={false}
        onSendHandshake={onSendHandshake}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /I've sent the handshake/i }),
    );
    expect(onSendHandshake).toHaveBeenCalledOnce();
  });

  it("hides handshake button when handshake is sent", () => {
    render(<OutpaintActions handshakeSent={true} onSendHandshake={vi.fn()} />);

    expect(
      screen.queryByRole("button", { name: /I've sent the handshake/i }),
    ).toBeNull();
  });

  it("enables Continue to Merge link when handshake is sent", () => {
    render(<OutpaintActions handshakeSent={true} onSendHandshake={vi.fn()} />);

    const link = screen.getByText("Continue to Merge");
    expect(link.getAttribute("aria-disabled")).toBe("false");
    expect(link.className).toContain("border-surface-border");
    expect(link.className).not.toContain("opacity-40");
  });

  it("sets Continue to Merge href to /merger", () => {
    render(<OutpaintActions handshakeSent={true} onSendHandshake={vi.fn()} />);

    const link = screen.getByText("Continue to Merge");
    expect(link.getAttribute("href")).toBe("/merger");
  });
});
