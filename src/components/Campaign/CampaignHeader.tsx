import { Typography } from "@mui/material";
import "../../styles/Campaign/CampaignHeader.css";

interface CampaignHeaderProps {
  onAddNew: () => void;
  canAddCampaign?: boolean;
}

export default function CampaignHeader({
  onAddNew,
  canAddCampaign = true,
}: CampaignHeaderProps) {
  return (
    <div className="page-header">
      <Typography variant="h6">Campaigns</Typography>
      <button
        className="primary-btn mobile-add-button"
        onClick={onAddNew}
        disabled={!canAddCampaign}
        title={!canAddCampaign ? "No permission to add campaigns" : undefined}
      >
        <span className="mobile-add-button-label">Add New Campaign</span>
      </button>
    </div>
  );
}
