import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import TicketReplyEditor from "./TicketReplyEditor";
import type { TicketReplyEditorProps } from "./TicketReplyEditor";

/* ---------- helper to create valid props ---------- */
const employeeStub = {
  id: 1,
  emp_name: "John Doe",
  department_name: "IT",
  emp_type: "staff",
} satisfies import("../../../services/leads.api").Employee;

const createProps = (): TicketReplyEditorProps => ({
  openReply: true,
  setOpenReply: vi.fn(),

  replyTo: [],
  setReplyTo: vi.fn(),

  replySubject: "",
  setReplySubject: vi.fn(),

  replyMessage: "",
  setReplyMessage: vi.fn(),

  employees: [employeeStub],

  anchorEl: null,
  setAnchorEl: vi.fn(),

  showEmoji: false,
  setShowEmoji: vi.fn(),

  handleSendReply: vi.fn(),
  handleCancelReply: vi.fn(),

  handleAttachClick: vi.fn(),
  handleInsertLink: vi.fn(),
  handleInsertDriveLink: vi.fn(),
  handleImageClick: vi.fn(),
  handleEmojiInsert: vi.fn(),

  setOpenTemplateDialog: vi.fn(),

  iconSx: {},
});

/* ---------- TESTS ---------- */

describe("TicketReplyEditor", () => {
  test("does not render when openReply is false", () => {
    const props = createProps();
    props.openReply = false;

    render(<TicketReplyEditor {...props} />);

    expect(
      screen.queryByPlaceholderText("Write your reply...")
    ).not.toBeInTheDocument();
  });

  test("renders editor when openReply is true", () => {
    render(<TicketReplyEditor {...createProps()} />);

    expect(
      screen.getByPlaceholderText("Write your reply...")
    ).toBeInTheDocument();
  });

  test("updates subject field", () => {
    const props = createProps();

    render(<TicketReplyEditor {...props} />);

    const subjectInput = screen.getByPlaceholderText("Enter subject");

    fireEvent.change(subjectInput, { target: { value: "Test Subject" } });

    expect(props.setReplySubject).toHaveBeenCalled();
  });

  test("updates message field", () => {
    const props = createProps();

    render(<TicketReplyEditor {...props} />);

    const messageInput = screen.getByPlaceholderText("Write your reply...");

    fireEvent.change(messageInput, { target: { value: "Hello" } });

    expect(props.setReplyMessage).toHaveBeenCalled();
  });

  test("calls send handler when Send clicked", () => {
    const props = createProps();

    render(<TicketReplyEditor {...props} />);

    fireEvent.click(screen.getByText("Send"));

    expect(props.handleSendReply).toHaveBeenCalled();
  });

  test("calls cancel handler", () => {
    const props = createProps();

    render(<TicketReplyEditor {...props} />);

    fireEvent.click(screen.getByAltText("Cancel"));

    expect(props.handleCancelReply).toHaveBeenCalled();
  });

  test("toggles emoji picker", () => {
    const props = createProps();

    render(<TicketReplyEditor {...props} />);

    fireEvent.click(screen.getByTestId("InsertEmoticonIcon"));

    expect(props.setShowEmoji).toHaveBeenCalled();
  });
});