import { Typography } from "@mui/material";
import "../../styles/Campaign/CampaignHeader.css";
import { useRef, useEffect } from "react";
import { CAMPAIGN_STATUS, type CampaignStatus } from "../../constants/campaigns.constants";
import instagramIcon from "./Icons/instagram.png";
import facebookIcon from "./Icons/facebook.png";
import linkedinIcon from "./Icons/linkedin.png";
import googleAdsIcon from "./Icons/google-ads.png";
import gmailIcon from "./Icons/Email.png";

interface CampaignHeaderProps {
  onAddNew: () => void;
  canAddCampaign?: boolean;
  status: CampaignStatus | "all";
  onStatusChange: (s: CampaignStatus | "all") => void;
  openStatus: boolean;
  setOpenStatus: (v: boolean) => void;
  platform: string;
  onPlatformChange: (p: string) => void;
  openPlatform: boolean;
  setOpenPlatform: (v: boolean) => void;
  // FIX 2: added optional prop to switch campaign tab from parent
  onTabChange?: (tab: "social" | "email") => void;
}

const STATUS_DOTS: Record<string, string> = {
  all:       "#6b7280",
  live:      "#22c55e",
  draft:     "#9ca3af",
  scheduled: "#2563eb",
  paused:    "#f59e0b",
  stopped:   "#6b7280",
  completed: "#16a34a",
  failed:    "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  all:       "Filter by Status",
  live:      "Live",
  draft:     "Draft",
  scheduled: "Scheduled",
  paused:    "Paused",
  stopped:   "Stopped",
  completed: "Completed",
  failed:    "Failed",
};

const PLATFORM_ICONS: Record<string, string> = {
  gmail: gmailIcon,
  facebook: facebookIcon,
  instagram: instagramIcon,
  linkedin: linkedinIcon,
  google_ads: googleAdsIcon,
};

const PLATFORM_LABELS: Record<string, string> = {
  all: "Filter by Platform",
  gmail: "GMail",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  google_ads: "Google Ads",
};

export default function CampaignHeader({
  onAddNew,
  canAddCampaign = true,
  status,
  onStatusChange,
  platform,
  onPlatformChange,
  openStatus,
  setOpenStatus,
  openPlatform,
  setOpenPlatform,
  onTabChange,
}: CampaignHeaderProps) {
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const platformDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(e.target as Node)
      ) {
        setOpenStatus(false);
      }

      if (
        platformDropdownRef.current &&
        !platformDropdownRef.current.contains(e.target as Node)
      ) {
        setOpenPlatform(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setOpenStatus, setOpenPlatform]);

  const isFiltered = status !== "all";
  const currentLabel = STATUS_LABELS[status] ?? status;
  const currentDot = STATUS_DOTS[status] ?? "#6b7280";
  const currentPlatformIcon = PLATFORM_ICONS[platform];
  const currentPlatformLabel = PLATFORM_LABELS[platform] ?? platform;

  // Keep only: all, live, draft, scheduled, paused, stopped, completed, failed
  const statusItems = (
    ["all", ...Object.values(CAMPAIGN_STATUS)] as (CampaignStatus | "all")[]
  );

  // FIX 2: when Gmail selected → switch to Email tab automatically
  const handlePlatformChange = (p: string) => {
    onPlatformChange(p);
    setOpenPlatform(false);
    if (p === "gmail") {
      onTabChange?.("email");
    } else if (p !== "all") {
      onTabChange?.("social");
    }
  };

  return (
    <div className="page-header">
      <Typography variant="h6">Campaigns</Typography>

      <div className="header-right-actions">
        {/* ── Filter by Status Dropdown ── */}
        <div className="header-filter-wrapper" ref={statusDropdownRef}>
          <button
            className={`header-filter-btn ${openStatus ? "open" : ""} ${isFiltered ? "filtered" : ""}`}
            onClick={() => setOpenStatus(!openStatus)}
          >
            <span className="filter-dot" style={{ background: currentDot }} />
            <span className="filter-label">{currentLabel}</span>
            <svg
              className={`filter-chevron ${openStatus ? "rotated" : ""}`}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M2 4l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {openStatus && (
            <div className="header-filter-menu">
              {statusItems.map((item) => (
                <div
                  key={item}
                  className={`header-filter-item ${status === item ? "selected" : ""}`}
                  onClick={() => {
                    onStatusChange(item);
                    setOpenStatus(false);
                  }}
                >
                  <span
                    className="filter-dot"
                    style={{ background: STATUS_DOTS[item] ?? "#6b7280" }}
                  />
                  {STATUS_LABELS[item] ?? item}
                  {status === item && (
                    <svg
                      className="filter-check"
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path
                        d="M2.5 7l3 3 6-6"
                        stroke="#ff6b35"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Filter by Platform Dropdown ── */}
        <div className="header-filter-wrapper" ref={platformDropdownRef}>
          <button
            className={`header-filter-btn ${
              openPlatform ? "open" : ""
            } ${platform !== "all" ? "filtered" : ""}`}
            onClick={() => setOpenPlatform(!openPlatform)}
          >
            {platform !== "all" && (
              <img
                className="platform-icon-img"
                src={currentPlatformIcon}
                alt={platform}
              />
            )}
            <span className="filter-label">{currentPlatformLabel}</span>

            <svg
              className={`filter-chevron ${openPlatform ? "rotated" : ""}`}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M2 4l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {openPlatform && (
            <div className="header-filter-menu">
              {["all", "gmail", "facebook", "instagram", "linkedin", "google_ads"].map(
                (item) => (
                  <div
                    key={item}
                    className={`header-filter-item ${
                      platform === item ? "selected" : ""
                    }`}
                    onClick={() => handlePlatformChange(item)}
                  >
                    {item !== "all" && (
                      <img
                        className="platform-icon-img"
                        src={PLATFORM_ICONS[item]}
                        alt={item}
                      />
                    )}

                    {PLATFORM_LABELS[item] ?? item}

                    {platform === item && (
                      <svg
                        className="filter-check"
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M2.5 7l3 3 6-6"
                          stroke="#ff6b35"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        {/* ── Add New Campaign ── */}
        <button
          className="primary-btn mobile-add-button"
          onClick={onAddNew}
          disabled={!canAddCampaign}
          title={!canAddCampaign ? "No permission to add campaigns" : undefined}
        >
          <span className="mobile-add-button-label">Add New Campaign</span>
        </button>
      </div>
    </div>
  );
}