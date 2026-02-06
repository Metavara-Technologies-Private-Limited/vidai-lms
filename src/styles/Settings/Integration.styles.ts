export const styles = {
  pageTitle: {
    fontSize: 18,
    color: "#232323",
    fontWeight: 700,
    mb: 3,
  },

  gridWrapper: {
    display: "grid",
    gridTemplateColumns: {
      xs: "1fr",
      md: "1fr 1fr 1fr",
    },
    gap: 3,
  },

  card: {
    p: 2,
    borderRadius: 2,
    border: "none",
  },

  header: (bgColor: string) => ({
    display: "flex",
    alignItems: "center",
    gap: 1.5,
    mb: 3,
    px: 3,
    py: 2,
    mx: -3,
    mt: -3,
    borderRadius: 0,
    bgcolor: bgColor,
  }),

  headerIcon: {
    width: 24,
  },

  headerTitle: {
    fontWeight: 600,
  },

  headerDescription: {
    color: "#9e9e9e",
    fontSize: 12,
  },

  statusWrapper: {
    textAlign: "center",
    mb: 3,
  },

  statusIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    mx: "auto",
    mb: 1.5,
  },

  statusIcon: {
    width: 40,
  },

  statusTitle: {
    fontWeight: 600,
    fontSize: 14,
    color: "#232323",
  },

  statusDescription: {
    color: "#9e9e9e",
    fontSize: 14,
    fontWeight: 400,
  },

  buttonWrapper: {
    display: "flex",
    justifyContent: "center",
  },

  actionButton: (connected: boolean) => ({
    px: 3,
    width: "fit-content",
    border: "none",
    backgroundColor: connected ? "#f3f3f3" : "#505050",
    color: connected ? "#505050" : "#f3f3f3",
  }),

  buttonIcon: {
    width: 18,
  },
};
