import { forwardRef, useState } from "react";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import LinkIcon from "@mui/icons-material/Link";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import ImageIcon from "@mui/icons-material/Image";
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
  onInput: (platform: Platform, value: string) => void;
  onImageUrl: (platform: Platform, url: string) => void;
  imageUrl?: string;
}

const SocialContentBox = forwardRef<HTMLDivElement, Props>(
  (
    {
      platform,
      icon,
      label,
      mediaRef,
      onText,
      onLink,
      onEmoji,
      onImage,
      onAttachment,
      onInput,
      onImageUrl,
      imageUrl = "",
    },
    ref
  ) => {
    const [previewError, setPreviewError] = useState(false);

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setPreviewError(false);
      onImageUrl(platform, e.target.value.trim());
    };

    return (
      <div className="social-content-box">
        {/* Platform header */}
        <div className="social-header">
          <img src={icon} alt={label} />
          <span>{label}</span>
        </div>

        {/* Media preview area */}
        <div ref={mediaRef} className="media-preview-area" />

        {/* Rich text editor */}
        <div
          ref={ref}
          className="editor"
          contentEditable
          suppressContentEditableWarning
          data-platform={platform}
          data-placeholder={`What would you like to share on ${label}?`}
          onInput={(e) =>
            onInput(
              platform,
              (e.currentTarget.innerText || e.currentTarget.textContent || "").trim()
            )
          }
        />

        {/* ✅ Image URL input */}
        <div className="image-url-section">
          <label className="image-url-label">
            <ImageIcon
              fontSize="small"
              style={{ verticalAlign: "middle", marginRight: 4, color: "#555" }}
            />
            Image URL
            <span style={{ color: "#888", fontWeight: 400, marginLeft: 4 }}>
              (optional – paste a public image URL)
            </span>
          </label>
          <input
            type="url"
            className="image-url-input"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={handleUrlChange}
          />

          {/* Live preview */}
          {imageUrl && !previewError && (
            <div className="image-url-preview">
              <img
                src={imageUrl}
                alt="preview"
                onLoad={() => setPreviewError(false)}
                onError={() => setPreviewError(true)}
                style={{
                  maxHeight: 100,
                  maxWidth: "100%",
                  borderRadius: 6,
                  marginTop: 6,
                  objectFit: "cover",
                  border: "1px solid #e0e0e0",
                  display: "block",
                }}
              />
            </div>
          )}
          {imageUrl && previewError && (
            <p style={{ color: "#d32f2f", fontSize: 12, marginTop: 4, marginBottom: 0 }}>
              ⚠️ Cannot load preview — make sure the URL is publicly accessible.
            </p>
          )}
        </div>

        {/* Toolbar */}
        <div className="social-toolbar-container">
          <div className="social-toolbar">
            <TextFieldsIcon onClick={onText} title="Bold" />
            <LinkIcon onClick={() => onLink(platform)} title="Insert link" />
            <EmojiEmotionsIcon onClick={() => onEmoji(platform)} title="Insert emoji" />
            <AttachFileIcon onClick={() => onAttachment(platform)} title="Attach file" />
          </div>
        </div>
      </div>
    );
  }
);

SocialContentBox.displayName = "SocialContentBox";
export default SocialContentBox;