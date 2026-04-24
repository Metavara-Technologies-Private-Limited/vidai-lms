import FacebookReport from "./FacebookReport";
import type { ReportChannelData } from "../../types/reports.types";

type GoogleAdsReportsProps = {
  data: ReportChannelData;
  searchQuery: string;
};

const GoogleAdsReports = ({ data, searchQuery }: GoogleAdsReportsProps) => {
  return <FacebookReport data={data} searchQuery={searchQuery} />;
};

export default GoogleAdsReports;
