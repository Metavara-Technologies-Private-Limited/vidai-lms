import { Typography } from "@mui/material";
import "../../styles/Campaign/CampaignHeader.css";
import { useRef, useEffect } from "react";
import { CAMPAIGN_STATUS, type CampaignStatus } from "../../constants/campaigns.constants";

interface CampaignHeaderProps {
  onAddNew: () => void;
  canAddCampaign?: boolean;
  status: CampaignStatus | "all";
  onStatusChange: (s: CampaignStatus | "all") => void;
  openStatus: boolean;
  setOpenStatus: (v: boolean) => void;
}

const STATUS_DOTS: Record<string, string> = {
  all:       "#6b7280",
  live:      "#22c55e",
  draft:     "#9ca3af",
  schedule:  "#2563eb",
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
  schedule:  "Schedule",
  scheduled: "Scheduled",
  paused:    "Paused",
  stopped:   "Stopped",
  completed: "Completed",
  failed:    "Failed",
};

export default function CampaignHeader({
  onAddNew,
  canAddCampaign = true,
  status,
  onStatusChange,
  openStatus,
  setOpenStatus,
}: CampaignHeaderProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenStatus(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setOpenStatus]);

  const isFiltered = status !== "all";
  const currentLabel = STATUS_LABELS[status] ?? status;
  const currentDot = STATUS_DOTS[status] ?? "#6b7280";

  return (
    <div className="page-header">
      <Typography variant="h6">Campaigns</Typography>

      <div className="header-right-actions">

        {/* ── Filter Dropdown ── */}
        <div className="header-filter-wrapper" ref={dropdownRef}>
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
              {(["all", ...Object.values(CAMPAIGN_STATUS)] as (CampaignStatus | "all")[]).map((item) => (
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
                    <svg className="filter-check" width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7l3 3 6-6" stroke="#ff6b35" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              ))}
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