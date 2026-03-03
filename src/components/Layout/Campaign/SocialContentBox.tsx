import { forwardRef } from "react";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import LinkIcon from "@mui/icons-material/Link";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import PermMediaIcon from "@mui/icons-material/PermMedia";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import type { Platform } from "../../../types/campaigns.types";

interface Props {
  platform: Platform;
  icon: string;
  label: string;
  mediaRef: React.RefObject<HTMLDivElement | null>;
  onText: () => void;
  onLink: (platform: Platform) => void;
  onEmoji: (platform: Platform) => void;
  onImage: (platform: Platform) => void;
  onAttachment: (platform: Platform) => void;
  onInput: (platform: Platform, value: string) => void; // ✅ NEW
}

const SocialContentBox = forwardRef<HTMLDivElement, Props>(
  ({ platform, icon, label, mediaRef, onText, onLink, onEmoji, onImage, onAttachment, onInput }, ref) => {
    return (
      <div className="social-content-box">
        <div className="social-header">
          <img src={icon} alt={label} />
          <span>{label}</span>
        </div>

        <div ref={mediaRef} className="media-preview-area" />

        <div
          ref={ref}
          className="editor"
          contentEditable
          suppressContentEditableWarning
          data-platform={platform}
          data-placeholder={`What would you like to share on ${label}?`}
          // ✅ NEW: fires on every keystroke, emoji, paste, bold etc.
          onInput={(e) => onInput(platform, (e.currentTarget.innerText || e.currentTarget.textContent || "").trim())}
        />

        <div className="social-toolbar-container">
          <div className="social-toolbar">
            <TextFieldsIcon onClick={onText} />
            <LinkIcon onClick={() => onLink(platform)} />
            <EmojiEmotionsIcon onClick={() => onEmoji(platform)} />
            <PermMediaIcon onClick={() => onImage(platform)} />
            <AttachFileIcon onClick={() => onAttachment(platform)} />
          </div>
        </div>
      </div>
    );
  },
);

SocialContentBox.displayName = "SocialContentBox";
export default SocialContentBox;