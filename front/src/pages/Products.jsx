import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import PageHero from "../components/PageHero.jsx";
import Pagination from "../components/Pagination.jsx";
import Img from "../components/Img.jsx";
import { Loading, ErrorBox, Empty } from "../components/States.jsx";

const PAGE_SIZE = 12;
const SORT_OPTIONS = [
  { value: "default", label: "默认排序" },
  { value: "newest", label: "最新上架" },
  { value: "price_asc", label: "价格从低到高" },
  { value: "price_desc", label: "价格从高到低" },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const catId = searchParams.get("category_id");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const sort = searchParams.get("sort") || "default";
  const keyword = searchParams.get("q") || "";

  const [categories, setCategories] = useState([]);
  const [list, setList] = useState(null);
  const [error, setError] = useState("");
  // 搜索框受控值（与 URL 的 q 解耦，避免每次按键就触发请求）
  const [keywordInput, setKeywordInput] = useState(keyword);

  // URL 的 q 变化时（外部导航/清除）同步到输入框
  useEffect(() => {
    setKeywordInput(keyword);
  }, [keyword]);

  const allCount = useMemo(
    () => categories.reduce((sum, c) => sum + (c.count || 0), 0),
    [categories]
  );

  const buildParams = (overrides = {}) => {
    const params = {};
    const nextCat = overrides.category_id !== undefined ? overrides.category_id : catId;
    const nextSort = overrides.sort !== undefined ? overrides.sort : sort;
    const nextPage = overrides.page !== undefined ? overrides.page : page;
    const nextKeyword = overrides.keyword !== undefined ? overrides.keyword : keyword;
    if (nextCat) params.category_id = nextCat;
    if (nextSort && nextSort !== "default") params.sort = nextSort;
    if (nextKeyword) params.q = nextKeyword;
    if (nextPage > 1) params.page = String(nextPage);
    return params;
  };

  const load = () => {
    setError("");
    setList(null);
    const params = {
      category_id: catId || undefined,
      keyword: keyword || undefined,
      page,
      page_size: PAGE_SIZE,
    };
    if (sort !== "default") params.sort = sort;
    api
      .products(params)
      .then(setList)
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    api.categories().then((d) => setCategories(d.items || [])).catch(() => {});
  }, []);

  useEffect(load, [catId, page, sort, keyword]);

  const changeCategory = (id) => {
    setSearchParams(buildParams({ category_id: id, page: 1 }));
  };

  const changeSort = (value) => {
    setSearchParams(buildParams({ sort: value, page: 1 }));
  };

  const changePage = (next) => {
    setSearchParams(buildParams({ page: next }));
  };

  const submitKeyword = () => {
    const next = keywordInput.trim();
    if (next === keyword) return;
    setSearchParams(buildParams({ keyword: next, page: 1 }));
  };

  const clearKeyword = () => {
    setKeywordInput("");
    if (keyword) setSearchParams(buildParams({ keyword: "", page: 1 }));
  };

  return (
    <>
      <PageHero title="产品中心" subtitle="全屋智能 · 一站定制，探索更懂你的智能生活" />
      <div className="container-content grid gap-8 py-10 md:grid-cols-[240px_1fr] md:py-14">
        {/* 左侧分类侧栏 */}
        <aside className="h-fit rounded-lg bg-white p-4 shadow-card">
          <h2 className="text-base font-semibold text-neutral-900">产品分类</h2>
          <ul className="mt-4 space-y-1">
            <li>
              <button
                type="button"
                onClick={() => changeCategory(null)}
                className={`flex w-full items-center rounded-md px-3 py-2.5 text-sm transition-colors ${
                  !catId
                    ? "bg-primary font-medium text-white"
                    : "text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                <span className="flex-1 text-left">全部</span>
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    !catId ? "bg-white/20" : "bg-neutral-100"
                  }`}
                >
                  {allCount}
                </span>
              </button>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => changeCategory(String(c.id))}
                  className={`flex w-full items-center rounded-md px-3 py-2.5 text-sm transition-colors ${
                    catId === String(c.id)
                      ? "bg-primary font-medium text-white"
                      : "text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  <span className="flex-1 text-left">{c.name}</span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      catId === String(c.id) ? "bg-white/20" : "bg-neutral-100"
                    }`}
                  >
                    {c.count || 0}
                  </span>
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
          ) : (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-neutral-500">
                  共 {list.total} 件产品
                  {keyword && (
                    <span className="ml-2 text-neutral-400">
                      · 关键词「{keyword}」
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  {/* 搜索框（值少时放排序旁） */}
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <input
                      type="search"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitKeyword();
                      }}
                      placeholder="搜索产品名称/简介"
                      className="w-56 rounded-md border border-neutral-200 bg-white py-2 pl-9 pr-8 text-sm text-neutral-700 outline-none placeholder:text-neutral-400 focus:border-primary"
                    />
                    {keywordInput && (
                      <button
                        type="button"
                        onClick={clearKeyword}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                        aria-label="清除"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* 排序下拉 */}
                  <div className="relative">
                    <select
                      value={sort}
                      onChange={(e) => changeSort(e.target.value)}
                      className="appearance-none rounded-md border border-neutral-200 bg-white py-2 pl-4 pr-8 text-sm text-neutral-700 outline-none focus:border-primary"
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                      ▾
                    </span>
                  </div>
                </div>
              </div>

              {list.items.length === 0 ? (
                <Empty
                  text={
                    keyword
                      ? `未找到与「${keyword}」匹配的产品`
                      : "暂无相关产品"
                  }
                />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {list.items.map((p) => (
                      <Link
                        key={p.id}
                        to={`/products/${p.id}`}
                        className="card card-hover group overflow-hidden"
                      >
                        <div className="overflow-hidden">
                          <Img
                            src={p.cover_image}
                            alt={p.name}
                            className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="truncate font-medium text-neutral-900">{p.name}</h3>
                          {p.brief && (
                            <p className="mt-1 line-clamp-1 text-xs text-neutral-500">{p.brief}</p>
                          )}
                          {p.show_price === 1 && p.price_min != null && (
                            <p className="mt-2 text-sm font-semibold text-primary">
                              ¥{Number(p.price_min).toLocaleString()}
                              {p.price_max && p.price_max !== p.price_min
                                ? ` - ¥${Number(p.price_max).toLocaleString()}`
                                : " 起"}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>

                  <Pagination page={page} pageSize={PAGE_SIZE} total={list.total} onChange={changePage} />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}