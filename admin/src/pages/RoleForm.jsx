import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Button,
  Form,
  Input,
  Switch,
  Space,
  Typography,
  Row,
  Col,
  message,
  ConfigProvider,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { roleApi } from "../api";

const MODULES = [
  { key: "banner", label: "轮播图" },
  { key: "news", label: "新闻" },
  { key: "home", label: "首页配置" },
  { key: "about", label: "关于我们" },
  { key: "contact", label: "联系信息" },
  { key: "product", label: "产品" },
  { key: "message", label: "留言" },
  { key: "dept", label: "部门" },
  { key: "role", label: "角色" },
  { key: "user", label: "账号" },
  { key: "log", label: "操作日志" },
];

function buildPerms(state) {
  const out = {};
  MODULES.forEach((m) => {
    const acts = [];
    if (state[m.key]?.view) acts.push("view");
    if (state[m.key]?.edit) acts.push("edit");
    if (acts.length) out[m.key] = acts;
  });
  return out;
}

function emptyState() {
  const init = {};
  MODULES.forEach((m) => (init[m.key] = { view: false, edit: false }));
  return init;
}

export default function RoleForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [permState, setPermState] = useState(emptyState());
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    roleApi
      .list()
      .then((r) => {
        const row = (r.items || []).find((x) => String(x.id) === String(id));
        if (row) {
          form.setFieldsValue({ name: row.name });
          const init = emptyState();
          MODULES.forEach((m) => {
            const acts = row.permissions?.[m.key] || [];
            init[m.key] = { view: acts.includes("view"), edit: acts.includes("edit") };
          });
          setPermState(init);
        }
      })
      .catch((e) => message.error(e.message || "加载角色失败"))
      .finally(() => setLoading(false));
  }, [id, isEdit, form]);

  const toggle = (mod, act, val) => {
    setPermState((s) => ({ ...s, [mod]: { ...s[mod], [act]: val } }));
  };

  const handleSave = async () => {
    let v;
    try {
      v = await form.validateFields();
    } catch (e) {
      return;
    }
    const permissions = buildPerms(permState);
    if (!Object.keys(permissions).length) {
      message.warning("请至少分配一个模块权限");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await roleApi.update(id, { name: v.name, permissions });
        message.success("修改成功");
      } else {
        await roleApi.create({ name: v.name, permissions });
        message.success("新增成功");
      }
      navigate("/role");
    } catch (e) {
      message.error(e.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <style>{`
        .role-form-compact .ant-form-item { margin-bottom: 8px; }
        .role-form-compact .ant-form-item-label { padding-bottom: 2px; }
        .role-form-compact .perm-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 4px 8px; border-radius: 4px;
        }
        .role-form-compact .perm-row:hover { background: #f5f5f5; }
        .role-form-compact .perm-row .perm-actions { display: inline-flex; align-items: center; gap: 12px; }
      `}</style>
      <Space align="center" style={{ marginBottom: 8, flexWrap: "wrap" }}>
        <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => navigate("/role")}>
          返回列表
        </Button>
        <Typography.Title level={5} style={{ margin: 0 }}>
          {isEdit ? "编辑角色" : "新增角色"}
        </Typography.Title>
      </Space>

      <Card loading={loading} styles={{ body: { padding: 16 } }}>
        <ConfigProvider componentSize="small">
          <div className="role-form-compact">
            <Form form={form} layout="vertical" requiredMark>
              {/* 行 1：角色名称 */}
              <Row gutter={12}>
                <Col xs={24} sm={12} lg={8}>
                  <Form.Item
                    name="name"
                    label="角色名称"
                    rules={[{ required: true, message: "请输入角色名称" }]}
                  >
                    <Input placeholder="角色名称" maxLength={50} />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
              权限矩阵（查看 / 编辑）—— 值内容较多，占整行，按两列排布
            </Typography.Paragraph>
            <Row gutter={12}>
              {MODULES.map((m) => (
                <Col xs={24} sm={12} key={m.key}>
                  <div className="perm-row">
                    <span>{m.label}</span>
                    <span className="perm-actions">
                      <span>
                        查看{" "}
                        <Switch
                          size="small"
                          checked={!!permState[m.key]?.view}
                          onChange={(v) => toggle(m.key, "view", v)}
                        />
                      </span>
                      <span>
                        编辑{" "}
                        <Switch
                          size="small"
                          checked={!!permState[m.key]?.edit}
                          disabled={!permState[m.key]?.view}
                          onChange={(v) => toggle(m.key, "edit", v)}
                        />
                      </span>
                    </span>
                  </div>
                </Col>
              ))}
            </Row>
            <Space style={{ marginTop: 12 }}>
              <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
                保存
              </Button>
              <Button onClick={() => navigate("/role")}>取消</Button>
            </Space>
          </div>
        </ConfigProvider>
      </Card>
    </div>
  );
}
