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
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { bannerApi } from "../api";
import { hasPerm } from "../store/auth";

const LINK_TYPES = [
  { value: "none", label: "无跳转" },
  { value: "product", label: "产品详情" },
  { value: "news", label: "新闻详情" },
  { value: "url", label: "外部链接" },
];

export default function BannerManage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [isActivate, setIsActivate] = useState(null);

  const canEdit = hasPerm("banner", "edit");

  const load = async () => {
    setLoading(true);
    try {
      const res = await bannerApi.list({
        page,
        page_size: 10,
        keyword: keyword || undefined,
        is_activate: isActivate,
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
  }, [page, isActivate]);

  const openCreate = () => {
    navigate("/banner/new");
  };

  const openEdit = (row) => {
    navigate(`/banner/${row.id}/edit`);
  };

  const toggleStatus = async (row) => {
    await bannerApi.setStatus(row.id, row.is_activate ? 0 : 1);
    message.success("状态已更新");
    load();
  };

  const handleDelete = async (row) => {
    await bannerApi.remove(row.id);
    message.success("删除成功");
    load();
  };

  const columns = [
    {
      title: "图片",
      dataIndex: "image_url",
      width: 120,
      render: (v) => (
        <Image src={v} width={88} height={48} style={{ objectFit: "cover" }} />
      ),
    },
    { title: "标题", dataIndex: "title" },
    { title: "副标题", dataIndex: "subtitle", render: (v) => v || "-" },
    {
      title: "跳转类型",
      dataIndex: "link_type",
      render: (v) => LINK_TYPES.find((x) => x.value === v)?.label || v,
    },
    { title: "排序", dataIndex: "sort", width: 70 },
    {
      title: "状态",
      dataIndex: "is_activate",
      width: 90,
      render: (v) => (
        <Tag color={v ? "green" : "default"}>{v ? "启用" : "停用"}</Tag>
      ),
    },
    {
      title: "操作",
      width: 180,
      render: (_, row) => (
        <Space>
          {canEdit && <Button size="small" onClick={() => openEdit(row)}>编辑</Button>}
          {canEdit && (
            <Button size="small" onClick={() => toggleStatus(row)}>
              {row.is_activate ? "停用" : "启用"}
            </Button>
          )}
          {canEdit && (
            <Popconfirm title="确认删除该轮播？（软删除）" onConfirm={() => handleDelete(row)}>
              <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>轮播图管理</Typography.Title>
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
            value={isActivate}
            onChange={(v) => setIsActivate(v)}
            options={[
              { value: 1, label: "启用" },
              { value: 0, label: "停用" },
            ]}
          />
          {canEdit && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增轮播
            </Button>
          )}
        </Space>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={{
            current: page,
            total,
            pageSize: 10,
            onChange: setPage,
          }}
        />
      </Card>
    </div>
  );
}
