import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { reputationApi } from "../../services/reputation.api";

type RequestRecord = {
  request_name?: string;
  description?: string;
  collect_on?: "google" | "form" | "both";
  review_submitted?: boolean;
};

const resolveRequestRecord = (raw: unknown): RequestRecord => {
  if (typeof raw !== "object" || raw === null) return {};
  const root = raw as { data?: unknown };
  const payload =
    typeof root.data === "object" && root.data !== null ? root.data : raw;
  if (typeof payload !== "object" || payload === null) return {};
  const record = payload as Record<string, unknown>;
  return {
    request_name:
      typeof record.request_name === "string" ? record.request_name : undefined,
    description:
      typeof record.description === "string" ? record.description : undefined,
    collect_on:
      record.collect_on === "google" ||
      record.collect_on === "form" ||
      record.collect_on === "both"
        ? record.collect_on
        : undefined,
    review_submitted: record.review_submitted === true,
  };
};

// ─── Star colors ───────────────────────────────────────────────────────────────
const ratingColors: Record<number, string> = {
  1: "#EF4444",
  2: "#F97316",
  3: "#EAB308",
  4: "#84CC16",
  5: "#22C55E",
};

const ratingLabels: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

const ReviewForm = () => {
  const params = useParams<{ requestId: string; leadId: string }>();
  const location = useLocation();

  const requestId = useMemo(() => {
    if (params.requestId) return params.requestId;
    const segments = location.pathname.split("/").filter(Boolean);
    const idx = segments.findIndex((s) => s === "review");
    return idx >= 0 ? (segments[idx + 1] ?? "") : "";
  }, [location.pathname, params.requestId]);

  const leadId = useMemo(() => {
    if (params.leadId) return params.leadId;
    const segments = location.pathname.split("/").filter(Boolean);
    const idx = segments.findIndex((s) => s === "review");
    return idx >= 0 ? (segments[idx + 2] ?? "") : "";
  }, [location.pathname, params.leadId]);

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(-1);
  const [reviewText, setReviewText] = useState<string>("");
  const [requestMeta, setRequestMeta] = useState<RequestRecord>({});
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [submitError, setSubmitError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [redirectingToGoogle, setRedirectingToGoogle] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadRequest = async () => {
      if (!requestId || !leadId) {
        if (isMounted) {
          setLoadingRequest(false);
          setSubmitError(
            "This review link is invalid. Please request a fresh link.",
          );
        }
        return;
      }

      const storageKey = `review_submitted_${requestId}_${leadId}`;
      if (localStorage.getItem(storageKey)) {
        if (isMounted) {
          setIsSubmitted(true);
          setLoadingRequest(false);
        }
        return;
      }

      try {
        const response = await reputationApi.getPublicRequestById(
          requestId,
          leadId,
        );
        if (!isMounted) return;
        const meta = resolveRequestRecord(response);
        setRequestMeta(meta);

        if (meta.review_submitted) {
          setIsSubmitted(true);
          return;
        }

        // ── If collect_on === "google" → skip the form entirely, redirect now ──
        if (meta.collect_on === "google") {
          const googleUrl = (
            import.meta.env.VITE_GOOGLE_REVIEW_URL as string | undefined
          )?.trim();
          if (googleUrl) {
            window.location.href = googleUrl;
            return;
          }
        }
      } catch {
        if (!isMounted) return;
        setSubmitError(
          "Unable to load review request details. Please try again.",
        );
      } finally {
        if (isMounted) setLoadingRequest(false);
      }
    };
    void loadRequest();
    return () => {
      isMounted = false;
    };
  }, [requestId, leadId]);

  const displayRating = hoverRating > 0 ? hoverRating : rating;
  const starColor = ratingColors[displayRating] ?? "#EAB308";

  const canSubmit = useMemo(
    () =>
      rating >= 1 &&
      rating <= 5 &&
      reviewText.trim().length > 0 &&
      !isSubmitting,
    [rating, reviewText, isSubmitting],
  );

  const handleSubmit = async () => {
    setSubmitError("");
    if (!requestId || !leadId) {
      setSubmitError(
        "This review link is invalid. Please request a fresh link.",
      );
      return;
    }
    if (rating < 1 || rating > 5) {
      setSubmitError("Please choose a valid rating between 1 and 5.");
      return;
    }
    if (!reviewText.trim()) {
      setSubmitError("Please enter your comment.");
      return;
    }

    setIsSubmitting(true);
    try {
      await reputationApi.submitReview({
        review_request: requestId,
        lead: leadId,
        rating,
        review_text: reviewText.trim(),
      });

      localStorage.setItem(`review_submitted_${requestId}_${leadId}`, "1");

      // ── Rating gate: "both" + ≥4 stars → redirect to Google ──
      if (
        (requestMeta.collect_on === "both" ||
          requestMeta.collect_on === "google") &&
        rating >= 4
      ) {
        const googleUrl = (
          import.meta.env.VITE_GOOGLE_REVIEW_URL as string | undefined
        )?.trim();
        if (googleUrl) {
          setRedirectingToGoogle(true);
          setTimeout(() => {
            window.location.href = googleUrl;
          }, 1800);
          return;
        }
      }

      setIsSubmitted(true);
    } catch (err) {
      let message = "Unable to submit your review right now. Please try again.";
      if (axios.isAxiosError(err)) {
        const resp = err.response?.data as Record<string, unknown> | undefined;
        const detail =
          resp?.detail ??
          resp?.error ??
          resp?.message ??
          (resp?.errors ? JSON.stringify(resp.errors) : undefined);
        if (typeof detail === "string" && detail.trim()) {
          message = detail;
        }
      }
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loadingRequest) {
    return (
      <Box sx={pageWrapSx}>
        <Stack alignItems="center" spacing={1.5}>
          <CircularProgress size={28} sx={{ color: "#6366F1" }} />
          <Typography variant="body2" color="text.secondary">
            Loading your review form…
          </Typography>
        </Stack>
      </Box>
    );
  }

  // ── Redirecting to Google ──────────────────────────────────────────────────
  if (redirectingToGoogle) {
    return (
      <Box sx={pageWrapSx}>
        <Paper elevation={0} sx={cardSx}>
          <Stack spacing={2.5} alignItems="center" sx={{ py: 3, px: 2 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#4285F4 0%,#34A853 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <OpenInNewIcon sx={{ color: "#fff", fontSize: 28 }} />
            </Box>
            <Typography
              variant="h6"
              fontWeight={700}
              align="center"
              color="#0F172A"
            >
              Thank you! Taking you to Google Reviews…
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Your internal feedback was saved. We'd love it if you shared your
              experience on Google too!
            </Typography>
            <CircularProgress size={22} sx={{ color: "#4285F4" }} />
          </Stack>
        </Paper>
      </Box>
    );
  }

  // ── Thank you (form-only submit) ───────────────────────────────────────────
  if (isSubmitted) {
    return (
      <Box sx={pageWrapSx}>
        <Paper elevation={0} sx={cardSx}>
          <Stack spacing={2} alignItems="center" sx={{ py: 4, px: 2 }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 56, color: "#22C55E" }} />
            <Typography
              variant="h5"
              fontWeight={700}
              color="#0F172A"
              align="center"
            >
              Thank You!
            </Typography>
            <Typography
              align="center"
              color="text.secondary"
              sx={{ maxWidth: 320 }}
            >
              We have received your valuable feedback. We appreciate your time!
            </Typography>
          </Stack>
        </Paper>
      </Box>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <Box sx={pageWrapSx}>
      <Paper elevation={0} sx={cardSx}>
        <Stack spacing={3}>
          {/* Header banner */}
          <Box sx={headerBannerSx}>
            {/* Google-G icon top-right */}
            {(requestMeta.collect_on === "google" ||
              requestMeta.collect_on === "both") && (
              <Box sx={googleBadgeSx}>
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.4 0 6.4 1.2 8.8 3.1l6.6-6.6C35.2 2.5 29.9 0 24 0 14.6 0 6.6 5.5 2.7 13.5l7.7 6C12.2 13.4 17.6 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.8 37.5 46.5 31.4 46.5 24.5z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.4 28.5c-.6-1.6-.9-3.3-.9-5s.3-3.4.9-5l-7.7-6C.9 15.5 0 19.6 0 24s.9 8.5 2.7 12l7.7-7.5z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c5.9 0 10.9-2 14.5-5.4l-7.5-5.8c-2 1.4-4.6 2.2-7 2.2-6.4 0-11.8-3.9-13.6-9.5l-7.7 6C6.6 42.5 14.6 48 24 48z"
                  />
                </svg>
                <Typography
                  sx={{ fontSize: 11, fontWeight: 600, color: "#1A73E8" }}
                >
                  Google Review
                </Typography>
              </Box>
            )}

            <Typography
              variant="overline"
              sx={{
                color: "#6366F1",
                fontWeight: 700,
                letterSpacing: 2,
                fontSize: 11,
              }}
            >
              Share Your Experience
            </Typography>
            <Typography
              variant="h5"
              fontWeight={800}
              color="#0F172A"
              sx={{ mt: 0.5, lineHeight: 1.2 }}
            >
              {requestMeta.request_name || "Review Request"}
            </Typography>
            {requestMeta.description && (
              <Typography variant="body2" color="#64748B" sx={{ mt: 0.5 }}>
                {requestMeta.description}
              </Typography>
            )}
          </Box>

          {/* Star rating */}
          <Box>
            <Typography
              variant="subtitle2"
              fontWeight={700}
              color="#0F172A"
              sx={{ mb: 1.5 }}
            >
              How would you rate us?
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Box
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(-1)}
                  sx={{
                    cursor: "pointer",
                    transition: "transform 0.15s",
                    transform:
                      displayRating >= star ? "scale(1.15)" : "scale(1)",
                  }}
                >
                  <StarIcon
                    sx={{
                      fontSize: 40,
                      color: displayRating >= star ? starColor : "#E2E8F0",
                      transition: "color 0.15s",
                    }}
                  />
                </Box>
              ))}
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{ ml: 1, color: starColor, minWidth: 72 }}
              >
                {ratingLabels[displayRating] ?? ""}
              </Typography>
            </Stack>
          </Box>

          {/* Comment box */}
          <TextField
            fullWidth
            multiline
            minRows={4}
            maxRows={8}
            label="Your Comment"
            placeholder="Tell us what went well and what we can improve."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                "&:hover fieldset": { borderColor: "#6366F1" },
                "&.Mui-focused fieldset": { borderColor: "#6366F1" },
              },
            }}
          />

          {submitError && (
            <Alert severity="error" sx={{ borderRadius: "10px" }}>
              {submitError}
            </Alert>
          )}

          {/* Submit */}
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!canSubmit}
            fullWidth
            sx={{
              height: 50,
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: 15,
              background: canSubmit
                ? "linear-gradient(135deg,#6366F1 0%,#4F46E5 100%)"
                : undefined,
              boxShadow: "none",
              "&:hover": {
                boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
                background: "linear-gradient(135deg,#5558E8 0%,#4338CA 100%)",
              },
            }}
          >
            {isSubmitting ? "Submitting…" : "Submit Review"}
          </Button>

          {/* Google note for "both" mode */}
          {requestMeta.collect_on === "both" && (
            <Typography
              variant="caption"
              color="text.secondary"
              align="center"
              display="block"
            >
              ⭐ Rating 4+ stars? We'll also invite you to share on Google.
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

// ── Shared styles ──────────────────────────────────────────────────────────────
const pageWrapSx = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  p: { xs: 2, sm: 3 },
  background: "linear-gradient(135deg,#F0F4FF 0%,#FAF8FF 50%,#F0FDF4 100%)",
};

const cardSx = {
  width: "100%",
  maxWidth: 560,
  borderRadius: "20px",
  border: "1px solid rgba(226,232,240,0.8)",
  p: { xs: 2.5, sm: 4 },
  bgcolor: "#FFFFFF",
  boxShadow: "0 20px 48px rgba(15,23,42,0.10)",
};

const headerBannerSx = {
  position: "relative",
  background: "linear-gradient(135deg,#EEF2FF 0%,#F5F3FF 100%)",
  borderRadius: "14px",
  p: { xs: 2, sm: 2.5 },
  border: "1px solid #E0E7FF",
};

const googleBadgeSx = {
  position: "absolute",
  top: 12,
  right: 12,
  display: "flex",
  alignItems: "center",
  gap: "5px",
  background: "#fff",
  borderRadius: "20px",
  px: 1.2,
  py: 0.5,
  border: "1px solid #E2E8F0",
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
};

export default ReviewForm;
