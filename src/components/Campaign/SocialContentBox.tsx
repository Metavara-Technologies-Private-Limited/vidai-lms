import { forwardRef } from "react";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import LinkIcon from "@mui/icons-material/Link";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import type { Platform } from "../../constants/campaigns.constants";
import "../../styles/Campaign/SocialContentBox.css";

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
  // ── Upload image props ──
  imageFile?: File | null;
  imagePreview?: string;
  onUploadClick?: () => void;
  onRemoveImage?: () => void;
  onPreviewClick?: (src: string, name: string) => void;
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
      onAttachment,
      onInput,
      onImageUrl: _onImageUrl, // FIX TS6133: kept in interface for prop compatibility, prefixed to suppress unused warning
      imageUrl = "",
      imageFile = null,
      imagePreview = "",
      onUploadClick,
      onRemoveImage,
      onPreviewClick,
    },
    ref
  ) => {


const displayImage = imagePreview || imageUrl;
    const hasFile = !!imageFile || !!displayImage;
    const previewName = imageFile?.name || imageUrl || "Ad image preview";

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
              (
                e.currentTarget.innerText ||
                e.currentTarget.textContent ||
                ""
              ).trim(),
            )
          }
        />

        {/* ── Upload Image Document section (replaces Image URL field) ── */}
        <div
          style={{
            marginTop: 10,
            borderTop: "1px dashed #e5e7eb",
            paddingTop: 10,
            paddingLeft: 12,
            paddingRight: 12,
            paddingBottom: 4,
          }}
        >
          {/* Upload button row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={onUploadClick}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                fontSize: 12,
                borderRadius: 6,
                border: "1px solid #6366f1",
                backgroundColor: hasFile ? "#eef2ff" : "#fff",
                color: "#4f46e5",
                cursor: "pointer",
                fontWeight: 500,
                transition: "background 0.15s",
              }}
            >
              🖼️ {hasFile ? "Change Image Document" : "Upload Image Document"}
            </button>

            {hasFile && (
              <button
                type="button"
                onClick={onRemoveImage}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 10px",
                  fontSize: 12,
                  borderRadius: 6,
                  border: "1px solid #fca5a5",
                  backgroundColor: "#fff1f2",
                  color: "#dc2626",
                  cursor: "pointer",
                }}
              >
                ✕ Remove
              </button>
            )}

            {hasFile && (
              <span style={{ fontSize: 11, color: "#6b7280" }}>
                📄 <strong>{imageFile!.name}</strong>{" "}
                ({(imageFile!.size / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>

          {/* ── Inline image preview (click to enlarge) ── */}
          {hasFile && displayImage && (
            <div
              style={{
                marginTop: 10,
                position: "relative",
                display: "inline-block",
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
                cursor: "pointer",
              }}
              onClick={() => onPreviewClick && onPreviewClick(displayImage, previewName)}
              title="Click to enlarge"
            >
              <img
                src={displayImage}
                alt="Ad image preview"
                style={{
                  display: "block",
                  maxWidth: 220,
                  maxHeight: 140,
                  objectFit: "cover",
                  borderRadius: 8,
                }}
                onError={(e) => {
                  // Hide the image and collapse the container if load fails
                  (e.target as HTMLImageElement).style.display = "none";
                  const container = (e.target as HTMLImageElement).parentElement;
                  if (container) {
                    container.style.display = "none";
                  }
                }}
              />
              {/* Hover overlay */}
              <div
                className="img-hover-overlay"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0,
                  transition: "opacity 0.18s",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#fff",
                  fontWeight: 600,
                  pointerEvents: "none",
                }}
              >
                🔍 Preview
              </div>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="social-toolbar-container">
          <div className="social-toolbar">
            <span title="Bold">
              <TextFieldsIcon onClick={onText} />
            </span>
            <span title="Insert link">
              <LinkIcon onClick={() => onLink(platform)} />
            </span>
            <span title="Insert emoji">
              <EmojiEmotionsIcon onClick={() => onEmoji(platform)} />
            </span>
            <span title="Attach file">
              <AttachFileIcon onClick={() => onAttachment(platform)} />
            </span>
          </div>
        </div>
      </div>
    );
  }
);

SocialContentBox.displayName = "SocialContentBox";
export default SocialContentBox;