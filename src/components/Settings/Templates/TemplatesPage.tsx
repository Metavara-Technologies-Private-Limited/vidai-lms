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

const DEFAULT_TEMPLATE_USE_CASE_NAMES = [
  "Follow-Up",
  "Reminder",
  "Re-engagement",
  "Feedback",
  "No-Show",
  "Appointment",
];

const normalizeUseCaseName = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const sortUseCases = (items: UseCase[]): UseCase[] => {
  const priority = new Map(
    DEFAULT_TEMPLATE_USE_CASE_NAMES.map((name, index) => [
      normalizeUseCaseName(name),
      index,
    ]),
  );

  return [...items].sort((left, right) => {
    const leftKey = normalizeUseCaseName(left.name);
    const rightKey = normalizeUseCaseName(right.name);

    const leftRank = priority.get(leftKey) ?? 99;
    const rightRank = priority.get(rightKey) ?? 99;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return left.name.localeCompare(right.name);
  });
};

const VIRTUAL_USE_CASE_PREFIX = "virtual:";

const withDefaultUseCases = (items: UseCase[]): UseCase[] => {
  const byName = new Map<string, UseCase>();

  for (const item of items) {
    const key = normalizeUseCaseName(item.name);
    if (!key || byName.has(key)) continue;
    byName.set(key, item);
  }

  for (const defaultName of DEFAULT_TEMPLATE_USE_CASE_NAMES) {
    const key = normalizeUseCaseName(defaultName);
    if (byName.has(key)) continue;

    byName.set(key, {
      id: `${VIRTUAL_USE_CASE_PREFIX}${defaultName}`,
      name: defaultName,
      clinic: "",
      is_active: true,
      created_at: "",
    });
  }

  return sortUseCases(Array.from(byName.values()));
};

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

  const resolvedUseCases = React.useMemo(
    () => withDefaultUseCases(useCases),
    [useCases],
  );

  const useCaseOptions = React.useMemo(() => {
    if (resolvedUseCases.length > 0) {
      return Array.from(
        new Set(
          resolvedUseCases.map((useCase) => useCase.name.trim()).filter(Boolean),
        ),
      );
    }

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
  }, [templates, resolvedUseCases]);

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
      const clinicId = clinic.id;
      const data = await UseCaseService.getUseCases(clinicId);
      const safeData = Array.isArray(data) ? data : [];

      const existingNames = new Set(
        safeData.map((useCase) => normalizeUseCaseName(useCase.name)),
      );

      const missingDefaultNames = DEFAULT_TEMPLATE_USE_CASE_NAMES.filter(
        (name) => !existingNames.has(normalizeUseCaseName(name)),
      );

      if (missingDefaultNames.length > 0) {
        await Promise.allSettled(
          missingDefaultNames.map((name) =>
            UseCaseService.createUseCase(clinicId, name),
          ),
        );

        const refreshed = await UseCaseService.getUseCases(clinicId);
        const safeRefreshed = Array.isArray(refreshed) ? refreshed : safeData;
        setUseCases(sortUseCases(safeRefreshed));
        return;
      }

      setUseCases(sortUseCases(safeData));
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
                useCases={resolvedUseCases}
              />
            )}
            {activeTab === "SMS" && (
              <SmsTemplateTable
                data={getFilteredData()}
                onAction={handleAction}
                canEditTemplate={canEditTemplates}
                useCases={resolvedUseCases}
              />
            )}
            {activeTab === "WhatsApp" && (
              <WhatsAppTemplateTable
                data={getFilteredData()}
                onAction={handleAction}
                canEditTemplate={canEditTemplates}
                useCases={resolvedUseCases}
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
            useCases={resolvedUseCases} // ✅ ADDED
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