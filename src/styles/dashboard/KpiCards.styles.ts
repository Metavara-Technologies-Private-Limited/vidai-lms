export const kpiCardsStyles = {
  /* CONTAINER */
grid: {
  display: "grid",
  gridTemplateColumns: {
    xs: "repeat(2, 1fr)",
    sm: "repeat(3, 1fr)",
    md: "repeat(7, 1fr)",
  },
  gap: 1,
  width: "100%",
},


  /* BASE CARD */
  cardBase: {
    width: "100%",              
    height: 120,
    padding: "12px",
    borderRadius: 2,
    flexShrink: 0,
    border:"none",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",  
    marginBottom: 1,
    boxShadow: "0px 0.3px 1px rgba(0, 0, 0, 0.1)",
  },

  /* CARD GRADIENTS */
totalLeads: {
  background:
    "linear-gradient(180deg, rgba(83,146,242,0.10) 0%, rgba(83,146,242,0.05) 35%, #FFFFFF 100%)",
},
newLeads: {
  background:
    "linear-gradient(180deg, rgba(131,93,239,0.10) 0%, rgba(131,93,239,0.05) 35%, #FFFFFF 100%)",
},
appointments: {
  background:
    "linear-gradient(180deg, rgba(45,107,240,0.10) 0%, rgba(45,107,240,0.05) 35%, #FFFFFF 100%)",
},
followUps: {
  background:
    "linear-gradient(180deg, rgba(236,189,86,0.10) 0%, rgba(236,189,86,0.05) 35%, #FFFFFF 100%)",
},
totalConverted: {
  gridColumn: "span 2",
  background:
    "linear-gradient(180deg, rgba(71,179,95,0.10) 0%, rgba(71,179,95,0.05) 35%, #FFFFFF 100%)",
},
lostLeads: {
  background:
    "linear-gradient(180deg, rgba(242,91,91,0.10) 0%, rgba(242,91,91,0.10) 35%, #FFFFFF 100%)",
},



  /* ICON */
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
    marginBottom: 1,          // 👈 natural spacing
  },

  icon: {
    width: 40,
    height: 40,
  },

  /* TEXT */
  label: {
    fontSize: "12px",
    fontWeight: 500,
    color: "#8e8e93",
    
  },

  value: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#232323",
  },

  /* TOTAL CONVERTED BREAKDOWN */
  breakdownRow: {
    display: "flex",
    gap: 12,
    marginTop: 6,
  },

  breakdownItem: {
    display: "flex",
    flexDirection: "column",
  },

  breakdownLabel: {
    fontSize: "10px",
    color: "#8e8e93",
    fontWeight: 450,
  },

  breakdownValue: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#232323",
  },
};
