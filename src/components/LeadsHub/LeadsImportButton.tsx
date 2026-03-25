import { IconButton } from "@mui/material";
import ImportIcon from "../../assets/icons/import.svg";

interface LeadsImportButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const LeadsImportButton: React.FC<LeadsImportButtonProps> = ({ onClick, disabled = false }) => {
  return (
    <IconButton
      onClick={onClick}
      disabled={disabled}
      title="Import"
      sx={{
        width: 40,
        height: 40,
        borderRadius: "10px",
        bgcolor: "#F3F4F6",
        color: "#111827",
        flexShrink: 0,
        "&:hover": { bgcolor: "#E5E7EB" },
        "&.Mui-disabled": { bgcolor: "#F3F4F6", color: "#9CA3AF" },
      }}
    >
      <img src={ImportIcon} alt="Import" width={20} height={20} />
    </IconButton>
  );
};

export default LeadsImportButton;
