import { useEffect, useState } from "react";
import { api } from "../api.js";
import PageHero from "../components/PageHero.jsx";
import { Loading, ErrorBox } from "../components/States.jsx";

const EMPTY_FORM = { name: "", phone: "", company: "", content: "", captcha_id: "", captcha: "" };

export default function Contact() {
  const [contact, setContact] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [svg, setSvg] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(""); // "" | "ok" | "error"
  const [msg, setMsg] = useState("");

  const refreshCaptcha = () => {
    api
      .captcha()
      .then((d) => {
        setForm((f) => ({ ...f, captcha_id: d.captcha_id, captcha: "" }));
        setSvg(d.svg);
      })
      .catch(() => {});
  };

  useEffect(() => {
    api.contact().then(setContact).catch(() => {});
    refreshCaptcha();
  }, []);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: "" }));
  };

  const validate = () => {
    const er = {};
    if (!form.name.trim()) er.name = "请填写姓名";
    if (!/^1\d{10}$/.test(form.phone.trim())) er.phone = "请填写正确的 11 位手机号";
    if (!form.content.trim()) er.content = "请填写留言内容";
    if (form.content.trim().length > 500) er.content = "留言内容不超过 500 字";
    if (!form.captcha.trim()) er.captcha = "请填写验证码";
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setStatus("");
    try {
      await api.submitMessage({
        name: form.name.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        content: form.content.trim(),
        captcha_id: form.captcha_id,
        captcha: form.captcha.trim(),
      });
      setStatus("ok");
      setMsg("留言提交成功，我们会尽快与您联系");
      setForm({ ...EMPTY_FORM });
      refreshCaptcha();
    } catch (err) {
      setStatus("error");
      setMsg(err.message || "提交失败，请稍后重试");
      refreshCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  const infoItems = [
    { label: "联系电话", value: contact?.phone },
    { label: "邮箱", value: contact?.email },
    { label: "公司地址", value: contact?.address },
    { label: "工作时间", value: contact?.work_time },
  ];

  return (
    <>
      <PageHero dark title="联系我们" subtitle="期待与您的每一次沟通，为您提供专业智能家居解决方案" />

      <div className="container-content grid gap-10 py-10 md:grid-cols-[1fr_420px] md:py-14">
        {/* 留言表单 */}
        <div>
          <h2 className="text-xl font-bold text-neutral-900">在线留言</h2>
          <p className="mt-2 text-sm text-neutral-500">请填写以下信息，我们将在 1 个工作日内与您联系。</p>

          {status === "ok" && (
            <p className="mt-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">{msg}</p>
          )}
          {status === "error" && (
            <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{msg}</p>
          )}

          <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="cf-name" className="mb-1.5 block text-sm font-medium text-neutral-700">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input id="cf-name" type="text" className="input-base" placeholder="您的姓名" value={form.name} onChange={set("name")} />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="cf-phone" className="mb-1.5 block text-sm font-medium text-neutral-700">
                  联系电话 <span className="text-red-500">*</span>
                </label>
                <input id="cf-phone" type="tel" className="input-base" placeholder="11 位手机号" value={form.phone} onChange={set("phone")} />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="cf-company" className="mb-1.5 block text-sm font-medium text-neutral-700">
                公司 / 单位
              </label>
              <input id="cf-company" type="text" className="input-base" placeholder="选填" value={form.company} onChange={set("company")} />
            </div>
            <div>
              <label htmlFor="cf-content" className="mb-1.5 block text-sm font-medium text-neutral-700">
                留言内容 <span className="text-red-500">*</span>
              </label>
              <textarea id="cf-content" rows={5} className="input-base resize-none" placeholder="请描述您的需求…" value={form.content} onChange={set("content")} />
              <p className="mt-1 text-right text-xs text-neutral-400">{form.content.length}/500</p>
              {errors.content && <p className="text-xs text-red-500">{errors.content}</p>}
            </div>
            <div className="flex items-start gap-4">
              <div className="w-40">
                <label htmlFor="cf-captcha" className="mb-1.5 block text-sm font-medium text-neutral-700">
                  验证码 <span className="text-red-500">*</span>
                </label>
                <input
                  id="cf-captcha"
                  type="text"
                  maxLength={4}
                  className="input-base uppercase"
                  placeholder="输入验证码"
                  value={form.captcha}
                  onChange={set("captcha")}
                />
                {errors.captcha && <p className="mt-1 text-xs text-red-500">{errors.captcha}</p>}
              </div>
              <div className="pt-6">
                {svg ? (
                  <button type="button" onClick={refreshCaptcha} title="点击刷新验证码" aria-label="刷新验证码" className="overflow-hidden rounded-sm border border-neutral-200">
                    <span dangerouslySetInnerHTML={{ __html: svg }} />
                  </button>
                ) : (
                  <span className="text-xs text-neutral-400">验证码加载中…</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
                {submitting ? "提交中…" : "提交留言"}
              </button>
              <p className="text-xs text-neutral-400">每个 IP 5 分钟内最多提交 3 次 · 信息仅用于业务联系</p>
            </div>
          </form>
        </div>

        {/* 联系信息卡 */}
        <aside>
          <div className="rounded-md bg-brand-ink p-7 text-neutral-300">
            <h2 className="text-lg font-bold text-white">联系方式</h2>
            <ul className="mt-6 space-y-5">
              {infoItems.map((item) => (
                <li key={item.label} className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-primary">
                    <DotIcon label={item.label} />
                  </span>
                  <div>
                    <p className="text-xs text-neutral-500">{item.label}</p>
                    <p className="mt-0.5 text-sm text-white">{item.value || "—"}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-4 rounded-md bg-neutral-50 p-4 text-xs leading-6 text-neutral-500">
            温馨提示：留言提交后我们会在 1 个工作日内与您联系。紧急需求请直接电话联系。
          </p>
        </aside>
      </div>
    </>
  );
}

function DotIcon({ label }) {
  const map = {
    联系电话: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A15 15 0 013 6a2 2 0 012-2z" />,
    邮箱: <path d="M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1zm1 2l7 5 7-5" />,
    公司地址: <path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11zm0-8a3 3 0 100-6 3 3 0 000 6z" />,
    工作时间: <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 5v5l3.5 2" strokeLinecap="round" />,
  };
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {map[label] || map.联系电话}
    </svg>
  );
}
