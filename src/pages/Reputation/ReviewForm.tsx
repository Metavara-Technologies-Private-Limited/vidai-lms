import { useParams } from "react-router-dom";
import { useState } from "react";
import { reputationApi } from "../../services/reputation.api";

const ReviewForm = () => {

  const { requestId, leadId } = useParams<{ requestId: string; leadId: string }>();

  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>("");

  const handleSubmit = async () => {

    if (!requestId || !leadId) {
      alert("Invalid review link");
      return;
    }

    await reputationApi.submitReview({
      review_request: requestId,
      lead: leadId,
      rating,
      review_text: reviewText
    });

    alert("Thank you for your feedback!");

  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Share Your Experience</h2>

      <input
        type="number"
        min="1"
        max="5"
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
      />

      <br /><br />

      <textarea
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
      />

      <br /><br />

      <button onClick={handleSubmit}>
        Submit Review
      </button>
    </div>
  );
};

export default ReviewForm;