import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import { authApi } from "../api";
import { setUser, getUser } from "../store/auth";

// 修改密码。forced=true 时不可关闭（首次登录强制改密）。
export default function ChangePasswordModal({ open, forced = false, onClose, onSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, form]);

  const handleOk = async () => {
    const v = await form.validateFields();
    setLoading(true);
    try {
      await authApi.changePassword({
        old_password: v.old_password,
        new_password: v.new_password,
      });
      message.success("密码修改成功");
      const u = getUser();
      if (u) setUser({ ...u, must_change_pwd: 0 });
      if (onSuccess) onSuccess();
      form.resetFields();
      if (!forced) onClose && onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={forced ? "首次登录，请修改密码" : "修改密码"}
      open={open}
      onOk={handleOk}
      onCancel={forced ? undefined : onClose}
      okText="保存"
      cancelText="取消"
      closable={!forced}
      maskClosable={!forced}
      footer={
        forced ? (
          <Button type="primary" loading={loading} onClick={handleOk}>
            确认修改
          </Button>
        ) : undefined
      }
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        {!forced && (
          <Form.Item
            name="old_password"
            label="原密码"
            rules={[{ required: true, message: "请输入原密码" }]}
          >
            <Input.Password placeholder="请输入原密码" />
          </Form.Item>
        )}
        {forced && (
          <Form.Item
            name="old_password"
            label="当前密码"
            rules={[{ required: true, message: "请输入当前密码" }]}
          >
            <Input.Password placeholder="请输入当前登录密码" />
          </Form.Item>
        )}
        <Form.Item
          name="new_password"
          label="新密码"
          rules={[
            { required: true, message: "请输入新密码" },
            { min: 6, message: "密码至少 6 位" },
          ]}
        >
          <Input.Password placeholder="至少 6 位" />
        </Form.Item>
        <Form.Item
          name="confirm"
          label="确认新密码"
          dependencies={["new_password"]}
          rules={[
            { required: true, message: "请再次输入新密码" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("new_password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("两次输入的密码不一致"));
              },
            }),
          ]}
        >
          <Input.Password placeholder="请再次输入新密码" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
