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
import { productApi, categoryApi } from "../api";
import { hasPerm } from "../store/auth";

export default function ProductManage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [catId, setCatId] = useState(null);
  const [status, setStatus] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState([]);

  const canEdit = hasPerm("product", "edit");

  const load = async () => {
    setLoading(true);
    try {
      const res = await productApi.list({
        page,
        page_size: 10,
        keyword: keyword || undefined,
        category_id: catId,
        status,
      });
      setData(res.items || []);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    categoryApi.list({}).then((r) => setCategories(r.items || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, catId, status]);

  const openCreate = () => {
    navigate("/product/new");
  };

  const openEdit = (row) => {
    navigate(`/product/${row.id}/edit`);
  };

  const toggleStatus = async (row) => {
    await productApi.setStatus(row.id, row.status ? 0 : 1);
    message.success("状态已更新");
    load();
  };

  const handleDelete = async (row) => {
    await productApi.remove(row.id);
    message.success("删除成功");
    load();
  };

  const batch = async (target) => {
    await productApi.batchStatus(selected, target);
    message.success(`已${target ? "上架" : "下架"} ${selected.length} 个产品`);
    setSelected([]);
    load();
  };

  const catOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  const columns = [
    {
      title: "封面",
      dataIndex: "cover_image",
      width: 100,
      render: (v) => <Image src={v} width={72} height={48} style={{ objectFit: "cover" }} />,
    },
    { title: "名称", dataIndex: "name" },
    { title: "分类", dataIndex: "category_name", width: 110 },
    {
      title: "价格",
      width: 150,
      render: (_, row) =>
        row.show_price ? (
          row.price_max ? `¥${row.price_min} ~ ${row.price_max}` : `¥${row.price_min}`
        ) : (
          <Typography.Text type="secondary">面议</Typography.Text>
        ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      render: (v) => <Tag color={v ? "green" : "default"}>{v ? "上架" : "下架"}</Tag>,
    },
    { title: "排序", dataIndex: "sort", width: 70 },
    {
      title: "操作",
      width: 180,
      render: (_, row) => (
        <Space>
          {canEdit && <Button size="small" onClick={() => openEdit(row)}>编辑</Button>}
          {canEdit && (
            <Button size="small" onClick={() => toggleStatus(row)}>
              {row.status ? "下架" : "上架"}
            </Button>
          )}
          {canEdit && (
            <Popconfirm title="确认删除该产品？" onConfirm={() => handleDelete(row)}>
              <Button size="small" danger>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const rowSelection = canEdit
    ? {
        selectedRowKeys: selected,
        onChange: setSelected,
      }
    : undefined;

  return (
    <div>
      <Typography.Title level={4}>产品管理</Typography.Title>
      <Card>
        <Space style={{ marginBottom: 16, flexWrap: "wrap" }}>
          <Input.Search
            placeholder="产品名称搜索"
            allowClear
            onSearch={(v) => {
              setKeyword(v);
              setPage(1);
              setTimeout(load, 0);
            }}
            style={{ width: 200 }}
          />
          <Select
            placeholder="分类"
            allowClear
            style={{ width: 140 }}
            value={catId}
            onChange={(v) => setCatId(v)}
            options={catOptions}
          />
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 120 }}
            value={status}
            onChange={setStatus}
            options={[
              { value: 1, label: "上架" },
              { value: 0, label: "下架" },
            ]}
          />
          {canEdit && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增产品
            </Button>
          )}
          {canEdit && selected.length > 0 && (
            <>
              <Button onClick={() => batch(1)}>批量上架</Button>
              <Button onClick={() => batch(0)}>批量下架</Button>
              <Typography.Text type="secondary">已选 {selected.length}</Typography.Text>
            </>
          )}
        </Space>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          rowSelection={rowSelection}
          pagination={{ current: page, total, pageSize: 10, onChange: setPage }}
        />
      </Card>
    </div>
  );
}
