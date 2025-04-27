import { ReactNode } from "react";

export const PageTitle = ({ children }: { children: ReactNode }) => {
  return <h1 className="text-primary mb-6 text-2xl font-bold">{children}</h1>;
};
