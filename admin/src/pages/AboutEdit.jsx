import React, { useEffect, useState } from "react";
import { Card, Form, Input, Button, Typography, Space, message, Divider } from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { aboutApi } from "../api";
import RichTextEditor from "../components/RichTextEditor";

export default function AboutEdit() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const d = await aboutApi.get();
        const vision = d.vision || {};
        form.setFieldsValue({
          brand_story: d.brand_story || "",
          mission: vision.mission || "",
          vision: vision.vision || "",
          values: vision.values || "",
          milestones: d.milestones && d.milestones.length ? d.milestones : [],
          honors: d.honors && d.honors.length ? d.honors : [],
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
      await aboutApi.update({
        brand_story: v.brand_story,
        vision: { mission: v.mission, vision: v.vision, values: v.values },
        milestones: v.milestones || [],
        honors: v.honors || [],
      });
      message.success("保存成功");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Typography.Title level={4}>关于我们编辑</Typography.Title>
      <Card loading={loading}>
        <Form form={form} layout="vertical">
          <Form.Item name="brand_story" label="品牌故事">
            <RichTextEditor height={280} />
          </Form.Item>
          <Divider orientation="left">愿景三卡</Divider>
          <Space size="large" style={{ display: "flex", flexWrap: "wrap" }}>
            <Form.Item name="mission" label="使命" style={{ flex: 1, minWidth: 200 }}>
              <Input.TextArea rows={2} placeholder="企业使命" />
            </Form.Item>
            <Form.Item name="vision" label="愿景" style={{ flex: 1, minWidth: 200 }}>
              <Input.TextArea rows={2} placeholder="企业愿景" />
            </Form.Item>
            <Form.Item name="values" label="价值观" style={{ flex: 1, minWidth: 200 }}>
              <Input.TextArea rows={2} placeholder="核心价值观" />
            </Form.Item>
          </Space>
          <Divider orientation="left">发展历程（时间轴）</Divider>
          <Form.List name="milestones">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Space key={key} align="baseline" style={{ display: "flex", marginBottom: 8 }}>
                    <Form.Item {...rest} name={[name, "year"]} label="年份" style={{ marginBottom: 0 }}>
                      <Input placeholder="如 2019" style={{ width: 110 }} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "title"]} label="标题" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                      <Input placeholder="里程碑标题" style={{ width: 200 }} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "desc"]} label="描述" style={{ marginBottom: 0 }}>
                      <Input placeholder="说明" style={{ width: 260 }} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add({ year: "", title: "", desc: "" })} block icon={<PlusOutlined />}>
                    添加里程碑
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
          <Divider orientation="left">资质荣誉墙</Divider>
          <Form.List name="honors">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Space key={key} align="baseline" style={{ display: "flex", marginBottom: 8 }}>
                    <Form.Item {...rest} name={[name, "title"]} label="荣誉名称" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                      <Input placeholder="荣誉/资质名称" style={{ width: 320 }} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "desc"]} label="说明" style={{ marginBottom: 0 }}>
                      <Input placeholder="可选说明" style={{ width: 240 }} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add({ title: "", desc: "" })} block icon={<PlusOutlined />}>
                    添加荣誉
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
          <Divider />
          <Button type="primary" loading={saving} onClick={onSave}>
            保存
          </Button>
        </Form>
      </Card>
    </div>
  );
}
