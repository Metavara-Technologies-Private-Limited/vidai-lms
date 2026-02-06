import "../../../../src/styles/Campaign/CampaignHeader.css";

interface CampaignHeaderProps {
  onAddNew: () => void;
}

export default function CampaignHeader({ onAddNew }: CampaignHeaderProps) {
  return (
    <div className="page-header">
      <h2>Campaigns</h2>
      <button className="primary-btn" onClick={onAddNew}>
        ＋ Add New Campaign
      </button>
    </div>
  );
}