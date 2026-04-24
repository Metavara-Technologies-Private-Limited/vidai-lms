import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import TicketContentPanel from "./TicketContentPanel";
import type { TicketDetail, TicketDocument } from "../../../types/tickets.types";

// ---- Mock the child component completely ----
// Since it's mocked, we don't care about its real props.
vi.mock("./TicketReplyEditor", () => ({
  default: () => <div data-testid="reply-editor">Reply Editor</div>,
}));

describe("TicketContentPanel", () => {
  // ---- Minimal typed document ----
  const documents: TicketDocument[] = [
    {
      id: "1",
      file: "/files/error_log.pdf",
    } as TicketDocument,
  ];

  // ---- Minimal ticket object (only fields this component uses) ----
  const ticket = {
    id: "1",
    subject: "System Issue",
    description: "Sample description",
    requested_by: "John Doe",
    created_at: "2024-01-01T10:00:00Z",
    documents,
  } as unknown as TicketDetail;

  const setDescription = vi.fn();
  const handlePreviewOpen = vi.fn();
  const setOpenReply = vi.fn();

  test("does not render when ticket is null", () => {
    const { container } = render(
      <TicketContentPanel
        ticket={null}
        description=""
        setDescription={setDescription}
        handlePreviewOpen={handlePreviewOpen}
        openReply={false}
        setOpenReply={setOpenReply}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  test("renders ticket details", () => {
    render(
      <TicketContentPanel
        ticket={ticket}
        description="Initial"
        setDescription={setDescription}
        handlePreviewOpen={handlePreviewOpen}
        openReply={false}
        setOpenReply={setOpenReply}
      />
    );

    expect(screen.getByText("System Issue")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  test("updates description when typing", () => {
    render(
      <TicketContentPanel
        ticket={ticket}
        description="Old"
        setDescription={setDescription}
        handlePreviewOpen={handlePreviewOpen}
        openReply={false}
        setOpenReply={setOpenReply}
      />
    );

    fireEvent.change(
      screen.getByPlaceholderText("Describe the issue in detail..."),
      { target: { value: "Updated text" } }
    );

    expect(setDescription).toHaveBeenCalledWith("Updated text");
  });

  test("opens attachment preview", () => {
    render(
      <TicketContentPanel
        ticket={ticket}
        description=""
        setDescription={setDescription}
        handlePreviewOpen={handlePreviewOpen}
        openReply={false}
        setOpenReply={setOpenReply}
      />
    );

    fireEvent.click(screen.getByText("View"));

    expect(handlePreviewOpen).toHaveBeenCalledWith("/files/error_log.pdf");
  });

test("opens reply editor when reply clicked", () => {
  render(
    <TicketContentPanel
      ticket={ticket}
      description=""
      setDescription={setDescription}
      handlePreviewOpen={handlePreviewOpen}
      openReply={false}
      setOpenReply={setOpenReply}
    />
  );

  const replyImage = screen.getByAltText("Reply");
  const replyButton = replyImage.closest("button") as HTMLButtonElement;

  fireEvent.click(replyButton);

  expect(setOpenReply).toHaveBeenCalledWith(true);
});

  test("renders mocked reply editor when openReply is true", () => {
    render(
      <TicketContentPanel
        ticket={ticket}
        description=""
        setDescription={setDescription}
        handlePreviewOpen={handlePreviewOpen}
        openReply={true}
        setOpenReply={setOpenReply}
        replyProps={{} as never}   // safe because component is mocked
      />
    );

    expect(screen.getByTestId("reply-editor")).toBeInTheDocument();
  });
});