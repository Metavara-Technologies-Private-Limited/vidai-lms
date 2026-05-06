import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Box, CircularProgress, Alert } from "@mui/material";
import { useSelector } from "react-redux";
import TemplateService, {
  type APITemplateType,
} from "../../../services/templates.api";
import styles from "../../../styles/Template/TemplatesPage.module.css";
import type {
  EmailTemplate,
  SMSTemplate,
  WhatsAppTemplate,
  Template,
  TemplatesState,
  TemplateFilters,
} from "../../../types/templates.types";
import { selectUser } from "../../../store/authSlice";
import { selectClinic } from "../../../store/clinicSlice";
import {
  hasAnySubcategoryActionPermission,
  resolveUserRole,
} from "../../../utils/roleAccess";
import UseCaseService, { type UseCase } from "../../../services/usecase.api"; // ✅ ADDED

const TemplateHeader = lazy(() =>
  import("./TemplateHeader").then((module) => ({
    default: module.TemplateHeader,
  })),
);
const EmailTemplateTable = lazy(() =>
  import("./EmailTemplateTable").then((module) => ({
    default: module.EmailTemplateTable,
  })),
);
const SmsTemplateTable = lazy(() =>
  import("./SmsTemplateTable").then((module) => ({
    default: module.SmsTemplateTable,
  })),
);
const WhatsAppTemplateTable = lazy(() =>
  import("./WhatsAppTemplateTable").then((module) => ({
    default: module.WhatsAppTemplateTable,
  })),
);
const NewTemplateModal = lazy(() =>
  import("./NewTemplateModal").then((module) => ({
    default: module.NewTemplateModal,
  })),
);
const DeleteConfirmModal = lazy(() =>
  import("./DeleteConfirmModal").then((module) => ({
    default: module.DeleteConfirmModal,
  })),
);
const CopyDetailsModal = lazy(() =>
  import("./CopyDetailsModal").then((module) => ({
    default: module.CopyDetailsModal,
  })),
);

