import FacebookReport from "./FacebookReport";
import { REPORTS_MOCK_DATA } from "./reports.mockData";

type GmailReportsProps = {
  searchQuery: string;
};

const GmailReports = ({ searchQuery }: GmailReportsProps) => {
  return <FacebookReport data={REPORTS_MOCK_DATA.gmail} searchQuery={searchQuery} />;
};

export default GmailReports;
