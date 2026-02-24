import {
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Stack,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Visibility from "@mui/icons-material/Visibility";
import { NewTemplateModal } from "../Templates/NewTemplateModal";
import TemplateService from "../../../services/templates.api";
import type { EmailTemplate } from "../../../types/tickets.types";

interface TicketDailogProps {
  /* File Preview */
  previewOpen: boolean;
  previewFile: string | null;
  handlePreviewClose: () => void;

  /* Template Dialog */
  openTemplateDialog: boolean;
  templates: EmailTemplate[];
  selectedTemplate: EmailTemplate | null;
  setSelectedTemplate: (t: EmailTemplate) => void;
  setOpenTemplateDialog: (v: boolean) => void;

  /* Template Insert */
  onInsertTemplate: (tpl: EmailTemplate) => void;

  /* View Template */
  viewTemplateOpen: boolean;
  viewTemplateData: EmailTemplate | null;
  setViewTemplateOpen: (v: boolean) => void;
  setViewTemplateData: (d: EmailTemplate) => void;
}


const TicketDailog = ({
  previewOpen,
  previewFile,
  handlePreviewClose,

  openTemplateDialog,
  templates,
  selectedTemplate,
  setSelectedTemplate,
  setOpenTemplateDialog,
  onInsertTemplate,

  viewTemplateOpen,
  viewTemplateData,
  setViewTemplateOpen,
  setViewTemplateData,
}: TicketDailogProps) => {
  return (
    <>
      {/* ================= FILE PREVIEW DIALOG ================= */}
      <Dialog open={previewOpen} onClose={handlePreviewClose} maxWidth="md" fullWidth>
        <DialogContent sx={{ position: "relative", p: 2 }}>
          <IconButton
            onClick={handlePreviewClose}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>

          {previewFile && (
            <>
              {previewFile.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                <Box component="img" src={previewFile} sx={{ width: "100%", borderRadius: 1 }} />
              ) : (
                <Box component="iframe" src={previewFile} sx={{ width: "100%", height: "70vh", border: "none" }} />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= TEMPLATE SELECTION DIALOG ================= */}
      <Dialog
        open={openTemplateDialog}
        onClose={() => setOpenTemplateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent sx={{ p: 3 }}>
          <Typography fontWeight={700} fontSize={16} mb={2}>
            Insert Email Template
          </Typography>

          <Typography fontSize={13} color="#8A8A8A" mb={2}>
            Select Email Template
          </Typography>

          <Stack spacing={1.5}>
{templates.map((tpl) => {
              const isSelected = selectedTemplate?.id === tpl.id;

              return (
                <Box
                  key={tpl.id}
                  sx={{
                    border: isSelected ? "1px solid #E97B5A" : "1px solid #E6E6E6",
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
                        {tpl.audience_name}
                      </Typography>

                      <Typography fontSize={12} color="#8A8A8A">
                        {tpl.subject}
                      </Typography>
                    </Box>

                    <IconButton
                      onClick={async (e) => {
                        e.stopPropagation();
                        const fullTemplate = await TemplateService.getTemplateById(
                          "mail",
                          String(tpl.id)
                        );

                        setViewTemplateData({ ...fullTemplate, type: "mail" });
                        setViewTemplateOpen(true);
                      }}
                    >
                      <Visibility fontSize="small" sx={{ color: "#5A8AEA" }} />
                    </IconButton>
                  </Stack>
                </Box>
              );
            })}
          </Stack>

          <Stack direction="row" justifyContent="flex-end" spacing={1.5} mt={3}>
            <Button
              variant="outlined"
              onClick={() => setOpenTemplateDialog(false)}
              sx={{ color: "#505050", borderColor: "#505050" }}
            >
              Cancel
            </Button>

<Button
  variant="contained"
  disabled={!selectedTemplate}
  sx={{
    bgcolor: "#505050",
    "&:hover": { bgcolor: "#232323" }
  }}
  onClick={() => {
    if (!selectedTemplate) return;
    onInsertTemplate(selectedTemplate);
  }}
>
  Insert
</Button>

          </Stack>
        </DialogContent>
      </Dialog>

      {/* ================= VIEW TEMPLATE ================= */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <NewTemplateModal
        open={viewTemplateOpen}
        onClose={() => setViewTemplateOpen(false)}
        onSave={() => {}}
        initialData={viewTemplateData as any || undefined}
        mode="view"
      />
    </>
  );
};

export default TicketDailog;
