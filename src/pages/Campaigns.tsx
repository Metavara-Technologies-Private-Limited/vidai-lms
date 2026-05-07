// CampaignsScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
// FIXES APPLIED:
//   Cause 1 — useSelector now extracts clinic?.id (primitive) instead of the
//              whole clinic object. The whole object is a new reference on
//              every Redux render, which caused useEffect to re-fire endlessly.
//   Cause 2 — CampaignPage.tsx no longer calls CampaignAPI.list() directly.
//              This file is the ONLY place fetchCampaign() is dispatched.
//   Cause 3 — Modal onSave callbacks re-fetch only when the server has
//              created/edited a record that must be pulled back into Redux.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectClinic } from "../store/clinicSlice";
import { Alert } from "@mui/material";
import "../styles/Campaign/campaigns.css";
import searchIcon from "../components/Campaign/Icons/search.png";
import CampaignHeader from "../components/Campaign/CampaignHeader";
import CampaignCard from "../components/Campaign/CampaignCard";
import {
  fetchCampaign,
  selectCampaign,
  selectCampaignLoading,
  updateCampaignStatus,
} from "../store/campaignSlice";
import { selectUser } from "../store/authSlice";
import type { AppDispatch } from "../store";
import {
  hasAnySubcategoryActionPermission,
  resolveUserRole,
} from "../utils/roleAccess";
import {
  CAMPAIGN_MODE,
  CAMPAIGN_STATUS,
  CAMPAIGN_TABS,
  CAMPAIGN_TYPE,
  PLATFORMS,
  STATUS_MAP,
  type CampaignStatus,
  type CampaignType,
  type Platform,
  type Tab,
} from "../constants/campaigns.constants";
import type { Campaign, CampaignAPIType } from "../types/campaigns.types";

const AddNewCampaign = lazy(
  () => import("../components/Campaign/AddNewCampaign"),
);
const SocialCampaignModal = lazy(
  () => import("../components/Campaign/SocialCampaignModal"),
);
const CampaignDashboard = lazy(
  () => import("../components/Campaign/CampaignDashboard"),
);
const EmailCampaignModal = lazy(
  () => import("../components/Campaign/EmailCampaignModal"),
);
const EditCampaignModal = lazy(
  () => import("../components/Campaign/EditCampaignModal"),
);
const DuplicateCampaignModal = lazy(
  () => import("../components/Campaign/DuplicateCampaignModal"),
);

