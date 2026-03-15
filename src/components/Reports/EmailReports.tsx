import FacebookReport from "./FacebookReport";
import type { ReportChannelData } from "../../types/reports.types";

type EmailReportsProps = {
  data: ReportChannelData;
  searchQuery: string;
};

const EmailReports = ({ data, searchQuery }: EmailReportsProps) => {
  return <FacebookReport data={data} searchQuery={searchQuery} />;
};

export default EmailReports;
