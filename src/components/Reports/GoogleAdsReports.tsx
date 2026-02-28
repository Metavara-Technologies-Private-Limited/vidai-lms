import FacebookReport from "./FacebookReport";
import { REPORTS_MOCK_DATA } from "./reports.mockData";

type GoogleAdsReportsProps = {
  searchQuery: string;
};

const GoogleAdsReports = ({ searchQuery }: GoogleAdsReportsProps) => {
  return <FacebookReport data={REPORTS_MOCK_DATA["google-ads"]} searchQuery={searchQuery} />;
};

export default GoogleAdsReports;
