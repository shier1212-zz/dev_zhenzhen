import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

const QUICK_LINKS = [
  { to: "/products", label: "产品中心" },
  { to: "/about", label: "关于我们" },
  { to: "/news", label: "新闻资讯" },
  { to: "/contact", label: "联系我们" },
];

export default function Footer() {
  const [contact, setContact] = useState(null);

  useEffect(() => {
    api.contact().then(setContact).catch(() => {});
  }, []);

  return (
    <footer className="bg-brand-ink text-neutral-300">
      <div className="container-content grid gap-10 py-14 md:grid-cols-4">
        {/* 品牌简介 */}
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 5h14l-9 14h9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-lg font-bold text-white">蓁蓁智能家居</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-neutral-400">
            {contact?.company_name || "蓁蓁智能家居"} — 以科技重塑居家体验，用智能连接美好生活。
          </p>
        </div>

        {/* 快速链接 */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">快速链接</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {QUICK_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-neutral-400 transition-colors hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* 联系方式 */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">联系方式</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-neutral-400">
            <li>电话：{contact?.phone || "—"}</li>
            <li>邮箱：{contact?.email || "—"}</li>
            <li>地址：{contact?.address || "—"}</li>
            <li>工作时间：{contact?.work_time || "—"}</li>
          </ul>
        </div>

        {/* 备案信息 */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">备案信息</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-neutral-400">
            <li>© {new Date().getFullYear()} {contact?.company_name || "蓁蓁智能家居"}</li>
            <li>{contact?.icp_no || "备案号展示位"}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-neutral-500">
        Copyright © {new Date().getFullYear()} {contact?.company_name || "蓁蓁智能家居"} All Rights Reserved.
      </div>
    </footer>
  );
}
