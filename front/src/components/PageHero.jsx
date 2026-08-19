/** 子页面顶部横幅。 */
export default function PageHero({ title, subtitle }) {
  return (
    <section className="border-b border-neutral-100 bg-neutral-50">
      <div className="container-content py-12 md:py-16">
        <h1 className="text-3xl font-bold text-neutral-900 md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-sm text-neutral-500 md:text-base">{subtitle}</p>}
      </div>
    </section>
  );
}
