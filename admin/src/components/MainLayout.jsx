import React, { useMemo, useState } from "react";
import { Layout, Menu, Avatar, Dropdown, Button, Space, Typography } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  KeyOutlined,
  EditOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { MENU_ITEMS } from "../menu";
import { hasPerm, getUser, clearSession, setUser } from "../store/auth";
import { authApi } from "../api";
import ChangePasswordModal from "./ChangePasswordModal";
import AvatarModal from "./AvatarModal";

const { Sider, Header, Content } = Layout;

function buildMenuItems() {
  const filter = (it) => {
    if (it.children) {
      const kids = it.children.filter((c) => hasPerm(c.module, "view"));
      if (!kids.length) return null;
      return { key: it.key, icon: it.icon, label: it.label, children: kids };
    }
    if (it.module && !hasPerm(it.module, "view")) return null;
    return { key: it.key, icon: it.icon, label: it.label };
  };
  return MENU_ITEMS.map(filter).filter(Boolean);
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [user, setUserState] = useState(getUser() || {});

  const refreshUser = () => setUserState(getUser() || {});
  const menuItems = useMemo(buildMenuItems, []);
  // 菜单高亮：精确路径优先；子页面（如 /product/1/edit）按最长路径前缀匹配
  const selectedKey = useMemo(() => {
    const path = location.pathname;
    const flat = (its) => its.flatMap((it) => (it.children ? flat(it.children) : [it]));
    const keys = flat(MENU_ITEMS).map((it) => it.key).filter((k) => k.startsWith("/"));
    if (keys.includes(path)) return path;
    let best = "";
    for (const k of keys) {
      if (k !== "/" && path.startsWith(`${k}/`) && k.length > best.length) best = k;
    }
    return best || path;
  }, [location.pathname]);
  const openKeys = useMemo(() => {
    const parent = MENU_ITEMS.find(
      (it) => it.children && it.children.some((c) => c.key === location.pathname)
    );
    return parent ? [parent.key] : [];
  }, [location.pathname]);

  const handleMenuClick = ({ key }) => {
    if (key !== location.pathname) navigate(key);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // ignore
    }
    clearSession();
    navigate("/login", { replace: true });
  };

  const userMenu = {
    items: [
      { key: "avatar", icon: <EditOutlined />, label: "修改头像" },
      { key: "pwd", icon: <KeyOutlined />, label: "修改密码" },
      { type: "divider" },
      { key: "logout", icon: <LogoutOutlined />, label: "退出登录", danger: true },
    ],
    onClick: ({ key }) => {
      if (key === "avatar") setAvatarOpen(true);
      else if (key === "pwd") setPwdOpen(true);
      else if (key === "logout") handleLogout();
    },
  };

  const forced = !!user.must_change_pwd;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={220}
        theme="dark"
      >
        <div
          style={{
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 600,
            fontSize: collapsed ? 14 : 16,
            letterSpacing: 1,
            gap: 8,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "#0E9384",
              color: "#fff",
              textAlign: "center",
              lineHeight: "28px",
            }}
          >
            蓁
          </span>
          {!collapsed && <span>蓁蓁智能家居</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          items={menuItems}
          selectedKeys={[selectedKey]}
          defaultOpenKeys={openKeys}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,21,41,0.08)",
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 18 }}
          />
          <Dropdown menu={userMenu} placement="bottomRight">
            <Space style={{ cursor: "pointer" }}>
              <Avatar src={user.avatar} icon={<UserOutlined />} />
              <span>
                {user.real_name || user.nickname || user.username || "管理员"}
              </span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, padding: 16, background: "#fff", borderRadius: 8 }}>
          <Outlet />
        </Content>
      </Layout>

      <ChangePasswordModal
        open={pwdOpen || forced}
        forced={forced}
        onClose={() => setPwdOpen(false)}
        onSuccess={refreshUser}
      />
      <AvatarModal open={avatarOpen} onClose={() => setAvatarOpen(false)} />
    </Layout>
  );
}
