import FacebookReport from "./FacebookReport";
import { REPORTS_MOCK_DATA } from "./reports.mockData";

type InstagramReportsProps = {
	searchQuery: string;
};

const InstagramReports = ({ searchQuery }: InstagramReportsProps) => {
	return <FacebookReport data={REPORTS_MOCK_DATA.instagram} searchQuery={searchQuery} />;
};

export default InstagramReports;
