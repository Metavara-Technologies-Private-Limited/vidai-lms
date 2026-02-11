import { useState } from "react";
import CampaignCard from "./CampaignCard";
import SocialCampaignModal from "./SocialCampaignModal";
import EmailCampaignModal from "./EmailCampaignModal";

import "../../styles/Campaign/CampaignPage.css";

export type CampaignType = "social" | "email";

export type CampaignStatus =
  | "Live"
  | "Draft"
  | "Schedule"
  | "Paused"
  | "Stopped"
  | "Completed"
  | "Failed";

export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  start: string;
  end: string;
  platforms: ("facebook" | "instagram" | "linkedin" | "gmail")[];
  leads: number;
  scheduledAt?: string;
}


export default function CampaignPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  /* ===== SAVE CAMPAIGN (USED BY BOTH MODALS) ===== */
  const handleSaveCampaign = (campaign: any) => {
    setCampaigns((prev) => [...prev, campaign]);
    setShowSocialModal(false);
    setShowEmailModal(false);
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

      {/* ================= CAMPAIGN CARDS ================= */}
      <div className="campaign-grid">
        {campaigns.map((c) => (
          <CampaignCard
            key={c.id}
            campaign={c}
            openMenuId={openMenuId}
            setOpenMenuId={setOpenMenuId}
            onViewDetail={(campaign) => console.log(campaign)}
          />
        ))}
      </div>
    </div>
  );
}
