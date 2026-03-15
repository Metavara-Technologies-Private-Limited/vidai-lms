import FacebookReport from "./FacebookReport";
import type { ReportChannelData } from "../../types/reports.types";

type LinkedinReportsProps = {
  data: ReportChannelData;
  searchQuery: string;
};

const LinkedinReports = ({ data, searchQuery }: LinkedinReportsProps) => {
  return <FacebookReport data={data} searchQuery={searchQuery} />;
};

export default LinkedinReports;
