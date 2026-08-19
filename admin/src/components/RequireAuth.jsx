import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Spin } from "antd";
import { isLoggedIn, getUser, setUser } from "../store/auth";
import { authApi } from "../api";

// 路由守卫：未登录跳转 /login；已登录但本地无用户信息时拉取 /me。
export default function RequireAuth({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      setReady(true);
      return;
    }
    if (getUser()) {
      setReady(true);
      return;
    }
    authApi
      .me()
      .then((u) => setUser(u))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  if (!ready) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }
  return children;
}
