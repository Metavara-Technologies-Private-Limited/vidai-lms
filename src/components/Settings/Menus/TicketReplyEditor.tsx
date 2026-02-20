import {
    Box,
    Typography,
    Avatar,
    Stack,
    Popover,
    InputBase,
    TextField,
    Divider,
    Button,
} from "@mui/material";

import AttachFileIcon from "@mui/icons-material/AttachFile";
import LinkIcon from "@mui/icons-material/Link";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import FormatSizeIcon from "@mui/icons-material/FormatSize";

import type { Employee } from "../../../services/leads.api";
import type { SxProps, Theme } from "@mui/material/styles";
import DeleteMail from "../../../assets/icons/Delete_Icon.svg";

export interface TicketReplyEditorProps {
    openReply: boolean;
    setOpenReply: (v: boolean) => void;

    replyTo: string;
    setReplyTo: (v: string) => void;

    replySubject: string;
    setReplySubject: (v: string) => void;

    replyMessage: string;
    setReplyMessage: (v: string) => void;

    employees: Employee[];   // ✅ FIXED

    anchorEl: HTMLElement | null;
    setAnchorEl: (v: HTMLElement | null) => void;

    showEmoji: boolean;
    setShowEmoji: (v: boolean) => void;

    handleSendReply: () => void;
    handleCancelReply: () => void;

    handleAttachClick: () => void;
    handleInsertLink: () => void;
    handleInsertDriveLink: () => void;
    handleImageClick: () => void;
    handleEmojiInsert: (e: string) => void;

    setOpenTemplateDialog: (v: boolean) => void;

    iconSx: SxProps<Theme>;  // ✅ FIXED (MUI style type)
}


const TicketReplyEditor = ({
    openReply,
    replyTo,
    setReplyTo,
    replySubject,
    setReplySubject,
    replyMessage,
    setReplyMessage,
    employees,
    anchorEl,
    setAnchorEl,
    showEmoji,
    setShowEmoji,
    handleSendReply,
    handleCancelReply,
    handleAttachClick,
    handleInsertLink,
    handleInsertDriveLink,
    handleImageClick,
    handleEmojiInsert,
    setOpenTemplateDialog,
    iconSx,
}: TicketReplyEditorProps) => {
    if (!openReply) return null;

    const openPicker = Boolean(anchorEl);

    return (
        <Box mt={3} p={3} borderRadius={2} bgcolor="#FFFFFF">
            {/* TO ROW */}
            <Box
                display="flex"
                alignItems="center"
                gap={1}
                pb={1.5}
                borderBottom="1px solid #E6E6E6"
                onClick={(e) => {
                    if (!replyTo) setAnchorEl(e.currentTarget);
                }}
                sx={{ cursor: !replyTo ? "pointer" : "default" }}
            >
                <Typography fontSize={14} color="#7A7A7A">
                    To :
                </Typography>

                {replyTo && (
                    <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                        px={1.2}
                        py={0.5}
                        borderRadius="16px"
                        bgcolor="#F1F3F5"
                    >
                        <Avatar sx={{ width: 22, height: 22, fontSize: 11 }}>
                            {replyTo.charAt(0)}
                        </Avatar>

                        <Typography fontSize={13} fontWeight={500}>
                            {replyTo}
                        </Typography>

                        <Box
                            component="span"
                            onClick={() => setReplyTo("")}
                            sx={{
                                cursor: "pointer",
                                fontSize: 16,
                                lineHeight: 1,
                                color: "#7A7A7A",
                                "&:hover": { color: "#000" },
                            }}
                        >
                            ×
                        </Box>
                    </Box>
                )}

                <Popover
                    open={openPicker}
                    anchorEl={anchorEl}
                    onClose={() => setAnchorEl(null)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                >
                    <Box sx={{ width: 260, maxHeight: 250, overflowY: "auto", p: 1 }}>
                        {employees.map((emp) => (
                            <Box
                                key={emp.id}
                                onClick={() => {
                                    setReplyTo(emp.emp_name);
                                    setAnchorEl(null);
                                }}
                                sx={{
                                    p: 1,
                                    borderRadius: 1,
                                    cursor: "pointer",
                                    "&:hover": { backgroundColor: "#F5F5F5" },
                                }}
                            >
                                <Typography fontSize={13} fontWeight={500}>
                                    {emp.emp_name}
                                </Typography>
                                <Typography fontSize={12} color="text.secondary">
                                    {emp.department_name}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Popover>
            </Box>

            {/* SUBJECT */}
            <Box display="flex" alignItems="center" gap={1} pb={1.5} borderBottom="1px solid #E6E6E6">
                <Typography fontSize={13} color="#9E9E9E" minWidth={60}>
                    Subject :
                </Typography>

                <InputBase
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    placeholder="Enter subject"
                    sx={{ flex: 1, fontSize: 14, fontWeight: 500 }}
                />
            </Box>

            {/* MESSAGE */}
            <TextField
                fullWidth
                multiline
                minRows={6}
                variant="standard"
                placeholder="Write your reply..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                InputProps={{ disableUnderline: true }}
                sx={{
                    mt: 1,
                    "& .MuiInputBase-root": { fontSize: 14, lineHeight: 1.6, padding: 0 },
                    "& textarea": { padding: 0 },
                }}
            />

            <Divider sx={{ my: 1.5 }} />

            {/* TOOLBAR */}
            <Stack direction="row" alignItems="center" spacing={1.5}>
                <FormatSizeIcon sx={iconSx} />
                <AttachFileIcon sx={iconSx} onClick={handleAttachClick} />
                <LinkIcon sx={iconSx} onClick={handleInsertLink} />
                <InsertEmoticonIcon sx={iconSx} onClick={() => setShowEmoji(!showEmoji)} />
                <CloudOutlinedIcon sx={iconSx} onClick={handleInsertDriveLink} />
                <ImageOutlinedIcon sx={iconSx} onClick={handleImageClick} />
                <PhotoCameraOutlinedIcon sx={iconSx} onClick={handleImageClick} />
                <EditOutlinedIcon sx={iconSx} />
                <AddBoxOutlinedIcon sx={iconSx} onClick={() => setOpenTemplateDialog(true)} />
            </Stack>

            {showEmoji && (
                <Box mt={1} p={1} border="1px solid #E0E0E0" borderRadius={2} display="flex" gap={1}>
                    {["🙂", "👍", "🙏", "😊", "✔️", "🎉", "📩", "⭐"].map(e => (
                        <Typography key={e} sx={{ cursor: "pointer", fontSize: 20 }} onClick={() => handleEmojiInsert(e)}>
                            {e}
                        </Typography>
                    ))}
                </Box>
            )}

            {/* ACTIONS */}
            <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={1} mt={1}>
                <Button onClick={handleCancelReply} sx={{ minWidth: "auto", p: 0.6 }}>
                    <img src={DeleteMail} alt="Cancel" style={{ width: 45, height: 45 }} />
                </Button>

                <Button
                    variant="contained"
                    onClick={handleSendReply}
                    sx={{
                        height: 32,
                        px: 2.2,
                        fontSize: "13px",
                        textTransform: "none",
                        bgcolor: "#505050",
                        borderRadius: "6px",
                        "&:hover": { bgcolor: "#232323" },
                    }}
                >
                    Send
                </Button>
            </Stack>
        </Box>
    );
};

export default TicketReplyEditor;
