// ================================
// Tickets file styles
// ================================

/* Header search box */
export const ticketsSearchBoxSx = {
  display: "flex",
  alignItems: "center",
  px: 1.2,
  height: 34,              
  border: "1px solid #E0E0E0",
  borderRadius: "6px",
  width: 220,             

  "& input": {
    fontSize: "13px",
    padding: 0,
  },

  "&:has(.Mui-focused)": {
    border: "1px solid #232323",
  },
};

/* Create button */
export const createTicketButtonSx = {
  height: 34,                 
  px: 2,
  fontSize: "12px",
  fontWeight: 600,
  borderRadius: "6px",
  textTransform: "none",
  color: "#FFFFFF",
  backgroundColor: "#505050",

  "& .MuiButton-startIcon": {
    marginRight: "4px",
  },

  "&:hover": {
    backgroundColor: "#232323",
  },
};


/* Tabs */
export const ticketsTabsSx = {
  mb: 0,
  minHeight: 36,
  height: 36,

  width: "fit-content",        // ✅ KEY: stop Tabs from stretching
  flexShrink: 0,               // ✅ prevent flex expanding

  "& .MuiTabs-flexContainer": {
    height: 36,
    alignItems: "center",
    gap: "10px",               // ✅ controls spacing BETWEEN tabs
  },

  "& .MuiTab-root": {
    textTransform: "none",
    borderRadius: "8px",
    border: "1px solid #E0E0E0",
    color: "#9E9E9E",

    minHeight: 30,
    height: 30,
    padding: "0 14px",
    marginRight: 0,            // ❌ remove margin (we now use gap)

    fontSize: "13px",
    fontWeight: 500,
    backgroundColor: "#FAFAFA",
    transition: "all 0.2s ease",
  },

  "& .MuiTab-root.Mui-selected": {
    color: "#E97B5A",
    borderColor: "#E97B5A",
    backgroundColor: "rgba(233,123,90,0.08)",
    fontWeight: 600,
  },
};


/* Table header */
export const ticketsTableHeaderSx = {
  fontWeight: 400,
  color: "#626262",
  backgroundColor: "#F8F8F9",
  borderBottom: "1px solid #EEE",
  borderRadius: 1.5,
  fontSize: "10px",
};

/* Table row */
export const ticketsRowSx = {
  "&:hover": { background: "#FAFAFA" },
};

/* Priority chip */
export const priorityChipSx = (priority: string) => {
  // ✅ Clean the incoming value from API
  const value = (priority || "").trim().toLowerCase();

  const isHigh = value === "high";
  const isMedium = value === "medium";
  const isLow = value === "low";

  return {
    borderRadius: "999px",
    fontWeight: 500,
    fontSize: "12px",
    height: 22,
    px: 1,
    border: "1.5px solid",

    // ✅ Force styles so MUI default color doesn't override
    borderColor: isHigh
      ? "#FF4D4F"
      : isMedium
      ? "#FFC53D"
      : "#5B8FF9",

    backgroundColor: isHigh
      ? "rgba(255,77,79,0.08)"
      : isMedium
      ? "rgba(255,197,61,0.10)"
      : "rgba(91,143,249,0.10)",

    color: isHigh
      ? "#FF4D4F"
      : isMedium
      ? "#FFC53D"
      : "#5B8FF9",

    // 👇 ensures text uses our color, not MUI default
    "& .MuiChip-label": {
      color: "inherit",
      px: 1,
    },
  };
};

/* Pagination button */
export const paginationButtonSx = (active: boolean) => ({
  minWidth: 20,
  height: 25,
  borderRadius: 1,
  fontSize: 16,
  backgroundColor: active ? "#232323" : "transparent",
  color: active ? "#FFFFFF" : "#BBBBBB",
});

/* Page title */
export const ticketsTitleSx = {
  fontSize: "18px",
  fontWeight: 600,
  mb: 1,
  mt: -3,
};

/* Tabs + actions container */
export const ticketsActionsRowSx = {
  width: "100%",
};

/*  Column header text */
export const ticketsColumnHeaderCellSx = {
  fontSize: "12px",
  fontWeight: 500,
  color: "#626262",
};

/* Ellipsis cell (lab name / subject reusable) */
export const ticketsEllipsisCellSx = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: "13px",
};

/* Ticket number cell */
export const ticketsNumberCellSx = {
  color: "#5a8aea",
  fontWeight: 600,
  fontSize: "14px",
};

/* Assigned avatar */
export const ticketsAvatarSx = {
  width: 24,
  height: 24,
  fontSize: 10,
  bgcolor: "#5a8aea",
};

/* Assigned name text */
export const ticketsAssigneeTextSx = {
  fontSize: "13px",
  fontWeight: 500,
  lineHeight: 1.2,
  color: "#2b2b2b",
};

/* Pagination arrow buttons */
export const ticketsPaginationArrowSx = {
  padding: "4px",
  fontWeight: "600",
  minWidth: "32px",
  height: "32px",
};

