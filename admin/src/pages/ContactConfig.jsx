import React, { useEffect, useState } from "react";
import { Card, Form, Input, Button, Typography, message } from "antd";
import { contactApi } from "../api";

export default function ContactConfig() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const d = await contactApi.get();
        form.setFieldsValue(d);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [form]);

  const onSave = async () => {
    const v = await form.validateFields();
    setSaving(true);
    try {
      await contactApi.update(v);
      message.success("保存成功");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Typography.Title level={4}>联系信息配置</Typography.Title>
      <Card loading={loading} style={{ maxWidth: 640 }}>
        <Form form={form} layout="vertical">
          <Form.Item name="company_name" label="企业名称">
            <Input placeholder="蓁蓁智能家居" maxLength={100} />
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input placeholder="400-xxx-xxxx" maxLength={50} />
          </Form.Item>
          <Form.Item name="email" label="联系邮箱">
            <Input placeholder="contact@example.com" maxLength={100} />
          </Form.Item>
          <Form.Item name="address" label="联系地址">
            <Input placeholder="详细地址" maxLength={255} />
          </Form.Item>
          <Form.Item name="work_time" label="工作时间">
            <Input placeholder="周一至周五 9:00-18:00" maxLength={100} />
          </Form.Item>
          <Form.Item name="icp_no" label="备案号">
            <Input placeholder="ICP 备案号" maxLength={100} />
          </Form.Item>
          <Button type="primary" loading={saving} onClick={onSave}>
            保存配置
          </Button>
        </Form>
      </Card>
    </div>
  );
}
