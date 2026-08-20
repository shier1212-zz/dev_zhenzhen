import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";
import MainLayout from "./components/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import BannerManage from "./pages/BannerManage";
import BannerForm from "./pages/BannerForm";
import NewsManage from "./pages/NewsManage";
import NewsForm from "./pages/NewsForm";
import HomeBrand from "./pages/HomeBrand";
import HomeFeatured from "./pages/HomeFeatured";
import AboutEdit from "./pages/AboutEdit";
import ContactConfig from "./pages/ContactConfig";
import CategoryManage from "./pages/CategoryManage";
import CategoryForm from "./pages/CategoryForm";
import ProductManage from "./pages/ProductManage";
import ProductForm from "./pages/ProductForm";
import MessageManage from "./pages/MessageManage";
import DepartmentManage from "./pages/DepartmentManage";
import DepartmentForm from "./pages/DepartmentForm";
import UserManage from "./pages/UserManage";
import UserForm from "./pages/UserForm";
import RoleManage from "./pages/RoleManage";
import RoleForm from "./pages/RoleForm";
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
        <Route path="/banner/new" element={<BannerForm />} />
        <Route path="/banner/:id/edit" element={<BannerForm />} />
        <Route path="/news" element={<NewsManage />} />
        <Route path="/news/new" element={<NewsForm />} />
        <Route path="/news/:id/edit" element={<NewsForm />} />
        <Route path="/home/brand" element={<HomeBrand />} />
        <Route path="/home/featured" element={<HomeFeatured />} />
        <Route path="/about" element={<AboutEdit />} />
        <Route path="/contact" element={<ContactConfig />} />
        <Route path="/category" element={<CategoryManage />} />
        <Route path="/category/new" element={<CategoryForm />} />
        <Route path="/category/:id/edit" element={<CategoryForm />} />
        <Route path="/product" element={<ProductManage />} />
        <Route path="/product/new" element={<ProductForm />} />
        <Route path="/product/:id/edit" element={<ProductForm />} />
        <Route path="/message" element={<MessageManage />} />
        <Route path="/department" element={<DepartmentManage />} />
        <Route path="/department/new" element={<DepartmentForm />} />
        <Route path="/department/:id/edit" element={<DepartmentForm />} />
        <Route path="/user" element={<UserManage />} />
        <Route path="/user/new" element={<UserForm />} />
        <Route path="/user/:id/edit" element={<UserForm />} />
        <Route path="/role" element={<RoleManage />} />
        <Route path="/role/new" element={<RoleForm />} />
        <Route path="/role/:id/edit" element={<RoleForm />} />
        <Route path="/log" element={<LogManage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
