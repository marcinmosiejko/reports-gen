import PageWrap from "../page-wrap";
import { useQuery } from "@tanstack/react-query";

const FetchReports = () => {
  const { isLoading, error, data } = useQuery({
    queryKey: ["reports"],
    queryFn: () => fetch("http://localhost:3001").then((res) => res.json()),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error fetching reports</div>;

  return (
    <div>
      {data.map((report: any) => (
        <div key={report.id}>{report.title}</div>
      ))}
    </div>
  );
};

const Reports = () => {
  return (
    <PageWrap>
      <div className="">Reports</div>
      <FetchReports />
    </PageWrap>
  );
};

export default Reports;
