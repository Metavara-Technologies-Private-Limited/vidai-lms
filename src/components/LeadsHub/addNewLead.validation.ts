import { toast } from "react-toastify";
import type { FormState } from "../../types/leads.types";

// ====================== Toast Message Type ======================
export type ToastMessage = { type: "error" | "warning" | "info"; text: string };

// ====================== Toast Helpers ======================
export const showSequentialToasts = async (messages: ToastMessage[]) => {
  for (const msg of messages) {
    await new Promise<void>((resolve) => {
      const fn =
        msg.type === "error"
          ? toast.error
          : msg.type === "warning"
            ? toast.warning
            : toast.info;
      fn(msg.text, {
        position: "top-right",
        autoClose: 1500,
        theme: "colored",
        onClose: () => resolve(),
      });
    });
    await new Promise((r) => setTimeout(r, 200));
  }
};

export const showWarningsNonBlocking = (messages: ToastMessage[]) => {
  messages.forEach((msg, i) => {
    setTimeout(() => {
      const fn =
        msg.type === "error"
          ? toast.error
          : msg.type === "warning"
            ? toast.warning
            : toast.info;
      fn(msg.text, {
        position: "top-right",
        autoClose: 2000,
        theme: "colored",
      });
    }, i * 300);
  });
};

// ====================== Validation ======================
export const validateStep = async (
  step: number,
  form: FormState,
  isCouple: "yes" | "no",
  hasPendingFiles: boolean,
): Promise<boolean> => {
  const errors: ToastMessage[] = [];
  const warnings: ToastMessage[] = [];

  if (step === 1) {
    if (!form.full_name.trim())
      errors.push({ type: "error", text: "Full name is required!" });
    if (!form.contact.trim())
      errors.push({ type: "error", text: "Contact number is required!" });
    if (!form.email.trim())
      errors.push({ type: "error", text: "Email is required!" });
    if (!form.gender)
      errors.push({ type: "error", text: "Gender is required!" });
    if (!form.age) errors.push({ type: "error", text: "Age is required!" });
    if (!form.source)
      errors.push({ type: "error", text: "Source is required!" });
    if (errors.length > 0) {
      await showSequentialToasts(errors);
      return false;
    }

    if (!form.location.trim())
      warnings.push({ type: "warning", text: "Location is not provided!" });
    if (!form.marital)
      warnings.push({
        type: "warning",
        text: "Marital status is not selected!",
      });
    if (!form.address.trim())
      warnings.push({ type: "warning", text: "Address is not provided!" });
    if (!form.language)
      warnings.push({
        type: "warning",
        text: "Language preference is not selected!",
      });
    if (isCouple === "yes") {
      if (!form.partnerName.trim())
        warnings.push({
          type: "warning",
          text: "Partner name is not provided!",
        });
      if (!form.partnerAge)
        warnings.push({
          type: "warning",
          text: "Partner age is not provided!",
        });
      if (!form.partnerGender)
        warnings.push({
          type: "warning",
          text: "Partner gender is not selected!",
        });
    }
    if (!form.subSource && !form.campaign)
      warnings.push({ type: "warning", text: "Sub-source is not provided!" });
    if (!form.assignee)
      warnings.push({
        type: "warning",
        text: "Lead is not assigned to anyone!",
      });
    if (!form.nextType)
      warnings.push({
        type: "warning",
        text: "Next action type is not selected!",
      });
    if (!form.nextStatus)
      warnings.push({
        type: "warning",
        text: "Next action status is not selected!",
      });
    if (!form.nextDesc.trim())
      warnings.push({
        type: "warning",
        text: "Next action description is not provided!",
      });
    if (warnings.length > 0) showWarningsNonBlocking(warnings);
  }

  if (step === 2) {
    if (form.treatments.length === 0) {
      errors.push({
        type: "error",
        text: "Please select at least one treatment!",
      });
    }
    if (errors.length > 0) {
      await showSequentialToasts(errors);
      return false;
    }
    if (!hasPendingFiles)
      showWarningsNonBlocking([
        { type: "info", text: "No documents uploaded" },
      ]);
  }

  if (step === 3) {
    if (!form.department)
      errors.push({ type: "error", text: "Department is required!" });
    if (!form.appointmentDate)
      errors.push({ type: "error", text: "Appointment date is required!" });
    if (!form.slot)
      errors.push({ type: "error", text: "Time slot is required!" });
    if (errors.length > 0) {
      await showSequentialToasts(errors);
      return false;
    }
    if (!form.assignee)
      warnings.push({
        type: "warning",
        text: "Lead is not assigned to any personnel!",
      });
    if (!form.remark.trim())
      warnings.push({ type: "info", text: "No remark added for appointment" });
    if (warnings.length > 0) showWarningsNonBlocking(warnings);
  }

  return true;
};
