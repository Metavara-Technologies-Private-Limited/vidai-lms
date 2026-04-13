import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import TemplateService from "../../services/templates.api";
import { NewTemplateModal } from "../Settings/Templates/NewTemplateModal";

export type TemplateListItem = {
  id: string | number;
  audience_name?: string;
  name?: string;
  subject?: string;
  email_body?: string;
  body?: string;
};

type ReviewRequestTemplateDialogProps = {
  open: boolean;
  mode: "email" | "sms" | "whatsapp";
  onClose: () => void;
  onInsert: (template: TemplateListItem) => void;
};

const getTemplateTypeLabel = (mode: "email" | "sms" | "whatsapp") => {
  if (mode === "email") return "Email";
  if (mode === "sms") return "SMS";
  return "WhatsApp";
};

const getTemplateApiType = (mode: "email" | "sms" | "whatsapp") =>
  mode === "email" ? "mail" : mode;

const normalizeTemplateContent = (value: string) => {
  const html = value.trim();
  if (!html) return "";

  if (typeof document === "undefined") {
    return html.replace(/<[^>]+>/g, "").trim();
  }

  const container = document.createElement("div");
  container.innerHTML = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr)>/gi, "\n")
    .replace(/<(ul|ol)>/gi, "\n")
    .replace(/<li>/gi, "- ");

  const decoded = container.textContent || container.innerText || "";

  return decoded
    .replace(/\u00a0/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const getTemplateTitle = (tpl: TemplateListItem) =>
  (tpl.audience_name || tpl.name || "Untitled Template").trim();

const getTemplateSubText = (
  tpl: TemplateListItem,
  mode: "email" | "sms" | "whatsapp",
) => {
  if (mode === "email") {
    return (tpl.subject || "No subject").trim();
  }

  const body = normalizeTemplateContent(tpl.body || tpl.email_body || "");

  if (!body) return "No content";
  return body.length > 60 ? `${body.slice(0, 60)}...` : body;
};

const ReviewRequestTemplateDialog = ({
  open,
  mode,
  onClose,
  onInsert,
}: ReviewRequestTemplateDialogProps) => {
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateListItem | null>(null);
  const [viewTemplateOpen, setViewTemplateOpen] = useState(false);
  const [viewTemplateData, setViewTemplateData] = useState<Record<
    string,
    unknown
  > | null>(null);

  const templateTypeLabel = useMemo(() => getTemplateTypeLabel(mode), [mode]);

  useEffect(() => {
    if (!open) return;

    const loadTemplates = async () => {
      try {
        const response = await TemplateService.getTemplates(
          getTemplateApiType(mode),
        );

        const list = Array.isArray(response)
          ? response
          : (response?.results ?? []);

        setTemplates(Array.isArray(list) ? (list as TemplateListItem[]) : []);
      } catch {
        setTemplates([]);
      }
    };

    loadTemplates();
  }, [open, mode]);

  const handleClose = () => {
    setSelectedTemplate(null);
    onClose();
  };

  const handleInsert = () => {
    if (!selectedTemplate) return;
    onInsert(selectedTemplate);
    setSelectedTemplate(null);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogContent sx={{ p: 3 }}>
          <Typography fontWeight={700} fontSize={16} mb={2}>
            Insert {templateTypeLabel} Template
          </Typography>

          <Typography fontSize={13} color="#8A8A8A" mb={2}>
            Select {templateTypeLabel} Template
          </Typography>

          <Stack
            spacing={1.5}
            sx={{
              maxHeight: "230px",
              overflowY: "auto",
              paddingRight: "4px",
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#F5F5F5",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#D0D0D0",
                borderRadius: "4px",
                transition: "backgroundColor 0.2s",
                "&:hover": {
                  backgroundColor: "#B0B0B0",
                },
              },
            }}
          >
            {templates.map((tpl) => {
              const isSelected = selectedTemplate?.id === tpl.id;

              return (
                <Box
                  key={tpl.id}
                  sx={{
                    border: isSelected
                      ? "1px solid #E97B5A"
                      : "1px solid #E6E6E6",
                    borderRadius: "10px",
                    p: 2,
                    cursor: "pointer",
                    backgroundColor: isSelected ? "#FFF7F4" : "#FAFAFA",
                  }}
                  onClick={() => setSelectedTemplate(tpl)}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: "2px solid #E97B5A",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isSelected && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: "#E97B5A",
                          }}
                        />
                      )}
                    </Box>

                    <Box flex={1}>
                      <Typography fontWeight={600} fontSize={14}>
                        {getTemplateTitle(tpl)}
                      </Typography>

                      <Typography fontSize={12} color="#8A8A8A">
                        {getTemplateSubText(tpl, mode)}
                      </Typography>
                    </Box>

                    <IconButton
                      onClick={async (e) => {
                        e.stopPropagation();
                        const fullTemplate =
                          await TemplateService.getTemplateById(
                            getTemplateApiType(mode),
                            String(tpl.id),
                          );

                        setViewTemplateData({
                          ...fullTemplate,
                          id: String(tpl.id),
                          type: mode,
                        });
                        setViewTemplateOpen(true);
                      }}
                    >
                      <VisibilityIcon
                        fontSize="small"
                        sx={{ color: "#5A8AEA" }}
                      />
                    </IconButton>
                  </Stack>
                </Box>
              );
            })}

            {templates.length === 0 && (
              <Typography fontSize={13} color="#8A8A8A">
                No {templateTypeLabel} templates found.
              </Typography>
            )}
          </Stack>

          <Stack direction="row" justifyContent="flex-end" spacing={1.5} mt={3}>
            <Button
              variant="outlined"
              onClick={handleClose}
              sx={{ color: "#505050", borderColor: "#505050" }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              disabled={!selectedTemplate}
              sx={{
                bgcolor: "#505050",
                "&:hover": { bgcolor: "#232323" },
              }}
              onClick={handleInsert}
            >
              Insert
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      <NewTemplateModal
        open={viewTemplateOpen}
        onClose={() => setViewTemplateOpen(false)}
        onSave={() => {}}
        initialData={viewTemplateData as never}
        mode="view"
      />
    </>
  );
};

export default ReviewRequestTemplateDialog;
