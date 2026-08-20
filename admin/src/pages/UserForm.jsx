import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Button,
  Form,
  Input,
  Select,
  Switch,
  Space,
  Typography,
  Row,
  Col,
  message,
  ConfigProvider,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { userApi, departmentApi, roleApi } from "../api";

const GENDERS = [
  { value: 0, label: "未知" },
  { value: 1, label: "男" },
  { value: 2, label: "女" },
];

export default function UserForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    departmentApi.list({}).then((r) => setDepartments(r.items || [])).catch(() => {});
    roleApi.list().then((r) => setRoles(r.items || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) {
      form.setFieldsValue({ gender: 0, is_activate: true });
      return;
    }
    userApi
      .get(id)
      .then((d) => {
        form.setFieldsValue({ ...d, is_activate: !!d.is_activate });
      })
      .catch((e) => message.error(e.message || "加载账号失败"))
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
        await userApi.update(id, v);
        message.success("修改成功");
      } else {
        await userApi.create(v);
        message.success("新增成功");
      }
      navigate("/user");
    } catch (e) {
      message.error(e.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const deptOptions = departments.map((d) => ({ value: d.id, label: d.name }));
  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));

  return (
    <div>
      <style>{`
        .user-form-compact .ant-form-item { margin-bottom: 8px; }
        .user-form-compact .ant-form-item-label { padding-bottom: 2px; }
      `}</style>
      <Space align="center" style={{ marginBottom: 8, flexWrap: "wrap" }}>
        <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => navigate("/user")}>
          返回列表
        </Button>
        <Typography.Title level={5} style={{ margin: 0 }}>
          {isEdit ? "编辑账号" : "新增账号"}
        </Typography.Title>
      </Space>

      <Card loading={loading} styles={{ body: { padding: 16 } }}>
        <ConfigProvider componentSize="small">
          <div className="user-form-compact">
            <Form form={form} layout="vertical" requiredMark>
              {/* 行 1：登录名 + 初始密码（仅新增） */}
              <Row gutter={12}>
                <Col xs={24} sm={12} lg={12}>
                  <Form.Item
                    name="username"
                    label="登录名"
                    rules={[{ required: true, message: "3-50 位字母数字下划线" }]}
                  >
                    <Input placeholder="登录名" disabled={isEdit} maxLength={50} />
                  </Form.Item>
                </Col>
                {!isEdit && (
                  <Col xs={24} sm={12} lg={12}>
                    <Form.Item
                      name="password"
                      label="初始密码"
                      rules={[{ required: true, message: "至少 6 位" }]}
                    >
                      <Input.Password placeholder="至少 6 位" />
                    </Form.Item>
                  </Col>
                )}
              </Row>
              {/* 行 2：姓名 + 昵称 + 性别 */}
              <Row gutter={12}>
                <Col xs={12} sm={12} lg={8}>
                  <Form.Item name="real_name" label="姓名">
                    <Input maxLength={50} placeholder="真实姓名" />
                  </Form.Item>
                </Col>
                <Col xs={12} sm={12} lg={8}>
                  <Form.Item name="nickname" label="昵称">
                    <Input maxLength={50} placeholder="昵称" />
                  </Form.Item>
                </Col>
                <Col xs={12} sm={12} lg={8}>
                  <Form.Item name="gender" label="性别">
                    <Select options={GENDERS} />
                  </Form.Item>
                </Col>
              </Row>
              {/* 行 3：手机号 + 邮箱 */}
              <Row gutter={12}>
                <Col xs={24} sm={12} lg={12}>
                  <Form.Item name="phone" label="手机号">
                    <Input maxLength={20} placeholder="手机号" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={12}>
                  <Form.Item name="email" label="邮箱">
                    <Input maxLength={100} placeholder="邮箱" />
                  </Form.Item>
                </Col>
              </Row>
              {/* 行 4：职位（整行） */}
              <Form.Item name="post" label="职位">
                <Input maxLength={64} placeholder="职位" />
              </Form.Item>
              {/* 行 5：部门 + 角色 + 启用 */}
              <Row gutter={12}>
                <Col xs={12} sm={12} lg={8}>
                  <Form.Item name="dept_id" label="部门">
                    <Select placeholder="选择部门" allowClear options={deptOptions} />
                  </Form.Item>
                </Col>
                <Col xs={12} sm={12} lg={8}>
                  <Form.Item
                    name="role_id"
                    label="角色"
                    rules={[{ required: true, message: "请选择角色" }]}
                  >
                    <Select placeholder="选择角色" options={roleOptions} />
                  </Form.Item>
                </Col>
                <Col xs={12} sm={12} lg={8}>
                  <Form.Item name="is_activate" label="启用" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
            <Space>
              <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
                保存
              </Button>
              <Button onClick={() => navigate("/user")}>取消</Button>
            </Space>
          </div>
        </ConfigProvider>
      </Card>
    </div>
  );
}
