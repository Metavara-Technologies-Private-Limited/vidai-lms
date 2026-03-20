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
  void step;
  void form;
  void isCouple;
  void hasPendingFiles;

  return true;
};