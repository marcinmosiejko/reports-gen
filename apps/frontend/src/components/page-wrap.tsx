import { cn } from "@/lib/utils";
import { ReactNode } from "react";

function PageWrap({ children }: { children: ReactNode; size?: "M" | "L" }) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[100rem] grow flex-col px-4 py-8",
      )}
    >
      {children}
    </div>
  );
}

export default PageWrap;
