import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Image,
  Typography,
  Popconfirm,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { newsApi } from "../api";
import { hasPerm } from "../store/auth";

export default function NewsManage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState(null);

  const canEdit = hasPerm("news", "edit");

  const load = async () => {
    setLoading(true);
    try {
      const res = await newsApi.list({
        page,
        page_size: 10,
        keyword: keyword || undefined,
        status: status,
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
  }, [page, status]);

  const openCreate = () => {
    navigate("/news/new");
  };

  const openEdit = (row) => {
    navigate(`/news/${row.id}/edit`);
  };

  const handleDelete = async (row) => {
    await newsApi.remove(row.id);
    message.success("删除成功");
    load();
  };

  const columns = [
    {
      title: "封面",
      dataIndex: "cover_image",
      width: 110,
      render: (v) => (v ? <Image src={v} width={84} height={48} style={{ objectFit: "cover" }} /> : "-"),
    },
    { title: "标题", dataIndex: "title" },
    { title: "分类", dataIndex: "category", render: (v) => v || "-" },
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      render: (v) => <Tag color={v ? "green" : "default"}>{v ? "已发布" : "草稿"}</Tag>,
    },
    { title: "发布时间", dataIndex: "published_at", width: 160, render: (v) => v || "-" },
    {
      title: "操作",
      width: 140,
      render: (_, row) => (
        <Space>
          {canEdit && <Button size="small" onClick={() => openEdit(row)}>编辑</Button>}
          {canEdit && (
            <Popconfirm title="确认删除该新闻？" onConfirm={() => handleDelete(row)}>
              <Button size="small" danger>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>新闻管理</Typography.Title>
      <Card>
        <Space style={{ marginBottom: 16, flexWrap: "wrap" }}>
          <Input.Search
            placeholder="标题搜索"
            allowClear
            onSearch={(v) => {
              setKeyword(v);
              setPage(1);
              setTimeout(load, 0);
            }}
            style={{ width: 200 }}
          />
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 120 }}
            value={status}
            onChange={setStatus}
            options={[
              { value: 1, label: "已发布" },
              { value: 0, label: "草稿" },
            ]}
          />
          {canEdit && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增新闻
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
    </div>
  );
}
