import { toast } from "react-toastify";
import dayjs from "dayjs";
import type { FormState } from "../../types/leads.types";

const parseSlotStartTime = (slotStr: string): dayjs.Dayjs | null => {
  const match = slotStr.match(/^(\d{1,2}):(\d{2})\s(AM|PM)/);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const meridiem = match[3];

  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;

  return dayjs().set("hour", hour).set("minute", minute).set("second", 0);
};

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _isCouple: "yes" | "no",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _hasPendingFiles: boolean,
): Promise<boolean> => {
  // Validate Step 1: Lab Name and Assigned To are required
  if (step === 1) {
    if (!form.full_name || form.full_name.trim().length === 0) {
      toast.error("Lab Name is required", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return false;
    }

    if (!form.assignee || form.assignee.trim().length === 0) {
      toast.error("Assigned To is required", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return false;
    }
  }

  // Validate Step 2 required fields
  if (step === 1) {
    if (!form.leadStatus || form.leadStatus.trim().length === 0) {
      toast.error("Lead Status is required", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return false;
    }

    if (!form.nextStatus || form.nextStatus.trim().length === 0) {
      toast.error("Next Action Status is required", {
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

  if (step === 3 && form.wantAppointment === "yes") {
    if (!form.appointmentDate) {
      toast.error("Please select an appointment date.", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return false;
    }

    if (!form.slot) {
      toast.error("Please select a time slot.", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return false;
    }

    const selectedDate = dayjs(form.appointmentDate).startOf("day");
    const today = dayjs().startOf("day");

    if (selectedDate.isBefore(today)) {
      toast.error("Cannot book appointment for a past date.", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return false;
    }

    if (selectedDate.isSame(today, "day")) {
      const slotTime = parseSlotStartTime(form.slot);
      if (slotTime) {
        const now = dayjs();
        const slotTimeToday = dayjs()
          .set("hour", slotTime.hour())
          .set("minute", slotTime.minute())
          .set("second", 0);

        if (!slotTimeToday.isAfter(now)) {
          toast.error("Cannot book appointment for a past time.", {
            position: "top-right",
            autoClose: 3000,
            theme: "colored",
          });
          return false;
        }
      }
    }
  }

  return true;
};