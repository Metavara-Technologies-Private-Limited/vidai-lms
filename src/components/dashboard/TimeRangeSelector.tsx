import React from "react";
import { Box, Button } from "@mui/material";
import { timeRangeSelectorStyles } from "../../styles/Dashboard/TimeRangeSelector.styles";

export type TimeRange = "today" | "week" | "month" | "year" | "all";

interface Props {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

const ranges: { label: string; value: TimeRange }[] = [
  { label: "Today", value: "today" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
  { label: "All Time", value: "all" },
];

const TimeRangeSelector: React.FC<Props> = ({ value, onChange }) => {
  return (
    <Box sx={timeRangeSelectorStyles.container}>
      {ranges.map((range) => (
        <Button
          key={range.value}
          size="small"
          onClick={() => onChange(range.value)}
          sx={timeRangeSelectorStyles.button(value === range.value)}
        >
          {range.label}
        </Button>
      ))}
    </Box>
  );
};

export default TimeRangeSelector;
