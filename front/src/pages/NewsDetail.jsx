import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import { Loading, ErrorBox } from "../components/States.jsx";

export default function NewsDetail() {
  const { id } = useParams();
  const [n, setN] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    setN(null);
    api.newsDetail(id).then(setN).catch((e) => setError(e.message));
  };

  useEffect(load, [id]);

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!n) return <Loading />;

  return (
    <div className="container-content py-10 md:py-14">
      <Link to="/news" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-primary">
        ← 返回新闻资讯
      </Link>

      <article className="mx-auto mt-6 max-w-3xl">
        <h1 className="text-3xl font-bold leading-snug text-neutral-900 md:text-4xl">{n.title}</h1>
        <p className="mt-4 text-sm text-neutral-400">
          {n.published_at ? new Date(n.published_at).toLocaleString("zh-CN") : ""}
          {n.category ? ` · ${n.category}` : ""}
        </p>
        {n.summary && <p className="mt-6 rounded-md bg-neutral-50 p-4 text-sm leading-7 text-neutral-600">{n.summary}</p>}
        {n.content && (
          <div className="prose-detail mt-8 text-neutral-700" dangerouslySetInnerHTML={{ __html: n.content }} />
        )}
      </article>

      {/* 上一篇/下一篇 */}
      <nav className="mx-auto mt-12 grid max-w-3xl gap-3 border-t border-neutral-100 pt-6 text-sm md:grid-cols-2" aria-label="上下篇">
        <div>
          {n.prev ? (
            <Link to={`/news/${n.prev.id}`} className="block truncate text-neutral-600 hover:text-primary">
              ← 上一篇：{n.prev.title}
            </Link>
          ) : (
            <span className="text-neutral-300">已经是第一篇</span>
          )}
        </div>
        <div className="md:text-right">
          {n.next ? (
            <Link to={`/news/${n.next.id}`} className="block truncate text-neutral-600 hover:text-primary">
              下一篇：{n.next.title} →
            </Link>
          ) : (
            <span className="text-neutral-300">已经是最后一篇</span>
          )}
        </div>
      </nav>
    </div>
  );
}
