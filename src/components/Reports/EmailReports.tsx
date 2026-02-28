import FacebookReport from "./FacebookReport";
import { REPORTS_MOCK_DATA } from "./reports.mockData";

type EmailReportsProps = {
  searchQuery: string;
};

const EmailReports = ({ searchQuery }: EmailReportsProps) => {
  return <FacebookReport data={REPORTS_MOCK_DATA.email} searchQuery={searchQuery} />;
};

export default EmailReports;
