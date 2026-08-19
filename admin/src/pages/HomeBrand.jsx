import React, { useEffect, useState } from "react";
import { Card, Form, Input, Button, Typography, Space, message, Divider } from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { homeApi } from "../api";
import ImageUpload from "../components/ImageUpload";

export default function HomeBrand() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const d = await homeApi.getConfig();
        form.setFieldsValue({
          brand_slogan: d.brand_slogan || "",
          brand_desc: d.brand_desc || "",
          brand_image: d.brand_image || "",
          advantages: d.advantages && d.advantages.length ? d.advantages : [],
        });
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
      await homeApi.updateConfig(v);
      message.success("保存成功");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Typography.Title level={4}>首页品牌展示配置</Typography.Title>
      <Card loading={loading}>
        <Form form={form} layout="vertical">
          <Form.Item name="brand_slogan" label="品牌标语">
            <Input placeholder="如：让家更懂你" maxLength={100} />
          </Form.Item>
          <Form.Item name="brand_desc" label="品牌理念">
            <Input.TextArea rows={3} placeholder="品牌一句话介绍" />
          </Form.Item>
          <Form.Item name="brand_image" label="品牌配图">
            <ImageUpload width={240} height={140} />
          </Form.Item>
          <Divider orientation="left">优势点（首页 4 卡）</Divider>
          <Form.List name="advantages">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Space
                    key={key}
                    align="baseline"
                    style={{ display: "flex", marginBottom: 8 }}
                  >
                    <Form.Item {...rest} name={[name, "icon"]} label="图标" style={{ marginBottom: 0 }}>
                      <Input placeholder="icon 名称（可选）" style={{ width: 140 }} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "title"]} label="标题" rules={[{ required: true, message: "必填" }]} style={{ marginBottom: 0 }}>
                      <Input placeholder="优势标题" style={{ width: 160 }} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "desc"]} label="描述" style={{ marginBottom: 0 }}>
                      <Input placeholder="优势描述" style={{ width: 240 }} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add({ icon: "", title: "", desc: "" })} block icon={<PlusOutlined />}>
                    添加优势点
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
          <Divider />
          <Button type="primary" loading={saving} onClick={onSave}>
            保存配置
          </Button>
        </Form>
      </Card>
    </div>
  );
}
