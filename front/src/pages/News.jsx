import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import PageHero from "../components/PageHero.jsx";
import Pagination from "../components/Pagination.jsx";
import Img from "../components/Img.jsx";
import { Loading, ErrorBox, Empty } from "../components/States.jsx";

const PAGE_SIZE = 10;

export default function News() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const [list, setList] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    setList(null);
    api.news({ page, page_size: PAGE_SIZE }).then(setList).catch((e) => setError(e.message));
  };

  useEffect(load, [page]);

  const change = (next) => {
    const params = {};
    if (next > 1) params.page = String(next);
    setSearchParams(params);
  };

  return (
    <>
      <PageHero title="新闻资讯" subtitle="了解蓁蓁智能家居的最新动态与行业洞察" />
      <div className="container-content py-10 md:py-14">
        {error ? (
          <ErrorBox message={error} onRetry={load} />
        ) : !list ? (
          <Loading />
        ) : list.items.length === 0 ? (
          <Empty text="暂无资讯" />
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {list.items.map((n) => (
                <Link key={n.id} to={`/news/${n.id}`} className="card card-hover overflow-hidden">
                  <Img src={n.cover_image} alt={n.title} className="aspect-[4/3] w-full" />
                  <div className="p-4">
                    <p className="text-xs text-neutral-400">
                      {n.published_at ? new Date(n.published_at).toLocaleDateString("zh-CN") : ""}
                      {n.category ? ` · ${n.category}` : ""}
                    </p>
                    <h3 className="mt-2 line-clamp-2 font-medium text-neutral-900">{n.title}</h3>
                    {n.summary && <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-500">{n.summary}</p>}
                  </div>
                </Link>
              ))}
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={list.total} onChange={change} />
          </>
        )}
      </div>
    </>
  );
}
