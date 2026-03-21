import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";

import Review_Avg_Rating from "../../assets/icons/Review_Avg_Rating.svg";
import Reviews_Sent from "../../assets/icons/Reviews_Sent.svg";
import Reviews_Submit from "../../assets/icons/Reviews_Submit.svg";
import Reviews_Total from "../../assets/icons/Reviews_Total.svg";
import Reviews_Conversion from "../../assets/icons/Reviews_Conversion.svg";

type Props = {
  avgRating?: number;
  reviewsSubmitted?: number;
  reviewRequestsSent?: number;
  totalReviews?: number;
  conversionRate?: number;
};

const ReputationHeaderCards = ({
  avgRating = 0,
  reviewsSubmitted = 0,
  reviewRequestsSent = 0,
  totalReviews = 0,
  conversionRate = 0,
}: Props) => {
  type CardItem = {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    bg: string;
  };

const cardData: CardItem[] = [
  {
    title: "Avg Rating",
    value: Number(avgRating).toFixed(1),
    icon: <img src={Review_Avg_Rating} alt="Avg Rating" />,
    bg: "linear-gradient(to top, #FFFFFF 0%, #FFFFFF 55%, rgba(236,189,86,0.18) 140%)",
  },
  {
    title: "Reviews Requests Sent",
    value: Number(reviewRequestsSent).toFixed(0),
    icon: <img src={Reviews_Sent} alt="Reviews Requests Sent" />,
    bg: "linear-gradient(to top, #FFFFFF 0%, #FFFFFF 55%, rgba(83,146,242,0.18) 140%)",
  },
  {
    title: "Reviews Submitted",
    value: reviewsSubmitted,
    icon: <img src={Reviews_Submit} alt="Reviews Submitted" />,
    bg: "linear-gradient(to top, #FFFFFF 0%, #FFFFFF 55%, rgba(71,179,95,0.18) 140%)",
  },
  {
    title: "Total Reviews",
    value: totalReviews,
    icon: <img src={Reviews_Total} alt="Total Reviews" />,
    bg: "linear-gradient(to top, #FFFFFF 0%, #FFFFFF 55%, rgba(236,189,86,0.18) 140%)",
  },
  {
    title: "Conversion Rate",
    value: `${conversionRate}%`,
    icon: <img src={Reviews_Conversion} alt="Conversion Rate" />,
    bg: "linear-gradient(to top, #FFFFFF 0%, #FFFFFF 55%, rgba(131,93,239,0.18) 140%)",
  },
];


  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: 2,
        mb: 3,
      }}
    >
      {cardData.map((card) => (
        <Card
          key={card.title}
          sx={{
            p: 2.5,
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            background: card.bg,
            border: "1px solid #eee",
            boxShadow: "none",
          }}
        >
          {/* Icon */}
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#FFFFFF",
              mb: 1.5,
            }}
          >
            {card.icon}
          </Box>

          {/* Title */}
          <Typography
            sx={{
              fontSize: 13,
              color: "#8A8A8A",
              mb: 0.5,
            }}
          >
            {card.title}
          </Typography>

          {/* Value */}
          <Typography
            sx={{
              fontSize: 20,
              fontWeight: 600,
              color: "#1A1A1A",
            }}
          >
            {card.value}
          </Typography>
        </Card>
      ))}
    </Box>
  );
};

export default ReputationHeaderCards;
