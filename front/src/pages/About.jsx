import { useEffect, useState } from "react";
import { api } from "../api.js";
import PageHero from "../components/PageHero.jsx";
import Img from "../components/Img.jsx";
import { Loading, ErrorBox } from "../components/States.jsx";

export default function About() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.about().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorBox message={error} />;
  if (!data) return <Loading />;

  const vision = data.vision || {};
  const milestones = data.milestones || [];
  const honors = data.honors || [];

  return (
    <>
      <PageHero title="关于我们" subtitle="以科技重塑居家体验，让家更懂你" />

      {/* 品牌故事 */}
      {data.brand_story && (
        <section className="container-content py-14 md:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="eyebrow">品牌故事</span>
              <div className="prose-detail mt-4 text-neutral-600" dangerouslySetInnerHTML={{ __html: data.brand_story }} />
            </div>
            <div className="rounded-md bg-gradient-to-br from-primary-light to-neutral-100 p-8 md:p-12">
              <p className="text-2xl font-bold leading-snug text-primary-deep md:text-3xl">
                {data.brand_story ? "让家更懂你" : "以科技连接美好生活"}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 愿景三卡 */}
      {(vision.mission || vision.vision || vision.values) && (
        <section className="bg-neutral-50 py-14 md:py-20">
          <div className="container-content">
            <span className="eyebrow">企业愿景</span>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                { title: "使命", value: vision.mission, icon: "M13 2L4 14h6l-1 8 9-12h-6l1-8z" },
                { title: "愿景", value: vision.vision, icon: "M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" },
                { title: "价值观", value: vision.values, icon: "M12 21C7 16.5 3 13.2 3 9.2 3 6.4 5.2 4 8 4c1.6 0 3.1.7 4 2 .9-1.3 2.4-2 4-2 2.8 0 5 2.4 5 5.2 0 4-4 7.3-9 11.8z" },
              ]
                .filter((v) => v.value)
                .map((v) => (
                  <div key={v.title} className="card p-6">
                    <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary-light text-primary-deep">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={v.icon} />
                      </svg>
                    </span>
                    <h3 className="mt-4 font-semibold text-neutral-900">{v.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">{v.value}</p>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* 发展历程（横版时间轴） */}
      {milestones.length > 0 && (
        <section className="container-content py-14 md:py-20">
          <span className="eyebrow">发展历程</span>
          <div className="mt-10 overflow-x-auto pb-4">
            <div className="relative flex min-w-max gap-8">
              {/* 轴线 */}
              <div className="absolute left-0 right-0 top-5 h-0.5 bg-neutral-200" />
              {milestones
                .slice()
                .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
                .map((m, i) => (
                  <div key={i} className="relative w-44 shrink-0">
                    <span className="relative z-[1] flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-card">
                      {String(m.year).slice(-2)}
                    </span>
                    <p className="mt-3 font-semibold text-neutral-900">{m.year}</p>
                    <p className="mt-1 text-sm leading-6 text-neutral-500">{m.event}</p>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* 资质荣誉 */}
      {honors.length > 0 && (
        <section className="bg-neutral-50 py-14 md:py-20">
          <div className="container-content">
            <span className="eyebrow">资质荣誉</span>
            <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4">
              {honors.map((h, i) => (
                <div key={i} className="card overflow-hidden text-center">
                  <Img src={h.image} alt={h.desc || "荣誉资质"} className="aspect-square w-full" />
                  {h.desc && <p className="p-3 text-sm text-neutral-600">{h.desc}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
