import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import Img from "../components/Img.jsx";
import { Loading, ErrorBox } from "../components/States.jsx";

export default function ProductDetail() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [error, setError] = useState("");
  const [activeImg, setActiveImg] = useState(0);

  const load = () => {
    setError("");
    setP(null);
    setActiveImg(0);
    api
      .productDetail(id)
      .then(setP)
      .catch((e) => setError(e.message));
  };

  useEffect(load, [id]);

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!p) return <Loading />;

  const images = p.images?.length ? p.images : [p.cover_image];

  return (
    <div className="container-content py-10 md:py-14">
      {/* 顶部返回 */}
      <Link to="/products" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-primary">
        ← 返回产品中心
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* 图片区 */}
        <div>
          <div className="overflow-hidden rounded-md border border-neutral-100">
            <Img src={images[activeImg]} alt={p.name} className="aspect-square w-full" />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={`overflow-hidden rounded-sm border-2 transition-colors ${
                    i === activeImg ? "border-primary" : "border-transparent hover:border-neutral-200"
                  }`}
                  aria-label={`查看第 ${i + 1} 张图片`}
                >
                  <Img src={img} alt="" className="h-16 w-16" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 信息区 */}
        <div>
          <p className="text-sm text-neutral-400">{p.category_name}</p>
          <h1 className="mt-2 text-3xl font-bold text-neutral-900">{p.name}</h1>
          {p.brief && <p className="mt-3 leading-7 text-neutral-600">{p.brief}</p>}

          {p.show_price === 1 && p.price_min != null && (
            <div className="mt-5 rounded-md bg-primary-light px-5 py-4">
              <span className="text-sm text-primary-deep">参考价格</span>
              <p className="mt-1 text-2xl font-bold text-primary-deep">
                ¥{Number(p.price_min).toLocaleString()}
                {p.price_max && p.price_max !== p.price_min
                  ? ` - ¥${Number(p.price_max).toLocaleString()}`
                  : ""}
              </p>
            </div>
          )}

          <div className="mt-8 flex gap-4">
            <Link to="/contact" className="btn-primary">在线咨询</Link>
            <Link to="/contact" className="btn-outline">获取报价</Link>
          </div>
          <p className="mt-4 text-xs text-neutral-400">价格与参数以实际沟通为准，欢迎咨询定制方案。</p>
        </div>
      </div>

      {/* 参数表 */}
      {p.params?.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-bold text-neutral-900">规格参数</h2>
          <div className="mt-5 overflow-hidden rounded-md border border-neutral-100">
            <table className="w-full text-sm">
              <tbody>
                {p.params.map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-neutral-50" : "bg-white"}>
                    <th className="w-40 px-5 py-3.5 text-left font-medium text-neutral-600">{item.key}</th>
                    <td className="px-5 py-3.5 text-neutral-800">{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 详情图文 */}
      {p.detail_content && (
        <section className="mt-14">
          <h2 className="text-xl font-bold text-neutral-900">产品详情</h2>
          <div
            className="prose-detail mt-5 text-neutral-700"
            dangerouslySetInnerHTML={{ __html: p.detail_content }}
          />
        </section>
      )}

      {/* 同分类推荐 */}
      {p.related_products?.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-bold text-neutral-900">相关推荐</h2>
          <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-4">
            {p.related_products.map((r) => (
              <Link key={r.id} to={`/products/${r.id}`} className="card card-hover group overflow-hidden">
                <Img src={r.cover_image} alt={r.name} className="aspect-[4/3] w-full" />
                <div className="p-4">
                  <h3 className="truncate font-medium text-neutral-900">{r.name}</h3>
                  {r.show_price === 1 && r.price_min != null && (
                    <p className="mt-1 text-sm font-semibold text-primary">¥{Number(r.price_min).toLocaleString()} 起</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
