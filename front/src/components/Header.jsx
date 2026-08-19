import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "首页" },
  { to: "/products", label: "产品中心" },
  { to: "/about", label: "关于我们" },
  { to: "/news", label: "新闻资讯" },
  { to: "/contact", label: "联系我们" },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="蓁蓁智能家居 首页">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white">
        {/* 简易 Logo 占位：Z 形 */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 5h14l-9 14h9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-lg font-bold tracking-wide text-neutral-900">
        蓁蓁智能家居
      </span>
    </Link>
  );
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 200);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header
      className={`sticky top-0 z-10 bg-white/95 backdrop-blur transition-shadow ${
        scrolled ? "border-b border-neutral-200 shadow-nav" : "border-b border-transparent"
      }`}
    >
      <div className="container-content flex h-16 items-center justify-between">
        <Logo />

        {/* 桌面导航 */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="主导航">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `relative px-4 py-2 text-sm font-medium transition-colors ${
                  isActive ? "text-primary" : "text-neutral-600 hover:text-primary"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && (
                    <span className="absolute inset-x-4 -bottom-[1px] h-0.5 rounded-full bg-primary" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/contact" className="btn-primary hidden !py-2 md:inline-flex">
            在线咨询
          </Link>
          {/* 移动端菜单按钮 */}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-neutral-700 md:hidden"
            aria-label={open ? "关闭菜单" : "打开菜单"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* 移动端菜单 */}
      {open && (
        <nav className="border-t border-neutral-200 bg-white px-6 py-3 md:hidden" aria-label="移动端导航">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2.5 text-sm font-medium ${
                  isActive ? "bg-primary-light text-primary-deep" : "text-neutral-700"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
