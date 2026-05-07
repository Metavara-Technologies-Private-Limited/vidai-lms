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
  _isCouple: "yes" | "no",
  _hasPendingFiles: boolean,
): Promise<boolean> => {
  // Validate Step 1: Full Name is required
  if (step === 1) {
    if (!form.full_name || form.full_name.trim().length === 0) {
      toast.error("Please enter Full Name", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return false;
    }
  }

  // Validate Product Interest is selected only when leaving Step 2
  if (step === 2 && (!form.treatments || form.treatments.length === 0)) {
    toast.error("Please select at least one Product Interest", {
      position: "top-right",
      autoClose: 3000,
      theme: "colored",
    });
    return false;
  }

  return true;
};