export default function CampaignsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const rawCampaigns = useSelector(selectCampaign);
  const campaignLoading = useSelector(selectCampaignLoading);
  const user = useSelector(selectUser);
  const authUser = user as unknown as Record<string, unknown> | null;
  const nestedAuthUser =
    authUser?.user && typeof authUser.user === "object"
      ? (authUser.user as Record<string, unknown>)
      : null;
  const role = resolveUserRole(authUser);
  const permissions = authUser?.permissions ?? nestedAuthUser?.permissions;
  const campaignAliases = ["campaigns", "campaign"];
  const canViewCampaigns =
    role === "super_admin" ||
    hasAnySubcategoryActionPermission(permissions, campaignAliases, "view") ||
    hasAnySubcategoryActionPermission(permissions, campaignAliases, "print");
  const canAddCampaigns =
    role === "super_admin" ||
    hasAnySubcategoryActionPermission(permissions, campaignAliases, "add");
  const canEditCampaigns =
    role === "super_admin" ||
    hasAnySubcategoryActionPermission(permissions, campaignAliases, "edit");

  // FIX (Cause 1): Extract only the id (a stable primitive) from the clinic
  // selector. The full clinic object is a new reference on every Redux render,
  // which made the useEffect below fire on every single state update.
  const clinicId = useSelector(
    (state: Parameters<typeof selectClinic>[0]) => selectClinic(state)?.id,
  );

  useEffect(() => {
    if (!canViewCampaigns) return;
    dispatch(fetchCampaign());
    // clinicId is a primitive — fires once on mount, and again only when the
    // user switches clinics in the header. Never fires on unrelated renders.
  }, [dispatch, canViewCampaigns, clinicId]);

  const campaigns = useMemo<Campaign[]>(() => {
    return (rawCampaigns || []).map((api: CampaignAPIType) => {
      const backendStatus = (api.status ?? "").toLowerCase();

      const status =
        STATUS_MAP[backendStatus] ??
        (api.is_active ? CAMPAIGN_STATUS.LIVE : CAMPAIGN_STATUS.DRAFT);

      let platforms: Platform[] = [];
      let type: CampaignType;

      const isEmailCampaign = api.campaign_mode === CAMPAIGN_MODE.EMAIL;

      if (isEmailCampaign) {
        type = CAMPAIGN_TYPE.EMAIL;
        platforms = [PLATFORMS.GMAIL];
      } else {
        type = CAMPAIGN_TYPE.SOCIAL;
        if (Array.isArray(api.social_media) && api.social_media.length > 0) {
          platforms = api.social_media
            .filter((s) => s.is_active !== false)
            .map((s) => s.platform_name ?? "")
            .filter(Boolean) as Platform[];
        } else if (
          Array.isArray(api.select_ad_accounts) &&
          api.select_ad_accounts.length > 0
        ) {
          platforms = api.select_ad_accounts.filter(Boolean) as Platform[];
        }
      }

      return {
        id: api.id,
        name: api.campaign_name ?? "",
        description: api.campaign_description ?? "",
        type,
        status,
        start: api.start_date,
        end: api.end_date,
        platforms,
        leads: api.lead_generated ?? 0,
        lead_generated: api.lead_generated ?? 0,
        scheduledAt: api.email?.[0]?.scheduled_at ?? api.selected_start,
        selected_start: api.selected_start,
        enter_time: api.enter_time,
        objective: api.campaign_objective,
        budget_data: api.budget_data,
        image_url: api.image_url ?? null,
        platform_data: api.platform_data ?? {},
        campaign_content:
          api.campaign_content || api.email?.[0]?.email_body || "",
        total_spend: api.total_spend ?? 0,
        cpc: api.cpc ?? 0,
        // Mailchimp metrics
        impressions: api.impressions ?? 0,
        clicks: api.clicks ?? 0,
        emails_sent: api.emails_sent ?? 0,
        bounces: api.bounces ?? 0,
        unsubscribes: api.unsubscribes ?? 0,
        conversion_rate: api.conversion_rate ?? 0,
        // FB Insights
        fb_likes: api.fb_likes ?? 0,
        fb_comments: api.fb_comments ?? 0,
        fb_shares: api.fb_shares ?? 0,
        fb_impressions: api.fb_impressions ?? 0,
        fb_reach: api.fb_reach ?? 0,
        fb_clicks: api.fb_clicks ?? 0,
      };
    });
  }, [rawCampaigns]);

  // UI States
  const [tab, setTab] = useState<Tab>(CAMPAIGN_TABS.ALL);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CampaignStatus | "all">("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openStatus, setOpenStatus] = useState(false);
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [duplicatingCampaign, setDuplicatingCampaign] =
    useState<Campaign | null>(null);

  const handleStatusChange = (id: string, status: CampaignStatus) => {
    dispatch(updateCampaignStatus({ id, status }));
  };

  const handleEdit = (campaign: Campaign) => {
    if (!canEditCampaigns) return;
    setEditingCampaign(campaign);
    setShowEditModal(true);
  };

  const handleDuplicate = (campaign: Campaign) => {
    if (!canEditCampaigns) return;
    setDuplicatingCampaign(campaign);
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const tabOk = tab === CAMPAIGN_TABS.ALL || c.type === tab;
      const searchOk = (c.name ?? "")
        .toLowerCase()
        .includes(search.toLowerCase());
      const statusOk = status === "all" || c.status === status;
      return tabOk && searchOk && statusOk;
    });
  }, [campaigns, tab, search, status]);

  const allCount = campaigns.length;
  const socialCount = campaigns.filter(
    (c) => c.type === CAMPAIGN_TYPE.SOCIAL,
  ).length;
  const emailCount = campaigns.filter(
    (c) => c.type === CAMPAIGN_TYPE.EMAIL,
  ).length;

  if (selectedCampaign) {
    return (
      <Suspense
        fallback={<div className="empty-state">Loading campaign...</div>}
      >
        <CampaignDashboard
          campaign={selectedCampaign}
          onBack={() => setSelectedCampaign(null)}
        />
      </Suspense>
    );
  }

  return (
    <div className="campaigns-page">
      {!canViewCampaigns && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You do not have permission to view campaigns.
        </Alert>
      )}

      {/* ── Header: title + filter dropdown + add button ── */}
      <CampaignHeader
        onAddNew={() => setShowAddCampaign(true)}
        canAddCampaign={canAddCampaigns}
        status={status}
        onStatusChange={setStatus}
        openStatus={openStatus}
        setOpenStatus={setOpenStatus}
      />

      <div className="filters-row">
        {/* Header Filter */}
        <div className="tabs">
          <button
            className={`tab-btn ${tab === CAMPAIGN_TABS.ALL ? "active" : ""}`}
            onClick={() => setTab(CAMPAIGN_TABS.ALL)}
          >
            All Campaigns ({allCount})
          </button>

          <button
            className={`tab-btn ${
              tab === CAMPAIGN_TABS.SOCIAL ? "active" : ""
            }`}
            onClick={() => setTab(CAMPAIGN_TABS.SOCIAL)}
          >
            Social Media Campaigns ({socialCount})
          </button>

          <button
            className={`tab-btn ${tab === CAMPAIGN_TABS.EMAIL ? "active" : ""}`}
            onClick={() => setTab(CAMPAIGN_TABS.EMAIL)}
          >
            Email Campaigns ({emailCount})
          </button>
        </div>

        {/* Header Search */}
        <div className="right-filters">
          <div className="search-input">
            <img src={searchIcon} alt="Search" className="search-icon" />
            <input
              placeholder="Search by Campaign name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="campaign-grid">
        {!canViewCampaigns ? null : campaignLoading ? (
          <div className="empty-state">Loading campaigns...</div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="empty-state">No campaigns found</div>
        ) : (
          filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              onViewDetail={setSelectedCampaign}
              onStatusChange={handleStatusChange}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              canEditCampaign={canEditCampaigns}
            />
          ))
        )}
      </div>

      {/* ================= MODALS ================= */}
      {showAddCampaign && (
        <Suspense fallback={null}>
          <AddNewCampaign
            onClose={() => setShowAddCampaign(false)}
            onSocialSelect={() => {
              setShowAddCampaign(false);
              setShowSocialModal(true);
            }}
            onEmailSelect={() => {
              setShowAddCampaign(false);
              setShowEmailModal(true);
            }}
          />
        </Suspense>
      )}
      {showSocialModal && (
        <Suspense fallback={null}>
          <SocialCampaignModal
            onClose={() => setShowSocialModal(false)}
            onSave={() => {
              setShowSocialModal(false);
              // Re-fetch: new campaign created server-side, pull into Redux
              dispatch(fetchCampaign());
            }}
          />
        </Suspense>
      )}
      {showEmailModal && (
        <Suspense fallback={null}>
          <EmailCampaignModal
            onClose={() => setShowEmailModal(false)}
            onSave={() => {
              setShowEmailModal(false);
              // Re-fetch: new campaign created server-side, pull into Redux
              dispatch(fetchCampaign());
            }}
          />
        </Suspense>
      )}
      {showEditModal && editingCampaign && (
        <Suspense fallback={null}>
          <EditCampaignModal
            campaign={editingCampaign}
            onClose={() => setShowEditModal(false)}
            onSave={() => {
              setShowEditModal(false);
              // Re-fetch: edited campaign updated server-side, pull into Redux
              dispatch(fetchCampaign());
            }}
          />
        </Suspense>
      )}
      {duplicatingCampaign && (
        <Suspense fallback={null}>
          <DuplicateCampaignModal
            campaign={duplicatingCampaign}
            onClose={() => setDuplicatingCampaign(null)}
            onSave={() => {
              setDuplicatingCampaign(null);
              // Re-fetch: duplicate created server-side, pull into Redux
              dispatch(fetchCampaign());
            }}
          />
        </Suspense>
      )}
    </div>
  );
}