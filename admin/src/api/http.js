import axios from "axios";
import { message } from "antd";
import { clearSession } from "../store/auth";

// 统一封装后端响应：{ code, message, data }
// 成功(code===0)时返回 data；失败或 401 时统一提示并 reject
const http = axios.create({
  baseURL: "/api/v1/admin",
  timeout: 20000,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("zhz_admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (resp) => {
    const body = resp.data;
    if (body && typeof body.code === "number") {
      if (body.code !== 0) {
        message.error(body.message || "操作失败");
        return Promise.reject(new Error(body.message || "操作失败"));
      }
      return body.data;
    }
    return body;
  },
  (err) => {
    if (err.response) {
      const { status, data } = err.response;
      const msg = (data && data.message) || `请求失败 (${status})`;
      if (status === 401) {
        clearSession();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        message.error("登录状态已失效，请重新登录");
      } else {
        message.error(msg);
      }
      return Promise.reject(new Error(msg));
    }
    message.error("网络异常，请稍后重试");
    return Promise.reject(err);
  }
);

export default http;
