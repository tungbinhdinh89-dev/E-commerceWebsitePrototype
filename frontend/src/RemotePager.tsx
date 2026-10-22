import { Button } from "@figma/astraui"
import type { Pagination } from "./data"

export default function RemotePager({
  pagination,
  onPage,
  loading = false,
  error = "",
}: {
  pagination: Pagination
  onPage: (page: number) => void
  loading?: boolean
  error?: string
}) {
  return (
    <div className="pagination" aria-live="polite">
      {error ? (
        <p role="alert">{error}</p>
      ) : (
        <>
          <Button
            variant="neutral"
            disabled={loading || pagination.page <= 1}
            onClick={() => onPage(pagination.page - 1)}
          >
            Trang trước
          </Button>
          <span>
            {loading
              ? "Đang tải…"
              : `${pagination.total} kết quả · Trang ${pagination.page}/${pagination.totalPages}`}
          </span>
          <Button
            variant="neutral"
            disabled={loading || pagination.page >= pagination.totalPages}
            onClick={() => onPage(pagination.page + 1)}
          >
            Trang sau
          </Button>
        </>
      )}
    </div>
  )
}
