import "../../../../src/styles/Campaign/AddNewCampaign.css";

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
    <div className="campaign-modal-overlay">
      <div className="campaign-modal">
        <div className="modal-header">
          <h3>Add Campaigns</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <h4 className="modal-subtitle">Choose Campaign Type</h4>

        {/* SOCIAL MEDIA CARD */}
        <div className="campaign-type-card" onClick={onSocialSelect}>
          <div className="card-top">
            <div className="card-icon social">🌐</div>
            <span className="badge paid">Paid & Organic</span>
          </div>

          <h5>Social Media Campaign</h5>
          <p>
            Create campaigns for LinkedIn, Facebook and Instagram with budget
            management and AI-powered content creation.
          </p>

          <ul>
            <li>Multi-platform posting</li>
            <li>Budget allocation & CPC estimates</li>
            <li>Scheduling & Automation</li>
            <li>Platform specific previews</li>
          </ul>
        </div>

        {/* EMAIL CARD */}
        <div className="campaign-type-card" onClick={onEmailSelect}>
          <div className="card-top">
            <div className="card-icon email">✉️</div>
            <span className="badge free">Free</span>
          </div>

          <h5>Email Campaign</h5>
          <p>
            Design and schedule email campaigns with AI-assisted copy, subject
            line, and audience targeting.
          </p>

          <ul>
            <li>Generate email & subject line with AI</li>
            <li>Email preview</li>
            <li>Scheduling & automation</li>
            <li>AI-optimized timing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}