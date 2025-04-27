import { Link } from "react-router-dom";
import PageWrap from "../page-wrap";
import { Button } from "../ui/button";

const Home = () => {
  return (
    <PageWrap>
      <div className="flex flex-1 flex-col items-center justify-center space-y-4">
        <h1 className="text-primary text-4xl font-bold">Reports App</h1>
        <Link to="/reports">
          <Button>{`Go to Reports >`}</Button>
        </Link>
      </div>
    </PageWrap>
  );
};

export default Home;
