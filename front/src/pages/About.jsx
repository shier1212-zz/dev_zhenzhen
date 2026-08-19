import { useEffect, useState } from "react";
import { api } from "../api.js";
import PageHero from "../components/PageHero.jsx";
import Img from "../components/Img.jsx";
import { Loading, ErrorBox } from "../components/States.jsx";

const StoryVisual = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M12 2C7 7 4.5 10.5 4.5 14.5a7.5 7.5 0 0 0 15 0C19.5 10.5 17 7 12 2Z"
      fill="currentColor"
      opacity="0.95"
    />
    <path
      d="M12 10c-2 2.2-3 3.9-3 5.6a3 3 0 0 0 6 0c0-1.7-1-3.4-3-5.6Z"
      fill="#0B7A6E"
    />
  </svg>
);

const MissionIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const VisionIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const ValuesIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
  </svg>
);

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

  const visionCards = [
    { title: "我们的使命", value: vision.mission, icon: <MissionIcon /> },
    { title: "我们的愿景", value: vision.vision, icon: <VisionIcon /> },
    { title: "我们的价值观", value: vision.values, icon: <ValuesIcon /> },
  ].filter((v) => v.value);

  return (
    <>
      <PageHero title="关于我们" subtitle="以自然之名，造智慧之家" />

      {/* 品牌故事 */}
      {data.brand_story && (
        <section className="py-14 md:py-20">
          <div className="container-content">
            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
              <div>
                <span className="eyebrow">BRAND STORY · 品牌故事</span>
                <div
                  className="prose-detail mt-5 text-neutral-600"
                  dangerouslySetInnerHTML={{ __html: data.brand_story }}
                />
              </div>
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[#0B7A6E] to-primary-deep shadow-card-hover">
                {data.brand_image ? (
                  <Img
                    src={data.brand_image}
                    alt="品牌故事配图"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <StoryVisual className="h-32 w-32 text-white/90 md:h-40 md:w-40" />
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 企业愿景 */}
      {visionCards.length > 0 && (
        <section className="bg-neutral-50 py-14 md:py-20">
          <div className="container-content">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <span className="eyebrow">VISION · 企业愿景</span>
              <h2 className="section-title mt-4">使命 · 愿景 · 价值观</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {visionCards.map((v) => (
                <div
                  key={v.title}
                  className="card card-hover rounded-lg border border-neutral-200 p-7 text-center"
                >
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary-deep">
                    {v.icon}
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-neutral-900">{v.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-neutral-600">{v.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 发展历程 */}
      {milestones.length > 0 && (
        <section className="py-14 md:py-20">
          <div className="container-content">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <span className="eyebrow">MILESTONES · 发展历程</span>
              <h2 className="section-title mt-4">十年深耕，枝叶渐繁</h2>
            </div>
            <div className="relative mx-auto max-w-6xl overflow-x-auto pb-6">
              <div className="relative flex min-w-max justify-between gap-6 pt-10">
                {/* 轴线 */}
                <div className="absolute left-0 right-0 top-5 h-0.5 bg-gradient-to-r from-primary via-primary-light to-primary" />
                {milestones
                  .slice()
                  .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
                  .map((m, i) => (
                    <div
                      key={i}
                      className="relative min-w-[150px] max-w-[220px] flex-1 px-2 pt-8 text-center"
                    >
                      {/* 圆点 */}
                      <span className="absolute left-1/2 top-[-27px] z-[2] h-3.5 w-3.5 -translate-x-1/2 rounded-full border-[3px] border-primary bg-white shadow-[0_0_0_4px_#E6F4F2]" />
                      {/* 垂线 */}
                      <span className="absolute left-1/2 top-[-27px] z-[1] h-7 w-px -translate-x-1/2 bg-primary-light" />
                      <p className="text-xl font-bold text-primary-deep">{m.year}</p>
                      {m.title && (
                        <h4 className="mt-1 text-base font-semibold text-neutral-900">{m.title}</h4>
                      )}
                      <p className="mt-1 text-sm leading-6 text-neutral-500">
                        {m.desc || m.event}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 资质荣誉 */}
      {honors.length > 0 && (
        <section className="bg-neutral-50 py-14 md:py-20">
          <div className="container-content">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <span className="eyebrow">HONORS · 资质荣誉</span>
              <h2 className="section-title mt-4">实力见证，值得信赖</h2>
            </div>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              {honors
                .slice()
                .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
                .map((h, i) => (
                  <div
                    key={i}
                    className="card card-hover overflow-hidden rounded-md border border-neutral-200 text-center"
                  >
                    {h.image ? (
                      <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-[#F2FAF8] to-primary-light p-5">
                        <Img
                          src={h.image}
                          alt={h.title || h.desc || "荣誉资质"}
                          className="h-full w-full object-contain"
                          ratio="aspect-square"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-[#F2FAF8] to-primary-light p-5">
                        <span className="text-sm font-bold leading-tight text-primary-deep md:text-base">
                          {h.title}
                        </span>
                      </div>
                    )}
                    <div className="bg-white p-4 text-center">
                      {h.title && (
                        <h4 className="text-base font-semibold text-neutral-900">{h.title}</h4>
                      )}
                      {h.desc && (
                        <p className="mt-1 text-sm text-neutral-500">{h.desc}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
