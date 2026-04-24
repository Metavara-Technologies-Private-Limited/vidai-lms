import "../../../src/styles/Campaign/CampaignCard.css";
import StopCampaignModal from "./StopCampaignModal";
import viewIcon from "./Icons/view.png";
import pauseIcon from "./Icons/pause.png";
import moreIcon from "./Icons/more.png";
import editIcon from "./Icons/edit.png";
import duplicateIcon from "./Icons/duplicate.png";
import stopIcon from "./Icons/stop.png";
import playIcon from "./Icons/play-button.png";
import socialCardIcon from "./Icons/social-media-card.png";
import mailCardIcon from "./Icons/mail-card.png";
import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import type { Campaign } from "../../types/campaigns.types";
import { CAMPAIGN_STATUS, platformIcons, PLATFORMS, type CampaignStatus } from "../../constants/campaigns.constants";
import { formatScheduleTime } from "../../utils/campaigns.utils";
import { CampaignAPI } from "../../services/campaign.api"; // ← added

const INACTIVE_STATUSES = new Set<CampaignStatus>([
  CAMPAIGN_STATUS.STOPPED,
  CAMPAIGN_STATUS.COMPLETED,
  CAMPAIGN_STATUS.FAILED,
]);

interface CampaignCardProps {
  campaign: Campaign;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  onViewDetail: (campaign: Campaign) => void;
  onStatusChange: (id: string, status: CampaignStatus) => void;
  onEdit?: (campaign: Campaign) => void;
  onDuplicate?: (campaign: Campaign) => void;
  canEditCampaign?: boolean;
}

const campaignTypeIconMap: Record<Campaign["type"], string> = {
  social: socialCardIcon,
  email: mailCardIcon,
};

