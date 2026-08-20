import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Popconfirm,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { roleApi } from "../api";
import { hasPerm } from "../store/auth";

export default function RoleManage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

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
    navigate("/role/new");
  };

  const openEdit = (row) => {
    navigate(`/role/${row.id}/edit`);
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
    </div>
  );
}
