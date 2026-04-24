import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import TicketDailog from "./TicketDailogs";
import type { EmailTemplate } from "../../../types/tickets.types";

// ---- Mock Template API ----
vi.mock("../../../services/templates.api", () => ({
  default: {
    getTemplateById: vi.fn(() =>
      Promise.resolve({
        id: "1",
        audience_name: "Patients",
        subject: "Reminder",
        body: "Template Body",
      })
    ),
  },
}));

// ---- Mock NewTemplateModal ----
vi.mock("../Templates/NewTemplateModal", () => ({
  NewTemplateModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="view-template-modal">View Template Modal</div> : null,
}));

describe("TicketDailog Component", () => {
  const handlePreviewClose = vi.fn();
  const setSelectedTemplate = vi.fn();
  const setOpenTemplateDialog = vi.fn();
  const onInsertTemplate = vi.fn();
  const setViewTemplateOpen = vi.fn();
  const setViewTemplateData = vi.fn();

  const templates: EmailTemplate[] = [
    {
      id: "1",
      audience_name: "Patients",
      subject: "Appointment Reminder",
      body: "Reminder Body",
      type: "mail",
    } as EmailTemplate,
  ];

  const baseProps = {
    previewOpen: false,
    previewFile: null,
    handlePreviewClose,

    openTemplateDialog: true,
    templates,
    selectedTemplate: null,
    setSelectedTemplate,
    setOpenTemplateDialog,
    onInsertTemplate,

    viewTemplateOpen: false,
    viewTemplateData: null,
    setViewTemplateOpen,
    setViewTemplateData,
  };

  test("renders template dialog when open", () => {
    render(<TicketDailog {...baseProps} />);

    expect(screen.getByText("Insert Email Template")).toBeInTheDocument();
    expect(screen.getByText("Patients")).toBeInTheDocument();
  });

  test("selects template when clicked", () => {
    render(<TicketDailog {...baseProps} />);

    fireEvent.click(screen.getByText("Patients"));

    expect(setSelectedTemplate).toHaveBeenCalled();
  });

  test("cancel button closes template dialog", () => {
    render(<TicketDailog {...baseProps} />);

    fireEvent.click(screen.getByText("Cancel"));

    expect(setOpenTemplateDialog).toHaveBeenCalledWith(false);
  });

  test("insert button calls onInsertTemplate when selected", () => {
    render(
      <TicketDailog
        {...baseProps}
        selectedTemplate={templates[0]}
      />
    );

    fireEvent.click(screen.getByText("Insert"));

    expect(onInsertTemplate).toHaveBeenCalledWith(templates[0]);
  });

test("renders image preview when previewFile is image", async () => {
  render(
    <TicketDailog
      {...baseProps}
      previewOpen={true}
      previewFile="test.png"
    />
  );

  const image = await document.querySelector("img");
  expect(image).not.toBeNull();
});

test("renders iframe preview when file is not image", async () => {
  render(
    <TicketDailog
      {...baseProps}
      previewOpen={true}
      previewFile="file.pdf"
    />
  );

  const iframe = await document.querySelector("iframe");
  expect(iframe).not.toBeNull();
});

  test("renders view template modal when viewTemplateOpen is true", () => {
    render(
      <TicketDailog
        {...baseProps}
        viewTemplateOpen={true}
      />
    );

    expect(screen.getByTestId("view-template-modal")).toBeInTheDocument();
  });
});