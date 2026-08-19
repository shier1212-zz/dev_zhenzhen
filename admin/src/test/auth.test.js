import { describe, it, expect, beforeEach } from "vitest";
import {
  setToken,
  getToken,
  setUser,
  getUser,
  getPerms,
  hasPerm,
  isLoggedIn,
  clearSession,
} from "../store/auth";

const ADMIN_USER = {
  id: 1,
  username: "admin",
  real_name: "系统管理员",
  must_change_pwd: 1,
  permissions: {
    banner: ["view", "edit"],
    news: ["view", "edit"],
    product: ["view"],
  },
};

describe("auth store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("token 存取与登录态", () => {
    expect(isLoggedIn()).toBe(false);
    setToken("abc.def");
    expect(getToken()).toBe("abc.def");
    expect(isLoggedIn()).toBe(true);
    clearSession();
    expect(getToken()).toBe(null);
    expect(isLoggedIn()).toBe(false);
  });

  it("user 存取与权限解析", () => {
    setUser(ADMIN_USER);
    expect(getUser().username).toBe("admin");
    expect(getUser().must_change_pwd).toBe(1);
    expect(getPerms().banner).toEqual(["view", "edit"]);
  });

  it("hasPerm 按模块/动作判断", () => {
    setUser(ADMIN_USER);
    expect(hasPerm("banner", "view")).toBe(true);
    expect(hasPerm("banner", "edit")).toBe(true);
    expect(hasPerm("product", "edit")).toBe(false); // 仅 view
    expect(hasPerm("log", "view")).toBe(false); // 无该模块
    expect(hasPerm("role", "edit")).toBe(false);
  });

  it("无用户数据时权限为空", () => {
    expect(getPerms()).toEqual({});
    expect(hasPerm("banner", "view")).toBe(false);
  });

  it("非法 JSON 用户数据返回 null 而非抛错", () => {
    localStorage.setItem("zhz_admin_user", "{bad json");
    expect(getUser()).toBe(null);
  });
});
