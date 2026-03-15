import FacebookReport from "./FacebookReport";
import type { ReportChannelData } from "../../types/reports.types";

type InstagramReportsProps = {
  data: ReportChannelData;
  searchQuery: string;
};

const InstagramReports = ({ data, searchQuery }: InstagramReportsProps) => {
  return <FacebookReport data={data} searchQuery={searchQuery} />;
};

export default InstagramReports;
