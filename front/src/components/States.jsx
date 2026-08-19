/** 加载 / 空 / 错误状态组件。 */

export function Loading({ text = "加载中…" }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-primary" aria-hidden="true" />
      <p className="mt-3 text-sm">{text}</p>
    </div>
  );
}

export function Empty({ text = "暂无数据" }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 14h4" strokeLinecap="round" />
      </svg>
      <p className="mt-3 text-sm">{text}</p>
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16.5v.5" strokeLinecap="round" />
      </svg>
      <p className="mt-3 text-sm">{message || "加载失败"}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-outline mt-4 !py-2 !px-5 text-sm">
          重试
        </button>
      )}
    </div>
  );
}
