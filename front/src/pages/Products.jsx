import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import PageHero from "../components/PageHero.jsx";
import Pagination from "../components/Pagination.jsx";
import Img from "../components/Img.jsx";
import { Loading, ErrorBox, Empty } from "../components/States.jsx";

const PAGE_SIZE = 12;

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const catId = searchParams.get("category_id");
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [categories, setCategories] = useState([]);
  const [list, setList] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    setList(null);
    api
      .products({ category_id: catId || undefined, page, page_size: PAGE_SIZE })
      .then(setList)
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    api.categories().then((d) => setCategories(d.items || [])).catch(() => {});
  }, []);

  useEffect(load, [catId, page]);

  const change = (next) => {
    const params = {};
    if (catId) params.category_id = catId;
    if (next > 1) params.page = String(next);
    setSearchParams(params);
  };

  return (
    <>
      <PageHero title="产品中心" subtitle="全屋智能 · 一站定制，探索更懂你的智能生活" />
      <div className="container-content grid gap-8 py-10 md:grid-cols-[220px_1fr] md:py-14">
        {/* 左侧分类侧栏 */}
        <aside>
          <h2 className="text-sm font-semibold text-neutral-900">产品分类</h2>
          <ul className="mt-3 space-y-1">
            <li>
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  !catId ? "bg-primary-light font-medium text-primary-deep" : "text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                全部产品
              </button>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSearchParams({ category_id: String(c.id) })}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    catId === String(c.id) ? "bg-primary-light font-medium text-primary-deep" : "text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* 产品网格 */}
        <div>
          {error ? (
            <ErrorBox message={error} onRetry={load} />
          ) : !list ? (
            <Loading />
          ) : list.items.length === 0 ? (
            <Empty text="暂无相关产品" />
          ) : (
            <>
              <p className="text-sm text-neutral-500">共 {list.total} 件产品</p>
              <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
                {list.items.map((p) => (
                  <Link key={p.id} to={`/products/${p.id}`} className="card card-hover group overflow-hidden">
                    <div className="overflow-hidden">
                      <Img src={p.cover_image} alt={p.name} className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-105" />
                    </div>
                    <div className="p-4">
                      <h3 className="truncate font-medium text-neutral-900">{p.name}</h3>
                      {p.brief && <p className="mt-1 line-clamp-1 text-xs text-neutral-500">{p.brief}</p>}
                      {p.show_price === 1 && p.price_min != null && (
                        <p className="mt-2 text-sm font-semibold text-primary">
                          ¥{Number(p.price_min).toLocaleString()}
                          {p.price_max && p.price_max !== p.price_min ? ` - ¥${Number(p.price_max).toLocaleString()}` : " 起"}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              <Pagination page={page} pageSize={PAGE_SIZE} total={list.total} onChange={change} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
