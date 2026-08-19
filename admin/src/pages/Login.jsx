import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, Form, Input, Button, message, Typography } from "antd";
import { UserOutlined, LockOutlined, ReloadOutlined } from "@ant-design/icons";
import { authApi } from "../api";
import { setToken, setUser, isLoggedIn } from "../store/auth";

export default function Login() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [captcha, setCaptcha] = useState({ captcha_id: "", svg: "" });
  const [loading, setLoading] = useState(false);

  const loadCaptcha = async () => {
    try {
      const data = await authApi.captcha();
      setCaptcha({ captcha_id: data.captcha_id, svg: data.svg });
    } catch (e) {
      // 拦截器已提示
    }
  };

  useEffect(() => {
    loadCaptcha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const data = await authApi.login({
        username: values.username,
        password: values.password,
        captcha_id: captcha.captcha_id,
        captcha: values.captcha,
      });
      setToken(data.token);
      const me = await authApi.me();
      setUser(me);
      message.success("登录成功");
      navigate("/", { replace: true });
    } catch (e) {
      loadCaptcha();
      form.setFieldsValue({ captcha: "" });
    } finally {
      setLoading(false);
    }
  };

  if (isLoggedIn()) return <Navigate to="/" replace />;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0E9384 0%, #0b6f64 100%)",
      }}
    >
      <Card style={{ width: 380, boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              background: "#0E9384",
              color: "#fff",
              fontSize: 24,
              fontWeight: 700,
              lineHeight: "48px",
              margin: "0 auto 12px",
            }}
          >
            蓁
          </div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            蓁蓁智能家居 · 后台管理
          </Typography.Title>
          <Typography.Text type="secondary">请使用运营账号登录</Typography.Text>
        </div>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="username"
            rules={[{ required: true, message: "请输入账号" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="账号" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="captcha"
            rules={[{ required: true, message: "请输入验证码" }]}
          >
            <Input
              placeholder="图形验证码"
              size="large"
              addonAfter={
                <span
                  style={{ cursor: "pointer", display: "inline-flex" }}
                  onClick={loadCaptcha}
                  title="点击刷新"
                >
                  {captcha.svg ? (
                    <span dangerouslySetInnerHTML={{ __html: captcha.svg }} />
                  ) : (
                    <ReloadOutlined />
                  )}
                </span>
              }
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={loading}
          >
            登 录
          </Button>
        </Form>
      </Card>
    </div>
  );
}