const TemplatesPage: React.FC = () => {
  const user = useSelector(selectUser);
  const clinic = useSelector(selectClinic);
  const authUser = user as unknown as Record<string, unknown> | null;
  const role = resolveUserRole(authUser);
  const permissions = authUser?.permissions;
  const templateAliases = ["templates", "template"];
  const canViewTemplates =
    role === "super_admin" ||
    hasAnySubcategoryActionPermission(permissions, templateAliases, "view") ||
    hasAnySubcategoryActionPermission(permissions, templateAliases, "print");
  const canAddTemplates =
    role === "super_admin" ||
    hasAnySubcategoryActionPermission(permissions, templateAliases, "add");
  const canEditTemplates =
    role === "super_admin" ||
    hasAnySubcategoryActionPermission(permissions, templateAliases, "edit");

  const [activeTab, setActiveTab] = useState("Email");
  const [isModalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ NEW: State for all templates to show counts immediately
  const [templates, setTemplates] = useState<TemplatesState>({
    mail: [],
    sms: [],
    whatsapp: [],
  });

  // ✅ Single useCases state (removed duplicate)
  const [useCases, setUseCases] = useState<UseCase[]>([]);

  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [viewMode, setViewMode] = useState<"create" | "edit" | "view">(
    "create",
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [templateInAction, setTemplateInAction] = useState<Template | null>(
    null,
  );
  const [activeFilters, setActiveFilters] = useState<TemplateFilters | null>(
    null,
  );

  const useCaseOptions = React.useMemo(() => {
    const allTemplates = [
      ...templates.mail,
      ...templates.sms,
      ...templates.whatsapp,
    ];

    return Array.from(
      new Set(
        allTemplates
          .map((template) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const tAny = template as any;
            return ((tAny.use_case || tAny.useCase || "") as string).trim();
          })
          .filter(Boolean),
      ),
    );
  }, [templates]);

  const getApiType = (tab: string): APITemplateType => {
    if (tab === "Email") return "mail";
    return tab.toLowerCase() as APITemplateType;
  };

  // ✅ UPDATED: Fetch everything at once
  const loadTemplates = useCallback(async () => {
    if (!canViewTemplates) {
      setTemplates({ mail: [], sms: [], whatsapp: [] });
      return;
    }
    setLoading(true);
    try {
      const [mailData, smsData, waData] = await Promise.all([
        TemplateService.getTemplates("mail"),
        TemplateService.getTemplates("sms"),
        TemplateService.getTemplates("whatsapp"),
      ]);

      setTemplates({
        mail: Array.isArray(mailData) ? mailData : [],
        sms: Array.isArray(smsData) ? smsData : [],
        whatsapp: Array.isArray(waData) ? waData : [],
      });
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      toast.error("Error loading templates");
    } finally {
      setLoading(false);
    }
  }, [canViewTemplates]);

  // ✅ ADDED: fetch use cases for the current clinic
  const loadUseCases = useCallback(async () => {
    if (!clinic?.id) return;
    try {
      const data = await UseCaseService.getUseCases(clinic.id);
      setUseCases(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch use cases:", error);
    }
  }, [clinic?.id]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates, clinic?.id]);

  useEffect(() => { loadUseCases(); }, [loadUseCases]); // ✅ ADDED

  const getFilteredData = () => {
    const currentType = getApiType(activeTab);
    let filtered = [...templates[currentType]];

    if (searchQuery) {
      filtered = filtered.filter((t) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tAny = t as any;
        const name = (tAny.audience_name || tAny.name || "") as string;
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }
    if (activeFilters?.useCase) {
      filtered = filtered.filter((t) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tAny = t as any;
        const useCase = (tAny.use_case || tAny.useCase || "") as string;
        return useCase.toLowerCase() === activeFilters.useCase?.toLowerCase();
      });
    }
    return filtered;
  };

  const handleAction = (
    type: "view" | "edit" | "copy" | "delete",
    template: EmailTemplate | SMSTemplate | WhatsAppTemplate,
  ) => {
    if ((type === "edit" || type === "delete") && !canEditTemplates) {
      toast.warning("You do not have permission to edit templates.");
      return;
    }

    const typeMapping: Record<string, string> = {
      Email: "email",
      SMS: "sms",
      WhatsApp: "whatsapp",
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tAny = template as any;
    const mappedTemplate = {
      ...template,
      type: typeMapping[activeTab],
      name: (tAny.audience_name || tAny.name || "") as string,
      body: (tAny.email_body || tAny.body || "") as string,
      useCase:
        typeof tAny.use_case === "object"
          ? tAny.use_case?.name
          : useCases.find((u) => u.id === tAny.use_case)?.name ||
            tAny.useCase ||
            "General",
      createdBy: (tAny.created_by_name || tAny.createdBy || "Admin") as string,
    } as Template & Record<string, unknown>;

    setTemplateInAction(mappedTemplate as Template);

    if (type === "view") {
      setViewMode("view");
      setActiveTemplate(mappedTemplate as Template);
      setModalOpen(true);
    } else if (type === "edit") {
      setViewMode("edit");
      setActiveTemplate(mappedTemplate as Template);
      setModalOpen(true);
    } else if (type === "copy") {
      setIsCopyModalOpen(true);
    } else if (type === "delete") {
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!canEditTemplates) return;
    if (!templateInAction) return;
    try {
      await TemplateService.deleteTemplate(
        getApiType(activeTab),
        templateInAction.id,
      );
      toast.success("Template deleted successfully!");
      loadTemplates();
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Delete failed");
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <Box
      className={styles.pageContainer}
      sx={{
        width: "auto",
        height: "100%",
        overflowY: "auto",
        pb: 2,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {!canViewTemplates && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You do not have permission to view templates.
        </Alert>
      )}
      <Suspense fallback={<Box sx={{ p: 2 }} />}>
        <TemplateHeader
          onTabChange={(tab) => {
            setActiveTab(tab);
          }}
          onNewTemplate={() => {
            setViewMode("create");
            setActiveTemplate(null);
            setModalOpen(true);
          }}
          onSearch={setSearchQuery}
          onApplyFilters={(filters) =>
            setActiveFilters(filters as TemplateFilters | null)
          }
          useCaseOptions={useCaseOptions}
          canAddTemplate={canAddTemplates}
          counts={{
            email: templates.mail.length,
            sms: templates.sms.length,
            whatsapp: templates.whatsapp.length,
          }}
        />
      </Suspense>

      <Box
        className={styles.tableWrapper}
        sx={{ flexGrow: 1, overflowY: "auto", p: 0, position: "relative" }}
      >
        {!canViewTemplates ? null : loading && templates.mail.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Suspense
            fallback={
              <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
                <CircularProgress size={24} />
              </Box>
            }
          >
            {activeTab === "Email" && (
              <EmailTemplateTable
                data={getFilteredData()}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onAction={handleAction as any}
                canEditTemplate={canEditTemplates}
                useCases={useCases}
              />
            )}
            {activeTab === "SMS" && (
              <SmsTemplateTable
                data={getFilteredData()}
                onAction={handleAction}
                canEditTemplate={canEditTemplates}
                useCases={useCases}
              />
            )}
            {activeTab === "WhatsApp" && (
              <WhatsAppTemplateTable
                data={getFilteredData()}
                onAction={handleAction}
                canEditTemplate={canEditTemplates}
                useCases={useCases}
              />
            )}
          </Suspense>
        )}
      </Box>

      {isModalOpen && (
        <Suspense fallback={null}>
          <NewTemplateModal
            open={isModalOpen}
            onClose={() => setModalOpen(false)}
            onSave={() => {
              loadTemplates();
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            initialData={(activeTemplate as any) || undefined}
            mode={viewMode}
            useCases={useCases} // ✅ ADDED
            onUseCaseCreated={loadUseCases} // ✅ ADDED
          />
        </Suspense>
      )}

      {isDeleteModalOpen && (
        <Suspense fallback={null}>
          <DeleteConfirmModal
            open={isDeleteModalOpen}
            templateName={
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (templateInAction as any)?.audience_name ||
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (templateInAction as any)?.name ||
              ""
            }
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
          />
        </Suspense>
      )}

      {isCopyModalOpen && (
        <Suspense fallback={null}>
          <CopyDetailsModal
            open={isCopyModalOpen}
            template={templateInAction || ({} as Template)}
            onClose={() => setIsCopyModalOpen(false)}
            onCopySuccess={() => toast.success("Details copied to clipboard!")}
          />
        </Suspense>
      )}
    </Box>
  );
};

export default TemplatesPage;