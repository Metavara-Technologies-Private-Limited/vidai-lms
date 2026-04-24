import FacebookReport from "./FacebookReport";
import type { ReportChannelData } from "../../types/reports.types";

type GmailReportsProps = {
  data: ReportChannelData;
  searchQuery: string;
};

const GmailReports = ({ data, searchQuery }: GmailReportsProps) => {
  return <FacebookReport data={data} searchQuery={searchQuery} />;
};

export default GmailReports;
