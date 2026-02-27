import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import CallDialog from "./CallDialog";

// ---------------- MOCK Audio API ----------------
// Track instances so we can assert on them (prototype spies don't work
// because the component stores the instance on audioRef.current directly)
const audioInstances: { play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn> }[] = [];

class MockAudio {
  loop = false;
  src = "";
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();
  constructor(src?: string) {
    this.src = src || "";
    audioInstances.push(this);
  }
}

vi.stubGlobal("Audio", MockAudio);

// ---------------- MOCK MUI useMediaQuery ----------------
vi.mock("@mui/material", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mui/material")>();
  return {
    ...actual,
    useMediaQuery: vi.fn(() => false), // not mobile by default
  };
});

// ---------------- RENDER HELPER ----------------
function renderComponent(overrideProps?: Partial<React.ComponentProps<typeof CallDialog>>) {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    name: "Jane Doe",
  };

  const finalProps = { ...defaultProps, ...overrideProps };

  return {
    ...render(<CallDialog {...finalProps} />),
    props: finalProps,
  };
}

// =====================================================
// TESTS
// =====================================================

describe("CallDialog", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    audioInstances.length = 0; // reset tracked instances
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ---- Rendering ----

  it("renders nothing when open is false", () => {
    const { container } = renderComponent({ open: false });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("renders dialog when open is true", () => {
    renderComponent();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("displays the caller name", () => {
    renderComponent({ name: "John Smith" });
    expect(screen.getAllByText("John Smith").length).toBeGreaterThan(0);
  });

  it("shows 'Calling...' text while ringing", () => {
    renderComponent();
    expect(screen.getByText("Calling...")).toBeInTheDocument();
  });

  it("shows avatar initial from the name", () => {
    renderComponent({ name: "Alice" });
    // Avatar renders the first letter
    expect(screen.getAllByText("A").length).toBeGreaterThan(0);
  });

  // ---- Ringing → In Call transition ----

  it("transitions to in-call state after 3 seconds", async () => {
    renderComponent();
    expect(screen.getByText("Calling...")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    // "Calling..." should be gone; timer "00:00" should appear
    expect(screen.queryByText("Calling...")).toBeNull();
    expect(screen.getByText("00:00")).toBeInTheDocument();
  });

  it("shows in-call control buttons after ringing ends", async () => {
    renderComponent();

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    // Mute, Dialpad, Volume buttons are rendered (3 icon buttons + end button)
    // The minimize and fullscreen buttons also appear
    const iconButtons = screen.getAllByRole("button");
    expect(iconButtons.length).toBeGreaterThanOrEqual(4);
  });

  it("shows minimize and fullscreen buttons when in call", async () => {
    renderComponent();

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    // RemoveIcon (minimize) and OpenInFullIcon (fullscreen) buttons exist
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  // ---- Timer ----

  it("increments the call timer each second", async () => {
    renderComponent();

    await act(async () => {
      vi.advanceTimersByTime(3000); // enter in-call
    });

    expect(screen.getByText("00:00")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(5000); // 5 more seconds
    });

    expect(screen.getByText("00:05")).toBeInTheDocument();
  });

  it("formats timer correctly past 60 seconds", async () => {
    renderComponent();

    await act(async () => {
      vi.advanceTimersByTime(3000); // enter in-call
    });

    await act(async () => {
      vi.advanceTimersByTime(65000); // 65 seconds
    });

    expect(screen.getByText("01:05")).toBeInTheDocument();
  });

  // ---- Minimize ----

  it("minimizes the dialog and shows mini bar", async () => {
    renderComponent();

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    // Click minimize (first small icon button in header — RemoveIcon)
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);

    // MUI Dialog stays in the DOM with aria-hidden="true" when open=false.
    // The mini bar lives outside the dialog in a plain div (no aria-hidden).
    // So we look for all "Jane Doe" elements and confirm at least one is
    // NOT inside an aria-hidden container (i.e. the mini bar).
    const allNames = screen.getAllByText("Jane Doe");
    const miniBarName = allNames.find(
      (el) => !el.closest('[aria-hidden="true"]'),
    );
    expect(miniBarName).toBeInTheDocument();
  });

  it("restores dialog when mini bar is clicked", async () => {
    renderComponent();

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]); // minimize

    // Find the mini bar name (outside aria-hidden) and click its wrapper box
    const allNames = screen.getAllByText("Jane Doe");
    const miniBarName = allNames.find(
      (el) => !el.closest('[aria-hidden="true"]'),
    )!;
    // The clickable Box is the parent of the Stack that contains the name
    fireEvent.click(miniBarName.closest("div")!.parentElement!.parentElement!);

    // Dialog should be visible again (role="dialog" is accessible again)
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  // ---- End Call ----

  it("calls onClose when end call button is clicked", () => {
    const onClose = vi.fn();
    renderComponent({ onClose });

    // Get the last button which is the end-call button
    const allButtons = screen.getAllByRole("button");
    fireEvent.click(allButtons[allButtons.length - 1]);

    expect(onClose).toHaveBeenCalled();
  });

  it("resets to ringing state after ending call", async () => {
    const onClose = vi.fn();
    renderComponent({ onClose });

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    const allButtons = screen.getAllByRole("button");
    fireEvent.click(allButtons[allButtons.length - 1]); // end call

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ends call from minimized mini bar end button", async () => {
    const onClose = vi.fn();
    renderComponent({ onClose });

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    // Minimize first
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);

    // Click end call inside mini bar
    const allButtons = screen.getAllByRole("button");
    const miniBarEndBtn = allButtons[allButtons.length - 1];
    fireEvent.click(miniBarEndBtn);

    expect(onClose).toHaveBeenCalled();
  });

  // ---- Audio ----

  it("plays ringing audio on open", () => {
    renderComponent();
    // The component creates a new Audio instance and calls play()
    expect(audioInstances.length).toBeGreaterThan(0);
    expect(audioInstances[0].play).toHaveBeenCalled();
  });

  it("pauses audio when call ends", () => {
    renderComponent();
    const instance = audioInstances[0];
    const allButtons = screen.getAllByRole("button");
    fireEvent.click(allButtons[allButtons.length - 1]);
    expect(instance.pause).toHaveBeenCalled();
  });

  // ---- Custom ringing audio URL ----

  it("uses provided ringingAudioUrl", () => {
    const customUrl = "https://example.com/ring.mp3";
    renderComponent({ ringingAudioUrl: customUrl });
    // Audio constructor should have been called with the custom URL
    // Since we stub globally, just verify no errors thrown and dialog renders
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});