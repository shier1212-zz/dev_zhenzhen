import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Tag,
  Modal,
  Form,
  Typography,
  Popconfirm,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { userApi } from "../api";
import { hasPerm } from "../store/auth";

export default function UserManage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");

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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const openCreate = () => {
    navigate("/user/new");
  };

  const openEdit = (row) => {
    navigate(`/user/${row.id}/edit`);
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
