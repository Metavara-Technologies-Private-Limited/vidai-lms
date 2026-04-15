import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import loginLogo from "../../assets/icons/Login_Logo_Vidai.webp";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Rating,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { reputationApi } from "../../services/reputation.api";

type RequestRecord = {
  request_name?: string;
  description?: string;
  collect_on?: "google" | "form" | "both";
};

const resolveRequestRecord = (raw: unknown): RequestRecord => {
  if (typeof raw !== "object" || raw === null) {
    return {};
  }

  const root = raw as { data?: unknown };
  const payload =
    typeof root.data === "object" && root.data !== null ? root.data : raw;

  if (typeof payload !== "object" || payload === null) {
    return {};
  }

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
  };
};

const ReviewForm = () => {
  const params = useParams<{
    requestId: string;
    leadId: string;
    channel: string;
    "*": string;
  }>();
  const location = useLocation();

  const requestId = useMemo(() => {
    if (params.requestId) {
      return params.requestId;
    }

    const segments = location.pathname.split("/").filter(Boolean);
    const reviewIndex = segments.findIndex((segment) => segment === "review");

    if (reviewIndex < 0 || !segments[reviewIndex + 1]) {
      return "";
    }

    return segments[reviewIndex + 1];
  }, [location.pathname, params.requestId]);

  const leadId = useMemo(() => {
    if (params.leadId) {
      return params.leadId;
    }

    const segments = location.pathname.split("/").filter(Boolean);
    const reviewIndex = segments.findIndex((segment) => segment === "review");

    if (reviewIndex < 0 || !segments[reviewIndex + 2]) {
      return "";
    }

    return segments[reviewIndex + 2];
  }, [location.pathname, params.leadId]);
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>("");
  const [requestMeta, setRequestMeta] = useState<RequestRecord>({});
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [submitError, setSubmitError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
        const response = await reputationApi.getRequestById(requestId);
        if (!isMounted) {
          return;
        }

        setRequestMeta(resolveRequestRecord(response));
      } catch {
        if (!isMounted) {
          return;
        }

        setSubmitError(
          "Unable to load review request details. Please try again.",
        );
      } finally {
        if (isMounted) {
          setLoadingRequest(false);
        }
      }
    };

    void loadRequest();

    return () => {
      isMounted = false;
    };
  }, [requestId, leadId]);

  const canSubmit = useMemo(() => {
    return (
      rating >= 1 &&
      rating <= 5 &&
      reviewText.trim().length > 0 &&
      !isSubmitting
    );
  }, [rating, reviewText, isSubmitting]);

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
      setIsSubmitted(true);
    } catch {
      setSubmitError(
        "Unable to submit your review right now. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingRequest) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          p: 2,
          background:
            "radial-gradient(circle at 20% 20%, #FFF8E8 0%, #F8FAFC 60%, #EEF2FF 100%)",
        }}
      >
        <Stack alignItems="center" spacing={1.5}>
          <CircularProgress size={28} />
          <Typography variant="body2" color="text.secondary">
            Loading your review form...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, sm: 3 },
        background:
          "radial-gradient(circle at top left, #FFF1DB 0%, #F8FAFC 45%, #EAF4FF 100%)",
      }}
    >
      <Stack
        alignItems="center"
        spacing={0}
        sx={{ width: "100%", maxWidth: 640 }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 640,
            borderRadius: "20px",
            border: "1px solid rgba(226, 232, 240, 0.95)",
            p: { xs: 2.5, sm: 4 },
            bgcolor: "#FFFFFF",
            boxShadow: "0 18px 42px rgba(15, 23, 42, 0.14)",
          }}
        >
          {isSubmitted ? (
            <Stack spacing={1.5} alignItems="center" sx={{ py: 3 }}>
              <Typography variant="h5" fontWeight={700} color="#0F172A">
                Thank You!
              </Typography>
              <Typography align="center" color="text.secondary">
                We have received your valuable feedback. Thank You!
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={2.5}>
              <Box
                sx={{
                  position: "relative",
                  borderRadius: "14px",
                  overflow: "hidden",
                  minHeight: { xs: 170, sm: 220, md: 250 },
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#F8FAFC",
                }}
              >
                <Box
                  component="img"
                  src={loginLogo}
                  alt="Vidai"
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "block",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                    opacity: 0.90,
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.86) 0%, rgba(255,255,255,0.95) 100%)",
                  }}
                />
                <Stack
                  spacing={1}
                  sx={{
                    position: "relative",
                    zIndex: 1,
                    p: { xs: 2, sm: 2.5, md: 3 },
                    justifyContent: "flex-end",
                    minHeight: "100%",
                  }}
                >
                  <Typography variant="h4" fontWeight={800} color="#0F172A">
                    Share Your Experience
                  </Typography>
                  <Typography variant="body1" color="#475569" fontWeight={600}>
                    {requestMeta.request_name || "Review Request"}
                  </Typography>
                  {requestMeta.description && (
                    <Typography variant="body2" sx={{ color: "#334155" }}>
                      {requestMeta.description}
                    </Typography>
                  )}
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Your Rating
                </Typography>
                <Rating
                  value={rating}
                  onChange={(_, value) => setRating(value ?? 0)}
                  size="large"
                />
              </Box>

              <TextField
                fullWidth
                multiline
                minRows={4}
                maxRows={8}
                label="Comment"
                placeholder="Tell us what went well and what we can improve."
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                required
              />

              {submitError && <Alert severity="error">{submitError}</Alert>}

              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!canSubmit}
                sx={{
                  height: 46,
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 700,
                  bgcolor: "#0F172A",
                  "&:hover": { bgcolor: "#1E293B" },
                }}
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
            </Stack>
          )}
        </Paper>
      </Stack>
    </Box>
  );
};

export default ReviewForm;
