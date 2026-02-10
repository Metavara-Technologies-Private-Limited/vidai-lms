import "../../../../src/styles/Campaign/CampaignCard.css";

/* ===== ICON IMPORTS ===== */
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
  scheduledAt?: string;
}

interface CampaignCardProps {
  campaign: Campaign;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  onViewDetail: (campaign: Campaign) => void; // ✅ ADDED
}

export default function CampaignCard({
  campaign: c,
  openMenuId,
  setOpenMenuId,
  onViewDetail,
}: CampaignCardProps) {
  const isMenuOpen = openMenuId === c.id;

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(isMenuOpen ? null : c.id);
  };

  return (
    <div className="campaign-card">
      <div className="card-header">
        <div className="title">{c.name}</div>
        <span className={`status ${c.status.toLowerCase()}`}>
          {c.status}
        </span>
      </div>

      <div className="card-row">
        <div>
          <label>Campaign Duration</label>
          <span>
            {c.start} - {c.end}
          </span>
        </div>

        <div>
          <label>Platform</label>
          <div className="platform-icons">
            {c.platforms.includes("facebook") && (
              <img src={facebookIcon} className="platform-icon" alt="Facebook" />
            )}
            {c.platforms.includes("instagram") && (
              <img src={instagramIcon} className="platform-icon" alt="Instagram" />
            )}
            {c.platforms.includes("linkedin") && (
              <img src={linkedinIcon} className="platform-icon" alt="LinkedIn" />
            )}
            {c.platforms.includes("gmail") && (
              <img src={emailIcon} className="platform-icon" alt="Email" />
            )}
          </div>
        </div>
      </div>

      <div className="card-footer">
        <span>
          Leads Generated: <b className="leads">{c.leads}</b>
        </span>

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

          <button className="action-btn pause-btn">
            <img src={pauseIcon} alt="Pause" width={20} height={20} />
          </button>

          <div className="more-container">
            <button className="action-btn more-btn" onClick={toggleMenu}>
              <img src={moreIcon} alt="More" width={20} height={20} />
            </button>

            {isMenuOpen && (
              <div className="context-menu">
                <div className="menu-item">
                  <img src={editIcon} alt="Edit" className="menu-icon" />
                  Edit
                </div>
                <div className="menu-item">
                  <img src={duplicateIcon} alt="Duplicate" className="menu-icon" />
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
    </div>
  );
}
