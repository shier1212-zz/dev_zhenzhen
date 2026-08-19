import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";
import MainLayout from "./components/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import BannerManage from "./pages/BannerManage";
import NewsManage from "./pages/NewsManage";
import HomeBrand from "./pages/HomeBrand";
import HomeFeatured from "./pages/HomeFeatured";
import AboutEdit from "./pages/AboutEdit";
import ContactConfig from "./pages/ContactConfig";
import CategoryManage from "./pages/CategoryManage";
import ProductManage from "./pages/ProductManage";
import MessageManage from "./pages/MessageManage";
import DepartmentManage from "./pages/DepartmentManage";
import UserManage from "./pages/UserManage";
import RoleManage from "./pages/RoleManage";
import LogManage from "./pages/LogManage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/banner" element={<BannerManage />} />
        <Route path="/news" element={<NewsManage />} />
        <Route path="/home/brand" element={<HomeBrand />} />
        <Route path="/home/featured" element={<HomeFeatured />} />
        <Route path="/about" element={<AboutEdit />} />
        <Route path="/contact" element={<ContactConfig />} />
        <Route path="/category" element={<CategoryManage />} />
        <Route path="/product" element={<ProductManage />} />
        <Route path="/message" element={<MessageManage />} />
        <Route path="/department" element={<DepartmentManage />} />
        <Route path="/user" element={<UserManage />} />
        <Route path="/role" element={<RoleManage />} />
        <Route path="/log" element={<LogManage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
