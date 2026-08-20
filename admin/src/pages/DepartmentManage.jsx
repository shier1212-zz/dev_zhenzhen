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
import { departmentApi } from "../api";
import { hasPerm } from "../store/auth";

export default function DepartmentManage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const canEdit = hasPerm("dept", "edit");

  const load = async () => {
    setLoading(true);
    try {
      const res = await departmentApi.list();
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
    navigate("/department/new");
  };

  const openEdit = (row) => {
    navigate(`/department/${row.id}/edit`);
  };

  const handleDelete = async (row) => {
    try {
      await departmentApi.remove(row.id);
      message.success("删除成功");
      load();
    } catch (e) {}
  };

  const columns = [
    { title: "部门名称", dataIndex: "name" },
    { title: "部门编码", dataIndex: "code", render: (v) => v || "-" },
    { title: "排序", dataIndex: "sort", width: 80 },
    {
      title: "状态",
      dataIndex: "is_activate",
      width: 90,
      render: (v) => <Tag color={v ? "green" : "default"}>{v ? "启用" : "停用"}</Tag>,
    },
    {
      title: "操作",
      width: 140,
      render: (_, row) => (
        <Space>
          {canEdit && <Button size="small" onClick={() => openEdit(row)}>编辑</Button>}
          {canEdit && (
            <Popconfirm
              title="确认删除该部门？（存在下级或账号将失败）"
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
      <Typography.Title level={4}>部门管理</Typography.Title>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          {canEdit && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增部门
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
