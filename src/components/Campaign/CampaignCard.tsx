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
import { CampaignAPI } from "../../services/campaign.api";

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

  const computedStatus = (() => {
    if (c.status !== CAMPAIGN_STATUS.SCHEDULED || !c.selected_start) {
      return c.status;
    }

    const now = dayjs();

    const scheduledAt = dayjs(c.selected_start.replace("Z", ""));

    return now.isAfter(scheduledAt, "minute")
      ? CAMPAIGN_STATUS.LIVE
      : CAMPAIGN_STATUS.SCHEDULED;
  })();

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
          <button
            className="action-btn pause-btn"
            disabled={!canEditCampaign}
            title={
              !canEditCampaign ? "No permission to edit campaigns" : undefined
            }
            onClick={async (e) => {
              e.stopPropagation();
              if (!canEditCampaign) return;
              if (computedStatus === CAMPAIGN_STATUS.STOPPED) {
                let shouldSetLive = true;

                // ── Enable FB Insta Ads ──
                if (
                  platforms.includes("facebook") ||
                  platforms.includes("instagram")
                ) {
                  try {
                    await CampaignAPI.updateFacebookStatus(c.id, "enable");

                    toast.success(
                      "Facebook/Instagram campaign enabled successfully.",
                    );
                  } catch (err) {
                    shouldSetLive = false;

                    console.error("[Facebook] Failed to enable campaign:", err);

                    toast.warn(
                      "Facebook enable failed; campaign remains stopped locally.",
                    );
                  }
                }

                // ── Enable Google Ads ──
                if (platforms.includes("google_ads")) {
                  try {
                    const res = await CampaignAPI.updateGoogleAdsStatus(
                      c.id,
                      "enable",
                    );

                    // ✅ FIX: skipped means campaign not found in Google Ads yet
                    // (e.g. Zapier callback hasn't fired or campaign was just created).
                    // Treat as a soft warning — still allow local status to go live.
                    if (res.data?.skipped) {
                      toast.warn(
                        "Google Ads campaign not found yet — it may still be creating. Campaign set to Live locally.",
                      );
                      // do NOT set shouldSetLive = false; let local status update proceed
                    } else if (!res.data?.success) {
                      // Hard failure — actual API error
                      shouldSetLive = false;
                      toast.warn(
                        res.data?.error ||
                          "Google Ads enable failed; campaign remains stopped locally.",
                      );
                    } else {
                      toast.success(
                        "Google Ads campaign enabled successfully.",
                      );
                    }
                  } catch (err) {
                    // ✅ FIX: network/server errors are hard failures
                    shouldSetLive = false;
                    console.error(
                      "[GoogleAds] Failed to enable campaign:",
                      err,
                    );
                    toast.warn(
                      "Google Ads enable failed; campaign remains stopped locally.",
                    );
                  }
                }

                // ── Enable LinkedIn ──
                if (platforms.includes("linkedin")) {
                  try {
                    await CampaignAPI.updateLinkedInStatus(c.id, "ACTIVE");
                    toast.success("LinkedIn campaign enabled successfully.");
                  } catch (err) {
                    shouldSetLive = false;
                    console.error("[LinkedIn] Failed to enable campaign:", err);
                    toast.warn(
                      "LinkedIn enable failed; campaign remains stopped locally.",
                    );
                  }
                }

                if (shouldSetLive) {
                  onStatusChange(c.id, CAMPAIGN_STATUS.LIVE);
                  toast.success("Campaign is Live now");
                }
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
          campaignName={c.name}
          platforms={platforms}
          campaignId={c.id}
          onClose={() => setShowStopModal(false)}
          onStop={async () => {
            let shouldStop = true;

            // ── Stop FB/Insta ──
            if (
              platforms.includes("facebook") ||
              platforms.includes("instagram")
            ) {
              try {
                await CampaignAPI.updateFacebookStatus(c.id, "disable");

                toast.success(
                  "Facebook/Instagram campaign stopped successfully.",
                );
              } catch (err) {
                shouldStop = false;

                console.error("[Facebook] Failed to stop campaign:", err);

                toast.warn(
                  "Facebook stop failed; campaign remains live locally.",
                );
              }
            }

            // ── Stop Google Ads ──
            if (platforms.includes("google_ads")) {
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
            if (platforms.includes("linkedin")) {
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
              onStatusChange(c.id, CAMPAIGN_STATUS.STOPPED);

              toast.success("Campaign stopped successfully.");
            }

            setShowStopModal(false);
          }}
        />
      )}
    </div>
  );
}