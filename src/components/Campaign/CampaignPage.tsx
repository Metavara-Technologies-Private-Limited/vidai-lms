/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// ─────────────────────────────────────────────────────────────────────────────
// CAUSE 2 FIX: Removed the useEffect that called CampaignAPI.list() directly.
// CampaignsScreen.tsx (via Redux fetchCampaign thunk) is now the single owner
// of all campaign fetching. This component receives campaigns via Redux store,
// not via its own API call.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import CampaignCard from "./CampaignCard";
import SocialCampaignModal from "./SocialCampaignModal";
import EmailCampaignModal from "./EmailCampaignModal";
import EditCampaignModal from "./EditCampaignModal";

import "../../../styles/Campaign/CampaignPage.css";
import type { Campaign } from "../../types/campaigns.types";
import type { CampaignStatus } from "../../constants/campaigns.constants";
import {
  fetchCampaign,
  selectCampaign,
  selectCampaignLoading,
} from "../../store/campaignSlice";
import type { AppDispatch } from "../../store";

export type CampaignType = "social" | "email";

export default function CampaignPage() {
  // FIX (Cause 2): Removed local useState<Campaign[]> + useEffect that called
  // CampaignAPI.list() directly. Now reads from Redux — same data that
  // CampaignsScreen already fetched. Zero extra API calls.
  const dispatch = useDispatch<AppDispatch>();
  const rawCampaigns = useSelector(selectCampaign);
  const loading = useSelector(selectCampaignLoading);

  // Map the Redux CampaignAPIType[] → the Campaign shape this component uses.
  // This reuses the same mapping logic that was here originally.
  const campaigns: Campaign[] = (rawCampaigns ?? []).map((raw: any) => {
    let platforms: any[] = [];

    if (Array.isArray(raw.social_media) && raw.social_media.length > 0) {
      platforms = raw.social_media
        .filter((sc: any) => sc.is_active !== false)
        .map((sc: any) => (sc.platform_name ?? "").toLowerCase())
        .filter(Boolean);
    }

    if (
      platforms.length === 0 &&
      Array.isArray(raw.select_ad_accounts) &&
      raw.select_ad_accounts.length > 0
    ) {
      platforms = raw.select_ad_accounts
        .filter(Boolean)
        .map((p: string) => p.toLowerCase());
    }

    if (platforms.length === 0 && Array.isArray(raw.platforms)) {
      platforms = raw.platforms.map((p: string) => p.toLowerCase());
    }

    const hasEmail = Array.isArray(raw.email) && raw.email.length > 0;
    const type: "social" | "email" = hasEmail ? "email" : "social";

    if (platforms.length === 0 && hasEmail) {
      platforms = ["gmail"];
    }

    const statusMap: Record<string, CampaignStatus> = {
      live: "Live",
      draft: "Draft",
      scheduled: "Scheduled",
      stopped: "Stopped",
    };

    return {
      id: raw.id ?? raw.campaign_id,
      name: raw.campaign_name ?? raw.name ?? "",
      description: raw.campaign_description ?? "",
      type,
      status: statusMap[(raw.status ?? "").toLowerCase()] ?? "Draft",
      start: raw.start_date ?? raw.start ?? "",
      end: raw.end_date ?? raw.end ?? "",
      platforms,
      leads: raw.leads ?? 0,
      lead_generated: raw.lead_generated ?? 0,
      scheduledAt: raw.scheduled_at ?? raw.scheduledAt ?? null,
      budget_data: raw.budget_data ?? {},
      campaign_content: raw.campaign_content ?? "",
      total_spend: raw.total_spend ?? 0,
      cpc: raw.cpc ?? 0,
      fb_campaign_id:
        raw.fb_campaign_id ?? raw.campaigns?.[0]?.fb_campaign_id ?? null,
    };
  });

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // After creating a campaign, re-fetch from server to get the new record
  const handleSaveCampaign = (_campaign: any) => {
    setShowSocialModal(false);
    setShowEmailModal(false);
    dispatch(fetchCampaign());
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setShowEditModal(true);
  };

  const handleUpdateCampaign = (_updated: Campaign) => {
    setShowEditModal(false);
    // Re-fetch so Redux store reflects the server's updated data
    dispatch(fetchCampaign());
  };

  // Status change is handled optimistically in the Redux slice already
  // (updateCampaignStatus thunk). If you use that thunk from CampaignsScreen,
  // this handler is only needed if CampaignPage is rendered independently.
  const handleStatusChange = (id: string, status: CampaignStatus) => {
    // Optimistic local update via Redux slice (no extra API call)
    // Import and dispatch updateCampaignStatus if needed here.
    console.log("Status change:", id, status);
  };

  return (
    <div className="campaign-page">
      {/* ================= HEADER ACTIONS ================= */}
      <div className="campaign-actions">
        <button
          className="add-campaign-btn"
          onClick={() => setShowSocialModal(true)}
        >
          + Add Social Campaign
        </button>

        <button
          className="add-campaign-btn secondary"
          onClick={() => setShowEmailModal(true)}
        >
          + Add Email Campaign
        </button>
      </div>

      {/* ================= MODALS ================= */}
      {showSocialModal && (
        <SocialCampaignModal
          onClose={() => setShowSocialModal(false)}
          onSave={handleSaveCampaign}
        />
      )}

      {showEmailModal && (
        <EmailCampaignModal
          onClose={() => setShowEmailModal(false)}
          onSave={handleSaveCampaign}
        />
      )}

      {showEditModal && editingCampaign && (
        <EditCampaignModal
          campaign={editingCampaign}
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdateCampaign}
        />
      )}

      {/* ================= CAMPAIGN CARDS ================= */}
      {loading ? (
        <div className="campaign-loading">Loading campaigns...</div>
      ) : (
        <div className="campaign-grid">
          {campaigns.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              onViewDetail={(campaign) => console.log(campaign)}
              onEdit={handleEdit}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}