import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container-content flex flex-col items-center justify-center py-24 text-center md:py-32">
      <p className="text-7xl font-bold text-primary/30 md:text-8xl">404</p>
      <h1 className="mt-4 text-2xl font-bold text-neutral-900">页面不存在</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-neutral-500">
        您访问的页面可能已被移除或地址有误，请返回首页继续浏览。
      </p>
      <Link to="/" className="btn-primary mt-8">
        返回首页
      </Link>
    </div>
  );
}
