import { useState } from "react";
import "../../styles/Campaign/StopCampaignModal.css";
import { toast } from "react-toastify";
import {
  platformIcons,
  type Platform,
} from "../../constants/campaigns.constants";
import { CampaignAPI } from "../../services/campaign.api";

interface Props {
  campaignName: string;
  platforms: Platform[];
  campaignId?: string;        // ← new: needed to call Google Ads status API
  onClose: () => void;
  onStop: () => void;
}

export default function StopCampaignModal({
  campaignName,
  platforms,
  campaignId,
  onClose,
  onStop,
}: Props) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform],
    );
  };

  const handleStop = async () => {
    let googlePauseSucceeded = true;

    if (selectedPlatforms.includes("google_ads") && campaignId) {
      try {
        const res = await CampaignAPI.updateGoogleAdsStatus(campaignId, "pause");
        if (!res.data?.success || res.data?.skipped) {
          throw new Error(
            res.data?.error || res.data?.message || "Google Ads pause request was skipped or failed"
          );
        }
        toast.success("Google Ads campaign paused successfully.");
      } catch (err) {
        googlePauseSucceeded = false;
        console.error("[GoogleAds] Failed to pause campaign:", err);
        toast.warn("Google Ads pause failed; campaign was stopped locally.");
      }
    }

    onStop();
    if (googlePauseSucceeded) {
      toast.warn("Campaign stopped successfully");
    }
    onClose();
  };

  return (
    <div className="stop-overlay" onClick={onClose}>
      <div className="stop-modal" onClick={(e) => e.stopPropagation()}>
        <button className="stop-close" onClick={onClose}>
          ✕
        </button>

        {/* ===== STEP 1 : SELECT PLATFORM ===== */}
        {!showConfirm && (
          <>
            <h2 className="stop-title">Stop Campaign ({campaignName})</h2>

            <p className="stop-subtitle">Select platform to stop campaign</p>

            <div className="platform-list">
              {platforms.map((platform) => (
                <div
                  key={platform}
                  className="platform-item"
                  onClick={() => togglePlatform(platform)}
                >
                  <div className="platform-left">
                    <img src={platformIcons[platform]} alt={platform} />
                    <span>
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </span>
                  </div>

                  <div
                    className={`checkbox ${
                      selectedPlatforms.includes(platform) ? "checked" : ""
                    }`}
                  />
                </div>
              ))}
            </div>

            <div className="stop-actions">
              <button className="cancel-btn" onClick={onClose}>
                Cancel
              </button>

              <button
                className="stop-btn"
                disabled={selectedPlatforms.length === 0}
                onClick={() => setShowConfirm(true)}
              >
                Stop
              </button>
            </div>
          </>
        )}

        /* ===== STEP 2 : CONFIRMATION ===== */

        {/* ===== STEP 2 : CONFIRMATION ===== */}
        {showConfirm && (
          <>
            <div className="confirm-icon">⏸</div>

            <h2 className="confirm-title">Stop Campaign</h2>

            <p className="confirm-text">
              Do you really want to stop the <b>{campaignName}</b> campaign?
            </p>

            <div className="stop-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowConfirm(false)}
              >
                No
              </button>

              <button
                className="stop-btn"
                onClick={handleStop}
              >
                Yes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}