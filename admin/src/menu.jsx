import {
  DashboardOutlined,
  PictureOutlined,
  FileTextOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  PhoneOutlined,
  AppstoreOutlined,
  TagsOutlined,
  MessageOutlined,
  ApartmentOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  ProfileOutlined,
  SettingOutlined,
} from "@ant-design/icons";

// 菜单与权限模块映射；module 为 null 表示分组/常驻（按子项权限过滤）
export const MENU_ITEMS = [
  { key: "/", label: "工作台", icon: <DashboardOutlined />, module: null },
  { key: "/banner", label: "轮播图管理", icon: <PictureOutlined />, module: "banner" },
  { key: "/news", label: "新闻管理", icon: <FileTextOutlined />, module: "news" },
  {
    key: "content",
    label: "内容配置",
    icon: <HomeOutlined />,
    module: null,
    children: [
      { key: "/home/brand", label: "首页品牌展示", module: "home" },
      { key: "/home/featured", label: "首页精选产品", module: "home" },
      { key: "/about", label: "关于我们", module: "about" },
      { key: "/contact", label: "联系信息", module: "contact" },
    ],
  },
  {
    key: "product",
    label: "产品管理",
    icon: <AppstoreOutlined />,
    module: null,
    children: [
      { key: "/category", label: "产品分类", module: "product" },
      { key: "/product", label: "产品管理", module: "product" },
    ],
  },
  { key: "/message", label: "留言管理", icon: <MessageOutlined />, module: "message" },
  {
    key: "system",
    label: "系统管理",
    icon: <SettingOutlined />,
    module: null,
    children: [
      { key: "/department", label: "部门管理", module: "dept" },
      { key: "/user", label: "账号管理", module: "user" },
      { key: "/role", label: "角色权限", module: "role" },
      { key: "/log", label: "操作日志", module: "log" },
    ],
  },
];
