import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

vi.mock("../api", () => ({
  authApi: {
    captcha: vi.fn().mockResolvedValue({
      captcha_id: "captcha-1",
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><text>A</text><text>B</text><text>C</text><text>D</text></svg>',
    }),
    login: vi.fn(),
    me: vi.fn(),
  },
}));

import Login from "../pages/Login";
import { authApi } from "../api";

describe("Login 页面", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("渲染标题/表单/验证码并自动获取验证码", async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // 标题与按钮
    expect(screen.getByText("蓁蓁智能家居 · 后台管理")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "登 录" })).toBeInTheDocument();

    // 挂载后自动拉取验证码
    await waitFor(() => expect(authApi.captcha).toHaveBeenCalledTimes(1));
  });

  it("输入账号密码验证码后提交登录", async () => {
    authApi.login.mockResolvedValue({
      token: "tok",
      permissions: {},
      must_change_pwd: false,
    });
    authApi.me.mockResolvedValue({ username: "admin", permissions: {} });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText("账号"), "admin");
    await user.type(screen.getByPlaceholderText("密码"), "123456");
    await user.type(screen.getByPlaceholderText("图形验证码"), "ABCD");
    await user.click(screen.getByRole("button", { name: "登 录" }));

    await waitFor(() => expect(authApi.login).toHaveBeenCalled());
    expect(authApi.login).toHaveBeenCalledWith({
      username: "admin",
      password: "123456",
      captcha_id: "captcha-1",
      captcha: "ABCD",
    });
  });
});
