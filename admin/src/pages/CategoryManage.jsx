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
import { categoryApi } from "../api";
import { hasPerm } from "../store/auth";

export default function CategoryManage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const canEdit = hasPerm("product", "edit");

  const load = async () => {
    setLoading(true);
    try {
      const res = await categoryApi.list({});
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
    navigate("/category/new");
  };

  const openEdit = (row) => {
    navigate(`/category/${row.id}/edit`);
  };

  const handleDelete = async (row) => {
    try {
      await categoryApi.remove(row.id);
      message.success("删除成功");
      load();
    } catch (e) {
      // 409 由拦截器提示
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 70 },
    { title: "分类名称", dataIndex: "name" },
    { title: "排序", dataIndex: "sort", width: 80 },
    { title: "产品数", dataIndex: "product_count", width: 90, render: (v) => <Tag>{v}</Tag> },
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
              title={row.product_count > 0 ? "该分类下存在产品，请先移走再删除" : "确认删除该分类？"}
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
      <Typography.Title level={4}>产品分类管理</Typography.Title>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          {canEdit && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增分类
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
