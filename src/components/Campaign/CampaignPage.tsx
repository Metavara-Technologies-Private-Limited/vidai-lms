/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import CampaignCard from "./CampaignCard";
import SocialCampaignModal from "./SocialCampaignModal";
import EmailCampaignModal from "./EmailCampaignModal";
import EditCampaignModal from "./EditCampaignModal";
import { CampaignAPI } from "../../services/campaign.api";

import "../../../styles/Campaign/CampaignPage.css";
import type { Campaign} from "../../types/campaigns.types"
import type { CampaignStatus, Platform } from "../../constants/campaigns.constants";

// ─── Map raw API response → Campaign ────────────────────────────────────────
function mapApiCampaign(raw: any): Campaign {
  // ── Resolve platforms ────────────────────────────────────────────────────
  let platforms: Platform[] = [];

  if (Array.isArray(raw.social_media) && raw.social_media.length > 0) {
    platforms = raw.social_media
      .filter((sc: any) => sc.is_active !== false)
      .map((sc: any) => (sc.platform_name ?? "").toLowerCase())
      .filter(Boolean);
  }

  if (platforms.length === 0 && Array.isArray(raw.platforms)) {
    platforms = raw.platforms.map((p: string) => p.toLowerCase());
  }

  // ── Resolve type ─────────────────────────────────────────────────────────
  const hasEmail = Array.isArray(raw.email) && raw.email.length > 0;
  const type: "social" | "email" = hasEmail ? "email" : "social";

  if (platforms.length === 0 && hasEmail) {
    platforms = ["gmail"];
  }

  // ── Resolve status ───────────────────────────────────────────────────────
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

    // ✅ Map fb_campaign_id from API response
    fb_campaign_id: raw.fb_campaign_id ?? raw.campaigns?.[0]?.fb_campaign_id ?? null,
  };
}

export type CampaignType = "social" | "email";

export default function CampaignPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // ─── Fetch campaigns from backend on mount ───────────────────────────────
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await CampaignAPI.list();
        const raw: any[] = Array.isArray(res.data) ? res.data : [];
        setCampaigns(raw.map(mapApiCampaign));
      } catch (err) {
        console.error("Failed to load campaigns:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  // ─── After creating a campaign, prepend it to list ───────────────────────
  const handleSaveCampaign = (campaign: any) => {
    const mapped = mapApiCampaign(campaign);
    setCampaigns((prev) => [mapped, ...prev]);

    setShowSocialModal(false);
    setShowEmailModal(false);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setShowEditModal(true);
  };

  const handleUpdateCampaign = (updated: Campaign) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    setShowEditModal(false);
  };

  const handleStatusChange = (id: string, status: CampaignStatus) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
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