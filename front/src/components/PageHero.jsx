/**
 * 子页面顶部横幅。
 * dark=true 时渲染深色渐变 Hero（渐变背景 + 模糊光斑 + 网格点装饰 + 白色文字）；
 * 默认保持浅色（中性浅灰）。
 */
export default function PageHero({ title, subtitle, dark = false }) {
  if (dark) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-deep via-neutral-900 to-neutral-900">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {/* 左上品牌色光斑 */}
          <div className="absolute -left-24 -top-32 h-96 w-96 rounded-full bg-primary/25 blur-3xl" />
          {/* 右下冷色光斑 */}
          <div className="absolute -right-24 -bottom-20 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
          {/* 网格点装饰 */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>
        <div className="container-content relative py-16 md:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-pill bg-primary/20 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary-light">
              Explore Smart Home
            </span>
            <h1 className="mt-4 text-3xl font-bold text-white md:text-5xl">{title}</h1>
            {subtitle && (
              <p className="mt-3 max-w-2xl text-sm text-neutral-300 md:text-base">{subtitle}</p>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-neutral-100 bg-neutral-50">
      <div className="container-content py-12 md:py-16">
        <h1 className="text-3xl font-bold text-neutral-900 md:text-4xl">{title}</h1>
        {subtitle && (
          <p className="mt-3 max-w-2xl text-sm text-neutral-500 md:text-base">{subtitle}</p>
        )}
      </div>
    </section>
  );
}