/* Pagination number overrides */
export const ticketsPaginationNumberOverrideSx = {
  minWidth: "32px",
  height: "32px",
  padding: "0px",
  fontSize: "0.8rem",
};

//############################################################

// ================================
// CreateTicket file styles
// ================================

export const createTicketFocusedFieldSx = {
  "& .MuiOutlinedInput-root": {
    height: 44, // normal inputs height

    //  Multiline should NOT inherit fixed height
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

  //   Only control multiline text spacing lightly
  "& .MuiInputBase-multiline textarea": {
    padding: "10px 14px", // smaller = matches visual density
    lineHeight: 1.4,
  },

  //  Label color
  "& .MuiInputLabel-root": {
    color: "#232323",
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#232323",
  },

  //  Placeholder style for normal inputs
  "& input::placeholder": {
    color: "#9E9E9E",
    fontSize: "12px",
    opacity: 1,
  },

  //  Placeholder style for multiline only (without affecting height)
  "& .MuiInputBase-multiline textarea::placeholder": {
    color: "#9E9E9E",
    fontSize: "12px",
    opacity: 1,
  },

  //  Select placeholder
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
//#########################################################

// ================================
// TicketView file styles
// ================================
export const ticketDetailsTabsSx = {
  minHeight: 40,
  bgcolor: "#e2e3e5",
  borderRadius: "10px",
  p: "4px",
  display: "flex",

  "& .MuiTabs-indicator": {
    display: "none",
  },

  /* Make tabs stretch full width */
  "& .MuiTabs-flexContainer": {
    width: "100%",
    display: "flex",
  },

  /* FIRST TAB → stick left */
  "& .MuiTab-root:first-of-type": {
    mr: "auto",
  },

  "& .MuiTab-root": {
    textTransform: "none",
    minHeight: 32,
    fontSize: "14px",
    fontWeight: 500,
    color: "#232323",
    borderRadius: "8px",
    transition: "all 0.2s ease",
    px: 3,
  },

  "& .MuiTab-root.Mui-selected": {
    bgcolor: "#FFFFFF",
    color: "#E17E61",
    fontWeight: 600,
    boxShadow: "0px 1px 3px rgba(0,0,0,0.08)",
  },
};


export const propertyContainerSx = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};

export const propertyFieldSx = {
  backgroundColor: "#F7F7F7",
  borderRadius: "10px",

  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    fontSize: "13px",
    height: "44px",
  },

  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#E0E0E0",
  },

  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#CFCFCF",
  },

  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#232323",
  },
};

export const floatingLabelSx = {
  fontSize: "12px",
  color: "#9E9E9E",
};

export const valuePillSx = {
  borderRadius: "999px",
  px: 1.2,
  py: 0.3,
  fontSize: "12px",
  fontWeight: 500,
  display: "inline-flex",
  alignItems: "center",
};

export const assigneeRenderSx = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

export const propertyMenuProps = {
  PaperProps: {
    sx: {
      mt: 1,
      borderRadius: "12px",
      padding: "6px",
      backgroundColor: "#F6F6F6",
      boxShadow: "none",
    },
  },
};

/* Status chip (same pattern as priority) */
export const statusChipSx = (status: string) => {
  const value = (status || "").trim().toLowerCase();

  const isNew = value === "new";
  const isPending = value === "pending";
  const isResolved = value === "resolved";
  const isClosed = value === "closed";

  return {
    borderRadius: "999px",
    fontWeight: 500,
    fontSize: "12px",
    height: 22,
    px: 1,
    border: "1.5px solid",

    borderColor: isNew
      ? "#5B8FF9"        
      : isPending
      ? "#FF4D4F"        
      : isResolved
      ? "#52C41A"        
      : "#FFC53D",       

    backgroundColor: isNew
      ? "rgba(91,143,249,0.10)"
      : isPending
      ? "rgba(255,77,79,0.08)"
      : isResolved
      ? "rgba(82,196,26,0.10)"
      : "rgba(255,197,61,0.10)",

    color: isNew
      ? "#5B8FF9"
      : isPending
      ? "#FF4D4F"
      : isResolved
      ? "#52C41A"
      : "#FFC53D",

    "& .MuiChip-label": {
      color: "inherit",
      px: 1,
    },
  };
};

/* Main page wrapper */
export const ticketViewWrapperSx = {
  p: 0.5,
  bgcolor: "#fff",
};

/* Header row (Back + Ticket No) */
export const ticketViewHeaderSx = {
  alignItems: "center",
  mb: 1,
  mt: -2,
};

/* Back button */
export const ticketBackButtonSx = {
  minWidth: "auto",
  p: 0.2,
  borderRadius: "2px",
};


/* Reply toolbar icon (used across reply editor) */
export const replyToolbarIconSx = {
  fontSize: 20,
  color: "#6F6F6F",
  cursor: "pointer",
  transition: "0.2s",
  "&:hover": {
    color: "#232323",
  },
};