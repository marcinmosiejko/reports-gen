import { Button } from "./ui/button";

interface TablePaginationProps {
  page: number;
  pageCount: number;
  canPrevious: boolean;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export function TablePagination({
  page,
  pageCount,
  canPrevious,
  canNext,
  onPrevious,
  onNext,
}: TablePaginationProps) {
  return (
    <div className="mb-4 flex items-center justify-end gap-2">
      <span className="text-muted-foreground text-sm">
        Page {page} of {pageCount || 1}
      </span>
      <Button
        size="sm"
        variant="secondary"
        onClick={onPrevious}
        disabled={!canPrevious}
        className="px-2"
      >
        Previous
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={onNext}
        disabled={!canNext}
        className="px-2"
      >
        Next
      </Button>
    </div>
  );
}
