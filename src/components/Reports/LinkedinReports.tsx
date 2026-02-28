import FacebookReport from "./FacebookReport";
import { REPORTS_MOCK_DATA } from "./reports.mockData";

type LinkedinReportsProps = {
  searchQuery: string;
};

const LinkedinReports = ({ searchQuery }: LinkedinReportsProps) => {
  return <FacebookReport data={REPORTS_MOCK_DATA.linkedin} searchQuery={searchQuery} />;
};

export default LinkedinReports;
