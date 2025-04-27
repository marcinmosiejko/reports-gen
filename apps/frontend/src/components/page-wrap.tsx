import { ReactNode } from "react";

function PageWrap({ children }: { children: ReactNode }) {
  return <div className="mx-auto h-full w-full max-w-6xl">{children}</div>;
}

export default PageWrap;
