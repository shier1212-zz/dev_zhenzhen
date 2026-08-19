import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  InputNumber,
  Switch,
  Typography,
  Popconfirm,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { userApi, departmentApi, roleApi } from "../api";
import { hasPerm } from "../store/auth";

const GENDERS = [
  { value: 0, label: "未知" },
  { value: 1, label: "男" },
  { value: 2, label: "女" },
];

export default function UserManage() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const [resetOpen, setResetOpen] = useState(false);
  const [resetId, setResetId] = useState(null);
  const [resetForm] = Form.useForm();

  const canEdit = hasPerm("user", "edit");

  const load = async () => {
    setLoading(true);
    try {
      const res = await userApi.list({
        page,
        page_size: 10,
        keyword: keyword || undefined,
      });
      setData(res.items || []);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    departmentApi.list({}).then((r) => setDepartments(r.items || []));
    roleApi.list().then((r) => setRoles(r.items || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ gender: 0, is_activate: 1 });
    setModalOpen(true);
  };

  const openEdit = async (row) => {
    const d = await userApi.get(row.id);
    setEditing(row);
    form.setFieldsValue(d);
    setModalOpen(true);
  };

  const handleOk = async () => {
    const v = await form.validateFields();
    if (editing) {
      await userApi.update(editing.id, v);
      message.success("修改成功");
    } else {
      await userApi.create(v);
      message.success("新增成功");
    }
    setModalOpen(false);
    load();
  };

  const toggleStatus = async (row) => {
    await userApi.setStatus(row.id, row.is_activate ? 0 : 1);
    message.success("状态已更新");
    load();
  };

  const openReset = (row) => {
    setResetId(row.id);
    resetForm.resetFields();
    setResetOpen(true);
  };

  const handleReset = async () => {
    const v = await resetForm.validateFields();
    await userApi.resetPassword(resetId, v.new_password);
    message.success("密码已重置");
    setResetOpen(false);
    load();
  };

  const handleDelete = async (row) => {
    try {
      await userApi.remove(row.id);
      message.success("删除成功");
      load();
    } catch (e) {}
  };

  const deptOptions = departments.map((d) => ({ value: d.id, label: d.name }));
  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));

  const columns = [
    { title: "登录名", dataIndex: "username", width: 110 },
    { title: "姓名", dataIndex: "real_name", width: 90, render: (v) => v || "-" },
    { title: "部门", dataIndex: "dept_name", width: 100, render: (v) => v || "-" },
    { title: "角色", dataIndex: "role_name", width: 100, render: (v) => v || "-" },
    { title: "手机号", dataIndex: "phone", width: 130, render: (v) => v || "-" },
    {
      title: "状态",
      dataIndex: "is_activate",
      width: 90,
      render: (v) =>
        v ? (
          <Tag color="green">启用</Tag>
        ) : (
          <Tag color="default">停用</Tag>
        ),
    },
    {
      title: "操作",
      width: canEdit ? 220 : 0,
      render: (_, row) =>
        canEdit ? (
          <Space>
            <Button size="small" onClick={() => openEdit(row)}>编辑</Button>
            <Button size="small" onClick={() => toggleStatus(row)}>
              {row.is_activate ? "停用" : "启用"}
            </Button>
            <Button size="small" onClick={() => openReset(row)}>重置密码</Button>
            <Popconfirm title="确认删除该账号？" onConfirm={() => handleDelete(row)}>
              <Button size="small" danger>删除</Button>
            </Popconfirm>
          </Space>
        ) : null,
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>账号管理</Typography.Title>
      <Card>
        <Space style={{ marginBottom: 16, flexWrap: "wrap" }}>
          <Input.Search
            placeholder="登录名/姓名/电话搜索"
            allowClear
            onSearch={(v) => {
              setKeyword(v);
              setPage(1);
              setTimeout(load, 0);
            }}
            style={{ width: 240 }}
          />
          {canEdit && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增账号
            </Button>
          )}
        </Space>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={{ current: page, total, pageSize: 10, onChange: setPage }}
        />
      </Card>

      <Modal
        title={editing ? "编辑账号" : "新增账号"}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Space size="large" style={{ display: "flex", flexWrap: "wrap" }}>
            <Form.Item name="username" label="登录名" rules={[{ required: true, message: "3-50 位字母数字下划线" }]} style={{ flex: 1, minWidth: 180 }}>
              <Input placeholder="登录名" disabled={!!editing} maxLength={50} />
            </Form.Item>
            {!editing && (
              <Form.Item name="password" label="初始密码" rules={[{ required: true, message: "至少 6 位" }]} style={{ flex: 1, minWidth: 180 }}>
                <Input.Password placeholder="至少 6 位" />
              </Form.Item>
            )}
          </Space>
          <Space size="large" style={{ display: "flex", flexWrap: "wrap" }}>
            <Form.Item name="real_name" label="姓名" style={{ flex: 1, minWidth: 160 }}>
              <Input maxLength={50} />
            </Form.Item>
            <Form.Item name="nickname" label="昵称" style={{ flex: 1, minWidth: 160 }}>
              <Input maxLength={50} />
            </Form.Item>
          </Space>
          <Space size="large" style={{ display: "flex", flexWrap: "wrap" }}>
            <Form.Item name="phone" label="手机号" style={{ flex: 1, minWidth: 160 }}>
              <Input maxLength={20} />
            </Form.Item>
            <Form.Item name="email" label="邮箱" style={{ flex: 1, minWidth: 160 }}>
              <Input maxLength={100} />
            </Form.Item>
            <Form.Item name="gender" label="性别" style={{ minWidth: 120 }}>
              <Select options={GENDERS} />
            </Form.Item>
          </Space>
          <Form.Item name="post" label="职位">
            <Input maxLength={64} />
          </Form.Item>
          <Space size="large" style={{ display: "flex", flexWrap: "wrap" }}>
            <Form.Item name="dept_id" label="部门" style={{ flex: 1, minWidth: 180 }}>
              <Select placeholder="选择部门" allowClear options={deptOptions} />
            </Form.Item>
            <Form.Item name="role_id" label="角色" rules={[{ required: true, message: "请选择角色" }]} style={{ flex: 1, minWidth: 180 }}>
              <Select placeholder="选择角色" options={roleOptions} />
            </Form.Item>
            <Form.Item name="is_activate" label="启用" valuePropName="checked" style={{ minWidth: 100 }}>
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      <Modal
        title="重置密码"
        open={resetOpen}
        onOk={handleReset}
        onCancel={() => setResetOpen(false)}
        okText="确认重置"
        cancelText="取消"
      >
        <Form form={resetForm} layout="vertical">
          <Form.Item
            name="new_password"
            label="新密码"
            rules={[
              { required: true, message: "请输入新密码" },
              { min: 6, message: "至少 6 位" },
            ]}
          >
            <Input.Password placeholder="至少 6 位" />
          </Form.Item>
          <Typography.Paragraph type="secondary">
            重置后该账号下次登录需修改密码。
          </Typography.Paragraph>
        </Form>
      </Modal>
    </div>
  );
}
