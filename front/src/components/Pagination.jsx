export default function Pagination({ page, pageSize, total, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // 生成页码（含省略号）
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="mt-10 flex flex-col items-center gap-3">
      <nav className="flex items-center gap-1.5" aria-label="分页">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-sm text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-40"
          aria-label="上一页"
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="px-1 text-neutral-400">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-sm transition-colors ${
                p === page
                  ? "bg-primary font-semibold text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-sm text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-40"
          aria-label="下一页"
        >
          ›
        </button>
      </nav>
      <p className="text-sm text-neutral-500">共 {totalPages} 页</p>
    </div>
  );
}