export default function CampaignCard({
  campaign: c,
  openMenuId,
  setOpenMenuId,
  onViewDetail,
  onStatusChange,
  onEdit,
  onDuplicate,
  canEditCampaign = true,
}: CampaignCardProps) {
  const isMenuOpen = openMenuId === c.id;
  const menuRef = useRef<HTMLDivElement>(null);
  const [showStopModal, setShowStopModal] = useState(false);

  const platforms = c.platforms ?? [];

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(isMenuOpen ? null : c.id);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setOpenMenuId]);

  return (
    <div
      className="campaign-card"
      onClick={() => onViewDetail(c)}
      style={{ cursor: "pointer" }}
    >
      <div className="card-header">
        <div className="title">
          <div className={`title-icon-box ${c.type}`}>
            <img
              src={campaignTypeIconMap[c.type]}
              alt={c.type}
              className="title-icon"
            />
          </div>
          <span className="title-text">{c.name}</span>
        </div>
        <span className={`status ${c.status.toLowerCase()}`}>{c.status}</span>
      </div>

      <div className="card-row">
        <div>
          <label>Campaign Duration:</label>
          <span>
            {dayjs(c.start).format("DD/MM/YYYY")}
            {" - "}
            {dayjs(c.end).format("DD/MM/YYYY")}
          </span>
        </div>

        <div>
          <label>Platform:</label>
          <div className="platform-icons">
            {platforms.map((p) => (
              <img
                key={p}
                src={platformIcons[p]}
                className="platform-icon"
                alt={p}
              />
            ))}

            {platforms.length === 0 && c.type === "email" && (
              <img
                src={platformIcons[PLATFORMS.GMAIL]}
                className="platform-icon"
                alt="Email"
              />
            )}
          </div>
        </div>
      </div>

      <div className="card-divider" />

      <div className="card-footer">
        {c.status === CAMPAIGN_STATUS.SCHEDULED ? (
          <span>
            <label>SCHEDULED:</label>{" "}
            {formatScheduleTime(c.selected_start, c.enter_time)}
          </span>
        ) : (
          <span>
            Leads Generated: <b className="leads">{c.lead_generated}</b>
          </span>
        )}

        <div className="action-buttons">
          <button
            className="action-btn view-btn"
            title="View Campaign"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetail(c);
            }}
          >
            <img src={viewIcon} alt="View" width={20} height={20} />
          </button>

          {/* ── Pause / Play button ── */}
          <button
            className="action-btn pause-btn"
            disabled={!canEditCampaign}
            title={!canEditCampaign ? "No permission to edit campaigns" : undefined}
            onClick={async (e) => {                          // ← async added
              e.stopPropagation();
              if (!canEditCampaign) return;
              if (c.status === CAMPAIGN_STATUS.STOPPED) {
                // ── Enable in Google Ads if applicable ──
                if (platforms.includes("google_ads")) {      // ← added
                  try {                                      // ← added
                    await CampaignAPI.updateGoogleAdsStatus(c.id, "enable"); // ← added
                  } catch (err) {                            // ← added
                    console.error("[GoogleAds] Failed to enable campaign:", err); // ← added
                    toast.warn("Campaign enabled locally, but Google Ads enable failed."); // ← added
                  }                                          // ← added
                }                                            // ← added
                onStatusChange(c.id, CAMPAIGN_STATUS.LIVE);
                toast.success("Campaign is Live now");
              } else {
                setShowStopModal(true);
              }
            }}
          >
            <img
              src={c.status === CAMPAIGN_STATUS.STOPPED ? playIcon : pauseIcon}
              alt="Toggle"
              width={20}
              height={20}
            />
          </button>

          <div className="more-container" ref={menuRef}>
            <button
              className="action-btn more-btn"
              onClick={toggleMenu}
              disabled={!canEditCampaign}
              title={!canEditCampaign ? "No permission to edit campaigns" : undefined}
            >
              <img src={moreIcon} alt="More" width={20} height={20} />
            </button>

            {isMenuOpen && (
              <div
                className="context-menu"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className={`menu-item ${!canEditCampaign ? "disabled" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canEditCampaign) return;
                    setOpenMenuId(null);
                    onEdit?.(c);
                  }}
                  title={!canEditCampaign ? "No permission to edit campaigns" : undefined}
                  style={
                    !canEditCampaign
                      ? { opacity: 0.5, cursor: "not-allowed", pointerEvents: "none" }
                      : undefined
                  }
                >
                  <img src={editIcon} alt="Edit" className="menu-icon" />
                  Edit
                </div>
                <div
                  className={`menu-item ${!canEditCampaign ? "disabled" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canEditCampaign) return;
                    setOpenMenuId(null);
                    onDuplicate?.(c);
                  }}
                  title={!canEditCampaign ? "No permission to edit campaigns" : undefined}
                  style={
                    !canEditCampaign
                      ? { opacity: 0.5, cursor: "not-allowed", pointerEvents: "none" }
                      : undefined
                  }
                >
                  <img src={duplicateIcon} alt="Duplicate" className="menu-icon" />
                  Duplicate
                </div>
                {!INACTIVE_STATUSES.has(c.status) && (
                  <div
                    className={`menu-item stop-item ${!canEditCampaign ? "disabled" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!canEditCampaign) return;
                      setOpenMenuId(null);
                      setShowStopModal(true);
                    }}
                    title={!canEditCampaign ? "No permission to edit campaigns" : undefined}
                    style={
                      !canEditCampaign
                        ? { opacity: 0.5, cursor: "not-allowed", pointerEvents: "none" }
                        : undefined
                    }
                  >
                    <img src={stopIcon} alt="Stop" className="menu-icon" />
                    Stop
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showStopModal && (
        <StopCampaignModal
          campaignName={c.name}
          platforms={platforms}
          campaignId={c.id}           
          onClose={() => setShowStopModal(false)}
          onStop={() => {
            onStatusChange(c.id, CAMPAIGN_STATUS.STOPPED);
            setShowStopModal(false);
          }}
        />
      )}
    </div>
  );
}