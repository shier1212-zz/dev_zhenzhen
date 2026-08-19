import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Switch,
  Typography,
  Popconfirm,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { roleApi } from "../api";
import { hasPerm } from "../store/auth";

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

export default function RoleManage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [permState, setPermState] = useState({});

  const canEdit = hasPerm("role", "edit");

  const load = async () => {
    setLoading(true);
    try {
      const res = await roleApi.list();
      setData(res.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    const init = {};
    MODULES.forEach((m) => (init[m.key] = { view: false, edit: false }));
    setPermState(init);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    form.setFieldsValue({ name: row.name });
    const init = {};
    MODULES.forEach((m) => {
      const acts = row.permissions?.[m.key] || [];
      init[m.key] = { view: acts.includes("view"), edit: acts.includes("edit") };
    });
    setPermState(init);
    setModalOpen(true);
  };

  const toggle = (mod, act, val) => {
    setPermState((s) => ({ ...s, [mod]: { ...s[mod], [act]: val } }));
  };

  const handleOk = async () => {
    const v = await form.validateFields();
    const permissions = buildPerms(permState);
    if (!Object.keys(permissions).length) {
      message.warning("请至少分配一个模块权限");
      return;
    }
    if (editing) {
      await roleApi.update(editing.id, { name: v.name, permissions });
      message.success("修改成功");
    } else {
      await roleApi.create({ name: v.name, permissions });
      message.success("新增成功");
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (row) => {
    try {
      await roleApi.remove(row.id);
      message.success("删除成功");
      load();
    } catch (e) {}
  };

  const columns = [
    { title: "角色名称", dataIndex: "name" },
    {
      title: "模块数",
      width: 90,
      render: (_, row) => <Tag>{Object.keys(row.permissions || {}).length}</Tag>,
    },
    { title: "绑定账号", dataIndex: "user_count", width: 100, render: (v) => <Tag>{v}</Tag> },
    {
      title: "操作",
      width: 140,
      render: (_, row) => (
        <Space>
          {canEdit && <Button size="small" onClick={() => openEdit(row)}>编辑</Button>}
          {canEdit && (
            <Popconfirm
              title="确认删除该角色？（存在绑定账号将失败）"
              onConfirm={() => handleDelete(row)}
            >
              <Button size="small" danger>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>角色权限</Typography.Title>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          {canEdit && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增角色
            </Button>
          )}
        </Space>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={false}
        />
      </Card>

      <Modal
        title={editing ? "编辑角色" : "新增角色"}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="角色名称" rules={[{ required: true, message: "请输入角色名称" }]}>
            <Input placeholder="角色名称" maxLength={50} />
          </Form.Item>
        </Form>
        <Typography.Paragraph type="secondary">权限矩阵（查看 / 编辑）</Typography.Paragraph>
        <Space direction="vertical" style={{ width: "100%" }}>
          {MODULES.map((m) => (
            <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <span style={{ width: 90 }}>{m.label}</span>
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
            </div>
          ))}
        </Space>
      </Modal>
    </div>
  );
}
