import { Typography } from "@mui/material";
import "../../../../src/styles/Campaign/CampaignHeader.css";

interface CampaignHeaderProps {
  onAddNew: () => void;
}

export default function CampaignHeader({ onAddNew }: CampaignHeaderProps) {
  return (
    <div className="page-header">
      <Typography variant="h6">Campaigns</Typography>
      <button className="primary-btn" onClick={onAddNew}>
        Add New Campaign
      </button>
    </div>
  );
}