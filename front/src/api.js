import axios from "axios";

const http = axios.create({ baseURL: "/api/v1", timeout: 15000 });

// 统一响应处理：直接返回 data（{code,message,data} 结构）
http.interceptors.response.use(
  (res) => {
    const body = res.data;
    if (body && typeof body === "object" && "code" in body) {
      if (body.code !== 0) {
        return Promise.reject(new Error(body.message || "请求失败"));
      }
      return body.data;
    }
    return body;
  },
  (err) => {
    const msg =
      err.response?.status === 429
        ? err.response?.data?.message || "提交过于频繁"
        : err.response?.status === 404
          ? "资源不存在"
          : err.message || "网络错误";
    return Promise.reject(new Error(msg));
  }
);

export const api = {
  // 前台公开接口
  banners: () => http.get("/public/banners"),
  homeConfig: () => http.get("/public/home-config"),
  categories: () => http.get("/public/categories"),
  products: (params) => http.get("/public/products", { params }),
  productDetail: (id) => http.get(`/public/products/${id}`),
  news: (params) => http.get("/public/news", { params }),
  newsDetail: (id) => http.get(`/public/news/${id}`),
  about: () => http.get("/public/about"),
  contact: () => http.get("/public/contact"),
  submitMessage: (payload) => http.post("/public/messages", payload),
  // 验证码（登录/表单共用）
  captcha: () => http.post("/admin/auth/captcha"),
};

export default http;
