import http from "./http";

// ---------- 认证 auth ----------
export const authApi = {
  captcha: () => http.post("/auth/captcha"),
  login: (body) => http.post("/auth/login", body),
  logout: () => http.post("/auth/logout"),
  me: () => http.get("/auth/me"),
  changePassword: (body) => http.put("/auth/password", body),
  updateAvatar: (body) => http.put("/auth/avatar", body),
};

// ---------- 轮播 banner ----------
export const bannerApi = {
  list: (params) => http.get("/banners", { params }),
  get: (id) => http.get(`/banners/${id}`),
  create: (body) => http.post("/banners", body),
  update: (id, body) => http.put(`/banners/${id}`, body),
  setStatus: (id, is_activate) => http.put(`/banners/${id}/status`, { is_activate }),
  remove: (id) => http.delete(`/banners/${id}`),
};

// ---------- 新闻 news ----------
export const newsApi = {
  list: (params) => http.get("/news", { params }),
  get: (id) => http.get(`/news/${id}`),
  create: (body) => http.post("/news", body),
  update: (id, body) => http.put(`/news/${id}`, body),
  remove: (id) => http.delete(`/news/${id}`),
};

// ---------- 首页 home ----------
export const homeApi = {
  getConfig: () => http.get("/home/config"),
  updateConfig: (body) => http.put("/home/config", body),
  getFeatured: () => http.get("/home/featured"),
  updateFeatured: (product_ids) => http.put("/home/featured", { product_ids }),
};

// ---------- 关于我们 about ----------
export const aboutApi = {
  get: () => http.get("/about"),
  update: (body) => http.put("/about", body),
};

// ---------- 联系信息 contact ----------
export const contactApi = {
  get: () => http.get("/contact"),
  update: (body) => http.put("/contact", body),
};

// ---------- 产品分类 category ----------
export const categoryApi = {
  list: (params) => http.get("/categories", { params }),
  create: (body) => http.post("/categories", body),
  update: (id, body) => http.put(`/categories/${id}`, body),
  remove: (id) => http.delete(`/categories/${id}`),
};

// ---------- 产品 product ----------
export const productApi = {
  list: (params) => http.get("/products", { params }),
  get: (id) => http.get(`/products/${id}`),
  create: (body) => http.post("/products", body),
  update: (id, body) => http.put(`/products/${id}`, body),
  setStatus: (id, status) => http.put(`/products/${id}/status`, { status }),
  batchStatus: (ids, status) => http.put("/products/batch-status", { ids, status }),
  remove: (id) => http.delete(`/products/${id}`),
};

// ---------- 留言 message ----------
export const messageApi = {
  list: (params) => http.get("/messages", { params }),
  get: (id) => http.get(`/messages/${id}`),
  handle: (id, body) => http.put(`/messages/${id}`, body),
  remove: (id) => http.delete(`/messages/${id}`),
};

// ---------- 部门 department ----------
export const departmentApi = {
  list: () => http.get("/departments"),
  create: (body) => http.post("/departments", body),
  update: (id, body) => http.put(`/departments/${id}`, body),
  remove: (id) => http.delete(`/departments/${id}`),
};

// ---------- 角色 role ----------
export const roleApi = {
  list: () => http.get("/roles"),
  create: (body) => http.post("/roles", body),
  update: (id, body) => http.put(`/roles/${id}`, body),
  remove: (id) => http.delete(`/roles/${id}`),
};

// ---------- 账号 user ----------
export const userApi = {
  list: (params) => http.get("/users", { params }),
  get: (id) => http.get(`/users/${id}`),
  create: (body) => http.post("/users", body),
  update: (id, body) => http.put(`/users/${id}`, body),
  setStatus: (id, is_activate) => http.put(`/users/${id}/status`, { is_activate }),
  resetPassword: (id, new_password) =>
    http.put(`/users/${id}/password`, { new_password }),
  remove: (id) => http.delete(`/users/${id}`),
};

// ---------- 操作日志 log ----------
export const logApi = {
  list: (params) => http.get("/logs", { params }),
};

// ---------- 上传 upload ----------
export const uploadApi = {
  upload: (file) => {
    const form = new FormData();
    form.append("file", file);
    return http.post("/upload", form);
  },
};

export default {
  auth: authApi,
  banner: bannerApi,
  news: newsApi,
  home: homeApi,
  about: aboutApi,
  contact: contactApi,
  category: categoryApi,
  product: productApi,
  message: messageApi,
  department: departmentApi,
  role: roleApi,
  user: userApi,
  log: logApi,
  upload: uploadApi,
};
