import "../../../../src/styles/Campaign/CampaignCard.css";
import StopCampaignModal from "../../../components/Layout/Campaign/StopCampaignModal";
import instagramIcon from "./Icons/instagram.png";
import facebookIcon from "./Icons/facebook.png";
import linkedinIcon from "./Icons/linkedin.png";
import emailIcon from "./Icons/Email.png";
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

type CampaignStatus =
  | "Live"
  | "Draft"
  | "Schedule"
  | "Paused"
  | "Stopped"
  | "Completed"
  | "Failed";

type CampaignType = "social" | "email";

interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  start: string;
  end: string;
  platforms: ("facebook" | "instagram" | "linkedin" | "gmail")[];
  leads: number;
  lead_generated: number;
  scheduledAt?: string;
}

interface CampaignCardProps {
  campaign: Campaign;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  onViewDetail: (campaign: Campaign) => void;
  onStatusChange: (id: string, status: CampaignStatus) => void; // already added in your file
  onEdit?: (campaign: Campaign) => void;
}

const campaignTypeIconMap = {
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
}: CampaignCardProps) {
  const isMenuOpen = openMenuId === c.id;
  const menuRef = useRef<HTMLDivElement>(null);
  const [showStopModal, setShowStopModal] = useState(false);

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

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
            {c.platforms.includes("facebook") && (
              <img
                src={facebookIcon}
                className="platform-icon"
                alt="Facebook"
              />
            )}
            {c.platforms.includes("instagram") && (
              <img
                src={instagramIcon}
                className="platform-icon"
                alt="Instagram"
              />
            )}
            {c.platforms.includes("linkedin") && (
              <img
                src={linkedinIcon}
                className="platform-icon"
                alt="LinkedIn"
              />
            )}
            {c.platforms.includes("gmail") && (
              <img src={emailIcon} className="platform-icon" alt="Email" />
            )}
          </div>
        </div>
      </div>

      <div className="card-divider" />

      <div className="card-footer">
        {c.status === "Schedule" && c.scheduledAt ? (
          <span>
            <label>SCHEDULED:</label>{" "}
            {dayjs(c.scheduledAt).format("DD MMM [at] hh:mm A")}
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
          <button
            className="action-btn pause-btn"
            onClick={(e) => {
              e.stopPropagation();

              if (c.status === "Stopped") {
                onStatusChange(c.id, "Live");
                toast.success("Campaign is Live now");
              } else {
                setShowStopModal(true);
              }
            }}
          >
            <img
              src={c.status === "Stopped" ? playIcon : pauseIcon}
              alt="Toggle"
              width={20}
              height={20}
            />
          </button>

          <div className="more-container" ref={menuRef}>
            <button className="action-btn more-btn" onClick={toggleMenu}>
              <img src={moreIcon} alt="More" width={20} height={20} />
            </button>

            {isMenuOpen && (
              <div
                className="context-menu"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="menu-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(null);
                    onEdit?.(c);
                  }}
                >
                  <img src={editIcon} alt="Edit" className="menu-icon" />
                  Edit
                </div>
                <div className="menu-item">
                  <img
                    src={duplicateIcon}
                    alt="Duplicate"
                    className="menu-icon"
                  />
                  Duplicate
                </div>
                <div className="menu-item stop-item">
                  <img src={stopIcon} alt="Stop" className="menu-icon" />
                  Stop
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Stop Modal */}
      {showStopModal && (
        <StopCampaignModal
          campaignName={c.name}
          platforms={c.platforms}
          onClose={() => setShowStopModal(false)}
          onStop={() => {
            onStatusChange(c.id, "Stopped");
            setShowStopModal(false);
          }}
        />
      )}
    </div>
  );
}
