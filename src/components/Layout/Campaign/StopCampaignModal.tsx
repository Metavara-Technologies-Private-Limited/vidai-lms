import { useState } from "react";
import "../../../../src/styles/Campaign/StopCampaignModal.css";
import { toast } from "react-toastify";
import {
  platformIcons,
  type Platform,
} from "../../../constants/campaigns.constants";

interface Props {
  campaignName: string;
  platforms: Platform[];
  onClose: () => void;
  onStop: () => void;
}

export default function StopCampaignModal({
  campaignName,
  platforms,
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
                onClick={() => {
                  onStop();
                  toast.warn("Campaign stopped successfully");
                  onClose();
                }}
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
