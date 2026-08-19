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
  Image,
  Typography,
  Popconfirm,
  message,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { bannerApi } from "../api";
import { hasPerm } from "../store/auth";
import ImageUpload from "../components/ImageUpload";

const LINK_TYPES = [
  { value: "none", label: "无跳转" },
  { value: "product", label: "产品详情" },
  { value: "news", label: "新闻详情" },
  { value: "url", label: "外部链接" },
];

export default function BannerManage() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [isActivate, setIsActivate] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

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
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ link_type: "none", sort: 0, is_activate: 1 });
    setModalOpen(true);
  };

  const openEdit = async (row) => {
    const d = await bannerApi.get(row.id);
    setEditing(row);
    form.setFieldsValue(d);
    setModalOpen(true);
  };

  const handleOk = async () => {
    const v = await form.validateFields();
    if (editing) {
      await bannerApi.update(editing.id, v);
      message.success("修改成功");
    } else {
      await bannerApi.create(v);
      message.success("新增成功");
    }
    setModalOpen(false);
    load();
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

      <Modal
        title={editing ? "编辑轮播" : "新增轮播"}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="image_url" label="轮播图片" rules={[{ required: true, message: "请上传图片" }]}>
            <ImageUpload width={240} height={120} />
          </Form.Item>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: "请输入标题" }]}>
            <Input placeholder="轮播标题" maxLength={50} />
          </Form.Item>
          <Form.Item name="subtitle" label="副标题">
            <Input placeholder="可选" maxLength={100} />
          </Form.Item>
          <Form.Item name="link_type" label="跳转类型" rules={[{ required: true }]}>
            <Select options={LINK_TYPES} />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(p, c) => p.link_type !== c.link_type}
          >
            {({ getFieldValue }) =>
              getFieldValue("link_type") === "url" ? (
                <Form.Item
                  name="link_target"
                  label="链接地址"
                  rules={[{ required: true, message: "请输入链接" }]}
                >
                  <Input placeholder="https://..." />
                </Form.Item>
              ) : getFieldValue("link_type") === "product" || getFieldValue("link_type") === "news" ? (
                <Form.Item
                  name="link_target"
                  label="目标 ID"
                  rules={[{ required: true, message: "请输入目标 ID" }]}
                >
                  <InputNumber style={{ width: "100%" }} placeholder="对应产品/新闻 ID" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item name="sort" label="排序" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
