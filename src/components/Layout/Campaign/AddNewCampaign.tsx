import { IconButton, Modal, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import socialCardIcon from "./Icons/social-media-card.png";
import mailCardIcon from "./Icons/mail-card.png";
import "../../../../src/styles/Campaign/AddNewCampaign.css";
import { Box } from "@mui/system";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const FeatureList = ({ features }: { features: string[] }) => (
  <ul>
    {features.map((feature, index) => (
      <li key={index}>
        <CheckCircleIcon sx={{ fontSize: 18, color: "#2ecc71" }} />
        {feature}
      </li>
    ))}
  </ul>
);

interface AddNewCampaignProps {
  onClose: () => void;
  onSocialSelect: () => void;
  onEmailSelect: () => void;
}

export default function AddNewCampaign({
  onClose,
  onSocialSelect,
  onEmailSelect,
}: AddNewCampaignProps) {
  return (
    <Modal open={true} onClose={onClose}>
      <Box className="add-campaign-modal">
        <div className="add-modal-header">
          <Typography variant="h6">Add Campaign</Typography>
          <IconButton onClick={onClose} className="close-btn">
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
        <div className="modal-divider" />
        <div className="add-modal-subtitle">Choose Campaign Type</div>
        {/* SOCIAL MEDIA CARD */}
        <div
          className="campaign-type-card campaign-type-card-social"
          onClick={onSocialSelect}
        >
          <div className="card-top">
            <div className="card-icon social">
              <img
                src={socialCardIcon}
                alt="Social"
                className="add-title-icon"
              />
            </div>
            <span className="badge paid">Paid & Organic</span>
          </div>

          <div className="add-modal-head">Social Media Campaign</div>
          <p>
            Create campaigns for LinkedIn, Facebook and Instagram with budget
            management and AI-powered content creation.
          </p>

          <FeatureList
            features={[
              "Multi-platform posting",
              "Budget allocation & CPC estimates",
              "Scheduling & Automation",
              "Platform specific previews",
            ]}
          />
        </div>
        {/* EMAIL CARD */}
        <div
          className="campaign-type-card campaign-type-card-mail"
          onClick={onEmailSelect}
        >
          <div className="card-top">
            <div className="card-icon email">
              <img src={mailCardIcon} alt="Email" className="add-title-icon" />
            </div>
            <span className="badge free">Free</span>
          </div>

          <div className="add-modal-head">Email Campaign</div>
          <p>
            Design and schedule email campaigns with AI-assisted copy, subject
            line, and audience targeting.
          </p>

          <FeatureList
            features={[
              "Generate email & subject line with AI",
              "Email preview",
              "Scheduling & automation",
              "AI-optimized timing",
            ]}
          />
        </div>
      </Box>
    </Modal>
  );
}
