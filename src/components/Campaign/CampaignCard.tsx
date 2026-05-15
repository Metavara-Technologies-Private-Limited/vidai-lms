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
import {
  CAMPAIGN_STATUS,
  platformIcons,
  PLATFORMS,
  type CampaignStatus,
} from "../../constants/campaigns.constants";
import {
  formatScheduleTime,
  getComputedCampaignStatus,
} from "../../utils/campaigns.utils";
import { CampaignAPI } from "../../services/campaign.api";

const INACTIVE_STATUSES = new Set<CampaignStatus>([
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
  const [showResumeModal, setShowResumeModal] = useState(false);

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

  const computedStatus = getComputedCampaignStatus(c);

  return (
    <div
      className="campaign-card"
      tabIndex={0}
      role="button"
      onClick={() => onViewDetail(c)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onViewDetail(c);
        }
      }}
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
        <span className={`status ${computedStatus.toLowerCase()}`}>
          {computedStatus}
        </span>
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
        {computedStatus === CAMPAIGN_STATUS.SCHEDULED ? (
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
          {(computedStatus === CAMPAIGN_STATUS.LIVE ||
            computedStatus === CAMPAIGN_STATUS.PAUSED) && (
            <button
              className="action-btn pause-btn"
              disabled={!canEditCampaign}
              title={
                !canEditCampaign ? "No permission to edit campaigns" : undefined
              }
              onClick={(e) => {
                e.stopPropagation();

                if (!canEditCampaign) return;

                if (computedStatus === CAMPAIGN_STATUS.PAUSED) {
                  setShowResumeModal(true);
                } else {
                  setShowStopModal(true);
                }
              }}
            >
              <img
                src={
                  computedStatus === CAMPAIGN_STATUS.PAUSED
                    ? playIcon
                    : pauseIcon
                }
                alt="Toggle"
                width={20}
                height={20}
              />
            </button>
          )}

          <div className="more-container" ref={menuRef}>
            <button
              className="action-btn more-btn"
              onClick={toggleMenu}
              disabled={!canEditCampaign}
              title={
                !canEditCampaign ? "No permission to edit campaigns" : undefined
              }
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
                  title={
                    !canEditCampaign
                      ? "No permission to edit campaigns"
                      : undefined
                  }
                  style={
                    !canEditCampaign
                      ? {
                          opacity: 0.5,
                          cursor: "not-allowed",
                          pointerEvents: "none",
                        }
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
                  title={
                    !canEditCampaign
                      ? "No permission to edit campaigns"
                      : undefined
                  }
                  style={
                    !canEditCampaign
                      ? {
                          opacity: 0.5,
                          cursor: "not-allowed",
                          pointerEvents: "none",
                        }
                      : undefined
                  }
                >
                  <img
                    src={duplicateIcon}
                    alt="Duplicate"
                    className="menu-icon"
                  />
                  Duplicate
                </div>
                {!INACTIVE_STATUSES.has(computedStatus) && (
                  <div
                    className={`menu-item stop-item ${!canEditCampaign ? "disabled" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!canEditCampaign) return;
                      setOpenMenuId(null);
                      setShowStopModal(true);
                    }}
                    title={
                      !canEditCampaign
                        ? "No permission to edit campaigns"
                        : undefined
                    }
                    style={
                      !canEditCampaign
                        ? {
                            opacity: 0.5,
                            cursor: "not-allowed",
                            pointerEvents: "none",
                          }
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
        title = "Stop Campaign"
        confirmText = "Stop"
          campaignName={c.name}
          platforms={platforms}
          campaignId={c.id}
          onClose={() => setShowStopModal(false)}
          onStop={async (selectedPlatforms?: string[]) => {
            const chosenPlatforms = selectedPlatforms ?? platforms;
            let shouldStop = true;

            // ── Stop FB/Insta ──
            // ── Stop Facebook ──
            if (chosenPlatforms.includes("facebook")) {
              try {
                await CampaignAPI.updateFacebookStatus(
                  c.id,
                  "disable",
                  "facebook",
                );

                toast.success("Facebook campaign stopped successfully.");
              } catch (err) {
                shouldStop = false;

                console.error("[Facebook] Failed to stop campaign:", err);

                toast.warn("Facebook stop failed.");
              }
            }

            // ── Stop Instagram ──
            if (chosenPlatforms.includes("instagram")) {
              try {
                await CampaignAPI.updateFacebookStatus(
                  c.id,
                  "disable",
                  "instagram",
                );

                toast.success("Instagram campaign stopped successfully.");
              } catch (err) {
                shouldStop = false;

                console.error("[Instagram] Failed to stop campaign:", err);

                toast.warn("Instagram stop failed.");
              }
            }

            // ── Stop Google Ads ──
            if (chosenPlatforms.includes("google_ads")) {
              try {
                const res = await CampaignAPI.updateGoogleAdsStatus(
                  c.id,
                  "pause",
                );

                if (!res.data?.success) {
                  shouldStop = false;

                  toast.warn(res.data?.error || "Google Ads stop failed.");
                } else {
                  toast.success("Google Ads campaign stopped successfully.");
                }
              } catch (err) {
                shouldStop = false;

                console.error("[GoogleAds] Failed to stop campaign:", err);

                toast.warn("Google Ads stop failed.");
              }
            }

            // ── Stop LinkedIn ──
            if (chosenPlatforms.includes("linkedin")) {
              try {
                await CampaignAPI.updateLinkedInStatus(c.id, "PAUSED");

                toast.success("LinkedIn campaign stopped successfully.");
              } catch (err) {
                shouldStop = false;

                console.error("[LinkedIn] Failed to stop campaign:", err);

                toast.warn("LinkedIn stop failed.");
              }
            }

            if (shouldStop) {
              onStatusChange(c.id, CAMPAIGN_STATUS.PAUSED);

              toast.success("Campaign stopped successfully.");
            }

            setShowStopModal(false);
          }}
        />
      )}
      {showResumeModal && (
        <StopCampaignModal
          title="Resume Campaign"
          confirmText="Resume"
          campaignName={c.name}
          platforms={platforms}
          campaignId={c.id}
          onClose={() => setShowResumeModal(false)}
          onStop={async (selectedPlatforms?: string[]) => {
            let shouldSetLive = true;

            const chosenPlatforms = selectedPlatforms ?? platforms;

            // ── Enable FB/Insta ──
            // ── Enable Facebook ──
if (chosenPlatforms.includes("facebook")) {
  try {
    await CampaignAPI.updateFacebookStatus(
      c.id,
      "enable",
      "facebook",
    );

    toast.success(
      "Facebook campaign enabled successfully.",
    );
  } catch (err) {
    shouldSetLive = false;

    console.error(
      "[Facebook] Failed to enable campaign:",
      err,
    );

    toast.warn("Facebook enable failed.");
  }
}

// ── Enable Instagram ──
if (chosenPlatforms.includes("instagram")) {
  try {
    await CampaignAPI.updateFacebookStatus(
      c.id,
      "enable",
      "instagram",
    );

    toast.success(
      "Instagram campaign enabled successfully.",
    );
  } catch (err) {
    shouldSetLive = false;

    console.error(
      "[Instagram] Failed to enable campaign:",
      err,
    );

    toast.warn("Instagram enable failed.");
  }
}

            // ── Enable Google Ads ──
            if (chosenPlatforms.includes("google_ads")) {
              try {
                const res = await CampaignAPI.updateGoogleAdsStatus(
                  c.id,
                  "enable",
                );

                if (!res.data?.success && !res.data?.skipped) {
                  shouldSetLive = false;

                  toast.warn(res.data?.error || "Google Ads enable failed.");
                } else {
                  toast.success("Google Ads enabled successfully.");
                }
              } catch (err) {
                shouldSetLive = false;

                console.error("[GoogleAds] Failed to enable campaign:", err);

                toast.warn("Google Ads enable failed.");
              }
            }

            // ── Enable LinkedIn ──
            if (chosenPlatforms.includes("linkedin")) {
              try {
                await CampaignAPI.updateLinkedInStatus(c.id, "ACTIVE");

                toast.success("LinkedIn campaign enabled successfully.");
              } catch (err) {
                shouldSetLive = false;

                console.error("[LinkedIn] Failed to enable campaign:", err);

                toast.warn("LinkedIn enable failed.");
              }
            }

            if (shouldSetLive) {
              onStatusChange(c.id, CAMPAIGN_STATUS.LIVE);

              toast.success("Campaign is Live now");
            }

            setShowResumeModal(false);
          }}
        />
      )}
    </div>
  );
}
