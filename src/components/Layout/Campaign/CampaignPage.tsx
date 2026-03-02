/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import CampaignCard from "./CampaignCard";
import SocialCampaignModal from "./SocialCampaignModal";
import EmailCampaignModal from "./EmailCampaignModal";

import "../../styles/Campaign/CampaignPage.css";
import EditCampaignModal from "./EditCampaignModal";

export type CampaignType = "social" | "email";

export type CampaignStatus =
  | "Live"
  | "Draft"
  | "Schedule"
  | "Paused"
  | "Stopped"
  | "Completed"
  | "Failed";

export default function CampaignPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null); 

  const handleSaveCampaign = (campaign: any) => {
    setCampaigns((prev) => [...prev, campaign]);
    setShowSocialModal(false);
    setShowEmailModal(false);
  };
  const handleEdit = (campaign: any) => {
    setEditingCampaign(campaign);
    setShowEditModal(true);
  };
  const handleUpdateCampaign = (updated: any) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c)),
    );
    setShowEditModal(false);
  };

  const handleStatusChange = (id: string, status: CampaignStatus) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c)),
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
      <div className="campaign-grid">
        {campaigns.map((c) => (
          <CampaignCard
            key={c.id}
            campaign={c}
            openMenuId={openMenuId}
            setOpenMenuId={setOpenMenuId}
            onViewDetail={(campaign) => console.log(campaign)}
            onEdit={handleEdit} // ADD THIS
            onStatusChange={handleStatusChange} // ADD THIS
          />
        ))}
      </div>
    </div>
  );
}
