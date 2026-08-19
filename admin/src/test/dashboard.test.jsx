import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// 超管：所有权限放行
vi.mock("../store/auth", () => ({
  hasPerm: () => true,
}));

// 模拟后端列表接口返回（total + items）
vi.mock("../api", () => ({
  productApi: { list: vi.fn().mockResolvedValue({ items: [], total: 8 }) },
  newsApi: { list: vi.fn().mockResolvedValue({ items: [], total: 4 }) },
  messageApi: {
    list: vi.fn().mockResolvedValue({
      items: [{ name: "张三", phone: "13900000000", content: "咨询一下产品报价" }],
      total: 3,
    }),
  },
  userApi: { list: vi.fn().mockResolvedValue({ items: [], total: 2 }) },
  logApi: {
    list: vi.fn().mockResolvedValue({
      items: [{ username: "admin", module: "product", action: "view", created_date: "2026-08-19 10:00" }],
      total: 1,
    }),
  },
}));

import Dashboard from "../pages/Dashboard";

describe("Dashboard 统计卡回归测试", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("统计卡显示真实数字，而非停留在初始值 0（曾因 forEach 解构 undefined 导致 setStats 被跳过）", async () => {
    const { container } = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      const values = [...container.querySelectorAll(".ant-statistic-content-value")].map(
        (el) => el.textContent
      );
      // 4 张统计卡应分别渲染后端返回的 total
      expect(values).toContain("8"); // 产品总数
      expect(values).toContain("4"); // 新闻总数
      expect(values).toContain("3"); // 待处理留言
      expect(values).toContain("2"); // 账号总数
    });

    // 下方留言区块（副作用数据）也应正常渲染
    expect(screen.getByText("张三 · 13900000000")).toBeInTheDocument();
    // 操作日志区块同步渲染
    expect(screen.getByText(/admin/)).toBeInTheDocument();
  });
});
