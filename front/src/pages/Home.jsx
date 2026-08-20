import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import Img from "../components/Img.jsx";
import { Loading, ErrorBox } from "../components/States.jsx";

export default function Home() {
  const [data, setData] = useState(null);
  const [news, setNews] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .homeConfig()
      .then((d) => setData(d))
      .catch((e) => setError(e.message));
    api
      .news({ page: 1, page_size: 3 })
      .then((d) => setNews(d.items || []))
      .catch(() => {});
  }, []);

  if (error) return <ErrorBox message={error} />;
  if (!data) return <Loading />;

  return (
    <>
      <BannerCarousel />
      <BrandSection cfg={data} />
      <FeaturedProducts items={data.featured_products || []} />
      <NewsPreview items={news} />
    </>
  );
}

/* ---------------- 滚动渐入组件（参考小米官网首页：向下滑动逐渐浮现） ---------------- */
function Reveal({ children, className = "", delay = 0, as: Tag = "div" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    // 无 IntersectionObserver 时直接显示（渐进增强，不影响无 JS 环境）
    if (!("IntersectionObserver" in window)) {
      setShown(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        shown ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/* ---------------- 轮播 Banner ---------------- */
function BannerCarousel() {
  const [banners, setBanners] = useState([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    api.banners().then((d) => setBanners(d.items || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (paused || banners.length <= 1) return undefined;
    timer.current = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer.current);
  }, [paused, banners.length]);

  if (banners.length === 0) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-deep via-primary to-primary-light">
        <div className="container-content flex min-h-[380px] flex-col justify-center py-20 md:min-h-[460px]">
          <span className="eyebrow !bg-white/20 !text-white">全屋智能 · 一站定制</span>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight text-white md:text-5xl">
            让家更懂你
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/85 md:text-lg">
            以科技重塑居家体验，用智能连接美好生活。
          </p>
          <div className="mt-8 flex gap-4">
            <Link to="/products" className="rounded-pill bg-white px-6 py-3 text-sm font-semibold text-primary-deep hover:bg-primary-light">
              浏览产品
            </Link>
            <Link to="/contact" className="rounded-pill border border-white/60 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
              联系我们
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const b = banners[index];
  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-[380px] md:h-[480px]">
        {banners.map((bn, i) => (
          <div
            key={bn.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === index ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={i !== index}
          >
            {bn.image_url ? (
              <img src={bn.image_url} alt={bn.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-deep via-primary to-primary-light">
                <div className="container-content">
                  <span className="eyebrow !bg-white/20 !text-white">智能生活</span>
                  <h2 className="mt-4 text-4xl font-bold text-white md:text-5xl">{bn.title}</h2>
                  {bn.subtitle && <p className="mt-3 text-lg text-white/85">{bn.subtitle}</p>}
                </div>
              </div>
            )}
            {/* 文字叠加层 */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/15 to-transparent">
              <div className="container-content flex h-full flex-col justify-center">
                <h2 className="max-w-xl text-3xl font-bold text-white md:text-4xl">{bn.title}</h2>
                {bn.subtitle && <p className="mt-3 max-w-lg text-base text-white/90 md:text-lg">{bn.subtitle}</p>}
                {bn.link_type !== "none" && (
                  <Link
                    to={bn.link_type === "product" ? `/products/${bn.link_target}` : bn.link_type === "news" ? `/news/${bn.link_target}` : bn.link_target || "/products"}
                    className="mt-6 inline-flex w-fit rounded-pill bg-white px-6 py-2.5 text-sm font-semibold text-primary-deep hover:bg-primary-light"
                  >
                    了解更多
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 左右箭头 */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            aria-label="上一张"
            onClick={() => setIndex((index - 1 + banners.length) % banners.length)}
            className="absolute left-4 top-1/2 z-[1] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-neutral-800 shadow-card transition-colors hover:bg-white"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="下一张"
            onClick={() => setIndex((index + 1) % banners.length)}
            className="absolute right-4 top-1/2 z-[1] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-neutral-800 shadow-card transition-colors hover:bg-white"
          >
            ›
          </button>
        </>
      )}

      {/* 指示点 */}
      {banners.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-[1] flex -translate-x-1/2 gap-2">
          {banners.map((bn, i) => (
            <button
              key={bn.id}
              type="button"
              aria-label={`切换到第 ${i + 1} 张`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-pill transition-all ${
                i === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------------- 品牌理念 + 优势 ---------------- */
function BrandSection({ cfg }) {
  const advantages = Array.isArray(cfg.advantages) ? cfg.advantages : [];
  const fallback = [
    { icon: "shield", title: "安全可靠", desc: "多重防护体系，守护家庭安全" },
    { icon: "zap", title: "智能联动", desc: "全屋场景一键联动，懂你所需" },
    { icon: "leaf", title: "绿色节能", desc: "智能能耗管理，低碳更环保" },
    { icon: "heart", title: "贴心服务", desc: "专业团队，全周期售后服务" },
  ];
  const items = advantages.length > 0 ? advantages : fallback;

  return (
    <section className="bg-gradient-to-b from-[#0A5C54] via-[#0C3D38] to-[#0E1B24] py-20 md:py-28">
      <div className="container-content grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <span className="eyebrow !bg-primary/20 !text-primary-light">品牌理念</span>
          <h2 className="section-title mt-4 !text-white">{cfg.brand_slogan || "让家更懂你"}</h2>
          <p className="mt-5 leading-7 text-neutral-300">
            {cfg.brand_desc || "以科技重塑居家体验，用智能连接美好生活。"}
          </p>
        </Reveal>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-7">
          {items.slice(0, 4).map((a, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="rounded-md border border-white/10 bg-white/5 p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-card-hover md:p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/20 text-primary-light">
                  <Icon name={a.icon} />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-white">{a.title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-300">{a.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Icon({ name }) {
  const paths = {
    shield: <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />,
    zap: <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />,
    leaf: <path d="M5 21c0-8 4-14 14-16 1 10-4 16-14 16zM5 21c3-5 7-9 12-11" />,
    heart: <path d="M12 21C7 16.5 3 13.2 3 9.2 3 6.4 5.2 4 8 4c1.6 0 3.1.7 4 2 .9-1.3 2.4-2 4-2 2.8 0 5 2.4 5 5.2 0 4-4 7.3-9 11.8z" />,
  };
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || paths.shield}
    </svg>
  );
}

/* ---------------- 精选产品 ---------------- */
function FeaturedProducts({ items }) {
  if (items.length === 0) return null;
  return (
    <section className="bg-gradient-to-b from-[#142B56] via-[#10223F] to-[#0D1B33] py-20 md:py-28">
      <div className="container-content">
        <Reveal className="flex items-end justify-between">
          <div>
            <span className="eyebrow !bg-primary/20 !text-primary-light">精选产品</span>
            <h2 className="section-title mt-4 !text-white">为您甄选</h2>
          </div>
          <Link to="/products" className="hidden text-sm font-medium text-primary-light hover:text-white md:block">
            查看全部 →
          </Link>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-7">
          {items.map((p, i) => (
            <Reveal key={p.id} delay={i * 100}>
              <Link
                to={`/products/${p.id}`}
                className="group block overflow-hidden rounded-md border border-white/10 bg-neutral-800/80 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-card-hover"
              >
                <div className="overflow-hidden">
                  <Img src={p.cover_image} alt={p.name} className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <h3 className="truncate text-base font-medium text-white">{p.name}</h3>
                  {p.brief && <p className="mt-1.5 truncate text-xs text-neutral-400">{p.brief}</p>}
                  {p.show_price === 1 && p.price_min != null && (
                    <p className="mt-2.5 text-sm font-semibold text-primary-light">
                      ¥{Number(p.price_min).toLocaleString()}
                      {p.price_max && p.price_max !== p.price_min ? ` - ¥${Number(p.price_max).toLocaleString()}` : " 起"}
                    </p>
                  )}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- 新闻预览 ---------------- */
function NewsPreview({ items }) {
  if (items.length === 0) return null;
  return (
    <section className="bg-gradient-to-b from-[#3B2468] via-[#2A1A4E] to-[#20133C] py-20 md:py-28">
      <div className="container-content">
        <Reveal className="flex items-end justify-between">
          <div>
            <span className="eyebrow !bg-primary/20 !text-primary-light">新闻资讯</span>
            <h2 className="section-title mt-4 !text-white">企业动态</h2>
          </div>
          <Link to="/news" className="hidden text-sm font-medium text-primary-light hover:text-white md:block">
            全部资讯 →
          </Link>
        </Reveal>
        <div className="mt-12 grid gap-7 md:grid-cols-3 lg:gap-8">
          {items.map((n, i) => (
            <Reveal key={n.id} delay={i * 120}>
              <Link
                to={`/news/${n.id}`}
                className="group block overflow-hidden rounded-md border border-white/10 bg-neutral-800/80 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-card-hover"
              >
                <Img src={n.cover_image} alt={n.title} className="aspect-[16/9] w-full" />
                <div className="p-6">
                  <p className="text-xs text-neutral-400">{n.published_at ? new Date(n.published_at).toLocaleDateString("zh-CN") : ""}</p>
                  <h3 className="mt-2.5 line-clamp-2 text-base font-medium text-white">{n.title}</h3>
                  {n.summary && <p className="mt-2.5 line-clamp-2 text-sm text-neutral-300">{n.summary}</p>}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}