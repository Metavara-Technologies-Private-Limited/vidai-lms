export const getUseCaseStyles = (name: string) => {
    switch (name.toLowerCase()) {
      case "appointment":
        return {
          color: "#16A34A",
          bgColor: "#F0FDF4",
        };
  
      case "follow-up":
        return {
          color: "#3B82F6",
          bgColor: "#EFF6FF",
        };
  
      case "reminder":
        return {
          color: "#D97706",
          bgColor: "#FFFBEB",
        };
  
      case "re-engagement":
        return {
          color: "#7C3AED",
          bgColor: "#F5F3FF",
        };
  
      case "feedback":
        return {
          color: "#EA580C",
          bgColor: "#FFF7ED",
        };
  
      default:
        return {
          color: "#374151",
          bgColor: "#F3F4F6",
        };
    }
  };