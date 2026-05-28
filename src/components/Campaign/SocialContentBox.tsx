import { forwardRef, useCallback } from "react";
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

// ─── Auto-linkify plain URLs typed/pasted into the editor ────────────────────
// Finds bare http(s) URLs in text nodes and wraps them in <a> tags.
// Called on every input event so links appear as you type or paste.
const autoLinkifyEditor = (editorEl: HTMLDivElement) => {
  const URL_PATTERN = /(https?:\/\/[^\s<>"']+)/gi;

  // Walk text nodes only — skip existing <a> tags to avoid double-wrapping
  const walker = document.createTreeWalker(
    editorEl,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        // Skip if inside an <a> tag
        let parent = node.parentElement;
        while (parent && parent !== editorEl) {
          if (parent.tagName === "A") return NodeFilter.FILTER_REJECT;
          parent = parent.parentElement;
        }
        return URL_PATTERN.test(node.textContent || "")
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    }
  );

  const textNodes: Text[] = [];
  let node;
  // Reset lastIndex since we used the regex in acceptNode
  URL_PATTERN.lastIndex = 0;
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }

  if (textNodes.length === 0) return;

  // Save cursor position
  const selection = window.getSelection();
  let savedRange: Range | null = null;
  if (selection && selection.rangeCount > 0) {
    savedRange = selection.getRangeAt(0).cloneRange();
  }

  textNodes.forEach((textNode) => {
    const text = textNode.textContent || "";
    URL_PATTERN.lastIndex = 0;
    if (!URL_PATTERN.test(text)) return;

    URL_PATTERN.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = URL_PATTERN.exec(text)) !== null) {
      // Text before the URL
      if (match.index > lastIndex) {
        frag.appendChild(
          document.createTextNode(text.slice(lastIndex, match.index))
        );
      }
      // The URL — wrap in <a>
      const anchor = document.createElement("a");
      anchor.href = match[0];
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = match[0];
      anchor.style.color = "#2563eb";
      anchor.style.textDecoration = "underline";
      anchor.style.cursor = "pointer";
      frag.appendChild(anchor);
      lastIndex = match.index + match[0].length;
    }

    // Text after last URL
    if (lastIndex < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    textNode.parentNode?.replaceChild(frag, textNode);
  });

  // Restore cursor to end of editor (simplest safe approach after DOM mutation)
  if (savedRange && selection) {
    try {
      selection.removeAllRanges();
      // Try to restore; if the saved range node is gone, move to end
      selection.addRange(savedRange);
    } catch {
      const range = document.createRange();
      range.selectNodeContents(editorEl);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
};

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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // ─── FIX: onInput reads innerHTML to preserve <a> link tags ─────────────
    // Previously innerText stripped all HTML so links were lost on every keystroke.
    // Now we store innerHTML so anchor tags survive and display correctly in the
    // view page (CampaignTabContent renders with dangerouslySetInnerHTML).
    // We also run autoLinkifyEditor to convert bare URLs into clickable links.
    const handleInput = useCallback(
      (e: React.FormEvent<HTMLDivElement>) => {
        const el = e.currentTarget;

        // Auto-linkify bare URLs as user types
        autoLinkifyEditor(el);

        // Read innerHTML (not innerText) so anchor tags are preserved in state
        const htmlContent = el.innerHTML || "";
        onInput(platform, htmlContent);
      },
      [platform, onInput]
    );

    // ─── FIX: onPaste — convert pasted plain-text URLs to links ─────────────
    // When user pastes a URL, browsers paste as plain text. We intercept,
    // insert as plain text, then immediately linkify.
    const handlePaste = useCallback(
      (e: React.ClipboardEvent<HTMLDivElement>) => {
        const text = e.clipboardData.getData("text/plain");
        if (!text) return;

        // Let default paste happen for non-URL pastes, linkify will handle it
        // For URL-only pastes (the whole pasted string is a URL), insert as link directly
        const trimmed = text.trim();
        const isFullUrl = /^https?:\/\/\S+$/.test(trimmed);

        if (isFullUrl) {
          e.preventDefault();
          const anchor = document.createElement("a");
          anchor.href = trimmed;
          anchor.target = "_blank";
          anchor.rel = "noopener noreferrer";
          anchor.textContent = trimmed;
          anchor.style.color = "#2563eb";
          anchor.style.textDecoration = "underline";
          anchor.style.cursor = "pointer";

          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(anchor);
            range.setStartAfter(anchor);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          } else {
            const el = e.currentTarget;
            el.appendChild(anchor);
          }

          // Update state
          const el = e.currentTarget;
          onInput(platform, el.innerHTML || "");
        }
        // For non-pure-URL pastes: let default happen, autoLinkifyEditor runs on next input event
      },
      [platform, onInput]
    );

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
        {/* FIX: onInput now uses handleInput (reads innerHTML, auto-linkifies) */}
        {/* FIX: onPaste now uses handlePaste (direct URL paste → instant link) */}
        <div
          ref={ref}
          className="editor"
          contentEditable
          suppressContentEditableWarning
          data-platform={platform}
          data-placeholder={`What would you like to share on ${label}?`}
          onInput={handleInput}
          onPaste={handlePaste}
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

            {/* FIX: only show file info when imageFile is actually set (not null) */}
            {imageFile && (
              <span style={{ fontSize: 11, color: "#6b7280" }}>
                📄 <strong>{imageFile.name}</strong>{" "}
                ({(imageFile.size / 1024).toFixed(1)} KB)
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
            {/* FIX: Link icon now correctly targets this platform's editor via onLink(platform) */}
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