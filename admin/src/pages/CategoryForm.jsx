import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Button,
  Form,
  Input,
  InputNumber,
  Space,
  Typography,
  Row,
  Col,
  message,
  ConfigProvider,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { categoryApi } from "../api";

export default function CategoryForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) {
      form.setFieldsValue({ sort: 0 });
      return;
    }
    categoryApi
      .list({})
      .then((r) => {
        const row = (r.items || []).find((x) => String(x.id) === String(id));
        if (row) form.setFieldsValue(row);
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, form]);

  const handleSave = async () => {
    let v;
    try {
      v = await form.validateFields();
    } catch (e) {
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await categoryApi.update(id, v);
        message.success("修改成功");
      } else {
        await categoryApi.create(v);
        message.success("新增成功");
      }
      navigate("/category");
    } catch (e) {
      message.error(e.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <style>{`
        .category-form-compact .ant-form-item { margin-bottom: 8px; }
        .category-form-compact .ant-form-item-label { padding-bottom: 2px; }
      `}</style>
      <Space align="center" style={{ marginBottom: 8, flexWrap: "wrap" }}>
        <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => navigate("/category")}>
          返回列表
        </Button>
        <Typography.Title level={5} style={{ margin: 0 }}>
          {isEdit ? "编辑分类" : "新增分类"}
        </Typography.Title>
      </Space>

      <Card loading={loading} styles={{ body: { padding: 16 } }}>
        <ConfigProvider componentSize="small">
          <div className="category-form-compact">
            <Form form={form} layout="vertical" requiredMark>
              {/* 行 1：值少，一行两个 —— 分类名称 + 排序 */}
              <Row gutter={12}>
                <Col xs={24} sm={12} lg={16}>
                  <Form.Item
                    name="name"
                    label="分类名称"
                    rules={[{ required: true, message: "请输入分类名称" }]}
                  >
                    <Input placeholder="分类名称" maxLength={50} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Form.Item name="sort" label="排序" rules={[{ required: true }]}>
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
            <Space>
              <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
                保存
              </Button>
              <Button onClick={() => navigate("/category")}>取消</Button>
            </Space>
          </div>
        </ConfigProvider>
      </Card>
    </div>
  );
}
