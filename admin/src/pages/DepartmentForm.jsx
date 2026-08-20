import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Button,
  Form,
  Input,
  InputNumber,
  TreeSelect,
  Space,
  Typography,
  Row,
  Col,
  message,
  ConfigProvider,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { departmentApi } from "../api";

function toTreeData(items, excludeId) {
  return (items || [])
    .filter((d) => d.id !== excludeId)
    .map((d) => ({
      value: d.id,
      title: d.name,
      children: toTreeData(d.children, excludeId),
    }));
}

export default function DepartmentForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    departmentApi.list().then((r) => setData(r.items || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) {
      form.setFieldsValue({ sort: 0 });
      return;
    }
    departmentApi
      .list()
      .then((r) => {
        const row = (r.items || []).find((x) => String(x.id) === String(id));
        if (row) form.setFieldsValue({ ...row, parent_id: row.parent_id || undefined });
      })
      .catch((e) => message.error(e.message || "加载部门失败"))
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
        await departmentApi.update(id, v);
        message.success("修改成功");
      } else {
        await departmentApi.create(v);
        message.success("新增成功");
      }
      navigate("/department");
    } catch (e) {
      message.error(e.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const excludeId = isEdit ? Number(id) : undefined;

  return (
    <div>
      <style>{`
        .dept-form-compact .ant-form-item { margin-bottom: 8px; }
        .dept-form-compact .ant-form-item-label { padding-bottom: 2px; }
      `}</style>
      <Space align="center" style={{ marginBottom: 8, flexWrap: "wrap" }}>
        <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => navigate("/department")}>
          返回列表
        </Button>
        <Typography.Title level={5} style={{ margin: 0 }}>
          {isEdit ? "编辑部门" : "新增部门"}
        </Typography.Title>
      </Space>

      <Card loading={loading} styles={{ body: { padding: 16 } }}>
        <ConfigProvider componentSize="small">
          <div className="dept-form-compact">
            <Form form={form} layout="vertical" requiredMark>
              {/* 行 1：值少，一行两个 —— 部门名称 + 部门编码 */}
              <Row gutter={12}>
                <Col xs={24} sm={12} lg={12}>
                  <Form.Item
                    name="name"
                    label="部门名称"
                    rules={[{ required: true, message: "请输入部门名称" }]}
                  >
                    <Input placeholder="部门名称" maxLength={50} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={12}>
                  <Form.Item name="code" label="部门编码">
                    <Input placeholder="如 HQ / MKT（唯一）" maxLength={50} />
                  </Form.Item>
                </Col>
              </Row>
              {/* 行 2：值少，一行两个 —— 上级部门 + 排序 */}
              <Row gutter={12}>
                <Col xs={24} sm={12} lg={16}>
                  <Form.Item name="parent_id" label="上级部门">
                    <TreeSelect
                      treeData={toTreeData(data, excludeId)}
                      placeholder="不选择则为顶级部门"
                      allowClear
                      treeDefaultExpandAll
                    />
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
              <Button onClick={() => navigate("/department")}>取消</Button>
            </Space>
          </div>
        </ConfigProvider>
      </Card>
    </div>
  );
}
