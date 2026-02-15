// ================================
// Tickets file styles
// ================================

/* Header search box */
export const ticketsSearchBoxSx = {
  display: "flex",
  alignItems: "center",
  px: 1.5,
  py: 0.5,
  border: "1px solid #E0E0E0",
  borderRadius: 1,
  width: 260,
  "&:has(.Mui-focused)": {
    border: "1px solid #232323",
  },
};

/* Create button */
export const createTicketButtonSx = {
  borderRadius: 1,
  color: "FFFFFF",
  backgroundColor: "#505050",
  "&:hover": { backgroundColor: "#232323" },
};

/* Tabs */
export const ticketsTabsSx = {
  mb: 2,

  "& .MuiTab-root": {
    textTransform: "none",
    borderRadius: "12px",
    border: "1px solid #E0E0E0",
    color: "#9E9E9E",
    minHeight: 44,
    px: 4,
    mr: 2,
    backgroundColor: "#FAFAFA",
    transition: "all 0.2s ease",
  },

  "& .MuiTab-root.Mui-selected": {
    color: "#E97B5A",
    borderColor: "#E97B5A",
    backgroundColor: "rgba(233,123,90,0.08)",
    boxShadow: "0px 2px 6px rgba(0,0,0,0.08)",
    fontWeight: 700,
  },
};

/* Table header */
export const ticketsTableHeaderSx = {
  fontWeight: 400,
  color: "#626262",
  backgroundColor: "#F8F8F9",
  borderBottom: "1px solid #EEE",
  borderRadius: 1.5,
  fontSize: "14px",
};

/* Table row */
export const ticketsRowSx = {
  borderTop: "1px solid #EEE",
  "&:hover": { background: "#FAFAFA" },
};

/* Priority chip */
export const priorityChipSx = (priority: string) => ({
  borderRadius: "999px",
  fontWeight: 500,
  px: 1.5,
  border: "2px solid",
  borderColor:
    priority === "High"
      ? "#FF4D4F"
      : priority === "Medium"
      ? "#FFC53D"
      : "#5B8FF9",
  backgroundColor:
    priority === "High"
      ? "rgba(255, 77, 79, 0.08)"
      : priority === "Medium"
      ? "rgba(255, 197, 61, 0.10)"
      : "rgba(91, 143, 249, 0.10)",
  color:
    priority === "High"
      ? "#FF4D4F"
      : priority === "Medium"
      ? "#FFC53D"
      : "#5B8FF9",
});

/* Pagination button */
export const paginationButtonSx = (active: boolean) => ({
  minWidth: 20,
  height: 25,
  borderRadius: 1,
  fontSize: 16,
  backgroundColor: active ? "#232323" : "transparent",
  color: active ? "#FFFFFF" : "#BBBBBB",
});

//############################################################

// ================================
// CreateTicket file styles
// ================================

export const createTicketFocusedFieldSx = {
  "& .MuiOutlinedInput-root": {
    height: 44, // normal inputs height

    // ✅ Multiline should NOT inherit fixed height
    "&.MuiInputBase-multiline": {
      height: "auto",
      padding: 0, // remove extra padding added earlier
    },

    "&:hover fieldset": {
      borderColor: "#505050",
    },

    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#505050",
    },
  },

  // ✅ Only control multiline text spacing lightly
  "& .MuiInputBase-multiline textarea": {
    padding: "10px 14px", // smaller = matches visual density
    lineHeight: 1.4,
  },

  // ✅ Label color
  "& .MuiInputLabel-root": {
    color: "#232323",
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#232323",
  },

  // ✅ Placeholder style for normal inputs
  "& input::placeholder": {
    color: "#9E9E9E",
    fontSize: "12px",
    opacity: 1,
  },

  // ✅ Placeholder style for multiline only (without affecting height)
  "& .MuiInputBase-multiline textarea::placeholder": {
    color: "#9E9E9E",
    fontSize: "12px",
    opacity: 1,
  },

  // ✅ Select placeholder
  "& .ticket-select-placeholder": {
    color: "#9E9E9E",
    fontSize: "12px",
  },
};


export const createTicketDialogPaperSx = {
  width: 700,
  borderRadius: 3,
};

export const createTicketCloseButtonSx = {
  position: "absolute",
  top: 12,
  right: 12,
  backgroundColor: "#F2F2F2",
  "&:hover": { backgroundColor: "#E0E0E0" },
};

export const createTicketUploadButtonSx = {
  backgroundColor: "#9E9E9E",
  color: "#FFFFFF",
  textTransform: "none",
  fontWeight: 600,
  fontSize: "12px",
  borderRadius: "4px",
  height: 24,
  px: 2,                 
  mr: 1,

  display: "inline-flex", 
  alignItems: "center",
  justifyContent: "center",

  whiteSpace: "nowrap",   
  minWidth: "auto",       
  lineHeight: 1,          

  "&:hover": {
    backgroundColor: "#505050",
  },

  "&:disabled": {
    backgroundColor: "#9E9E9E",
    color: "#FFFFFF",
  },
};



export const createTicketCancelButtonSx = {
  backgroundColor: "#FFFFFF", 
  color: "#505050",
  border: "1px solid #505050",
  textTransform: "none",
  fontWeight: 600,

  "&:hover": {
    backgroundColor: "#FFFFFF", 
    color: "#232323",
    border: "1px solid #232323",
  },

  "&:disabled": {
    backgroundColor: "#FFFFFF",
    color: "#505050",
    border: "1px solid #505050",
  },
};


export const createTicketSaveButtonSx = {
  backgroundColor: "#505050",
  color: "#FFFFFF",
  textTransform: "none",
  minWidth: "100px",   
  px: 2.5,             
  borderRadius: "6px",

  "&:hover": {
    backgroundColor: "#232323",
  },

  "&:disabled": {
    backgroundColor: "#505050",
    color: "#FFFFFF",
  },
};


//#########################################################

// ================================
// FilterTickets file styles
// ================================

export const filterTicketsFocusedFieldSx = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: "#D0D0D0",
    },
    "&:hover fieldset": {
      borderColor: "#505050",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#505050",
      borderWidth: 1.5,
    },
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#505050",
  },
};

export const filterTicketsTitleSx = {
  fontWeight: "650",
  fontSize: "18px",
  color: "#232323",
  lineHeight: "22px",
};

export const filterTicketsCloseButtonSx = {
  position: "absolute",
  top: 12,
  right: 12,
  width: 36,
  height: 36,
  backgroundColor: "#F2F2F2",
  "&:hover": { backgroundColor: "#E0E0E0" },
};

export const filterTicketsClearButtonSx = {
  height: 44,
  borderRadius: 1,
  color: "#505050",
  borderColor: "#505050",
  fontWeight: 600,
  textTransform: "none",
  "&:hover": {
    color: "#232323",
    backgroundColor: "#FFFFFF",
  },
};

export const filterTicketsApplyButtonSx = {
  height: 44,
  borderRadius: 1,
  backgroundColor: "#505050",
  color: "#FFFFFF",
  fontWeight: 600,
  textTransform: "none",
  "&:hover": {
    backgroundColor: "#232323",
  },
};

export const filterTicketsSelectFieldSx = {
  "& .MuiOutlinedInput-root": {
    "&.Mui-focused fieldset": {
      borderColor: "#505050",
    },
    "&:hover fieldset": {
      borderColor: "#505050",
    },
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#505050",
  },
};
