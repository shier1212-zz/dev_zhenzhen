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
  Image,
  Typography,
  Popconfirm,
  message,
} from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { productApi, categoryApi } from "../api";
import { hasPerm } from "../store/auth";
import ImageUpload from "../components/ImageUpload";
import MultiImageUpload from "../components/MultiImageUpload";
import RichTextEditor from "../components/RichTextEditor";

export default function ProductManage() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [catId, setCatId] = useState(null);
  const [status, setStatus] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

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
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ show_price: 1, status: 1, sort: 0, images: [], params: [] });
    setModalOpen(true);
  };

  const openEdit = async (row) => {
    const d = await productApi.get(row.id);
    setEditing(row);
    form.setFieldsValue(d);
    setModalOpen(true);
  };

  const handleOk = async () => {
    const v = await form.validateFields();
    if (editing) {
      await productApi.update(editing.id, v);
      message.success("修改成功");
    } else {
      await productApi.create(v);
      message.success("新增成功");
    }
    setModalOpen(false);
    load();
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

      <Modal
        title={editing ? "编辑产品" : "新增产品"}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
        width={840}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Space size="large" style={{ display: "flex", flexWrap: "wrap" }}>
            <Form.Item name="category_id" label="所属分类" rules={[{ required: true, message: "请选择分类" }]} style={{ flex: 1, minWidth: 200 }}>
              <Select placeholder="选择分类" options={catOptions} />
            </Form.Item>
            <Form.Item name="name" label="产品名称" rules={[{ required: true, message: "请输入名称" }]} style={{ flex: 1, minWidth: 200 }}>
              <Input placeholder="产品名称" maxLength={100} />
            </Form.Item>
          </Space>
          <Form.Item name="cover_image" label="封面图" rules={[{ required: true, message: "请上传封面" }]}>
            <ImageUpload width={200} height={120} />
          </Form.Item>
          <Form.Item name="images" label="产品图集">
            <MultiImageUpload maxCount={8} />
          </Form.Item>
          <Space size="large" style={{ display: "flex", flexWrap: "wrap" }}>
            <Form.Item name="price_min" label="价格下限" style={{ flex: 1, minWidth: 160 }}>
              <InputNumber min={0} style={{ width: "100%" }} placeholder="0 表示面议" />
            </Form.Item>
            <Form.Item name="price_max" label="价格上限" style={{ flex: 1, minWidth: 160 }}>
              <InputNumber min={0} style={{ width: "100%" }} placeholder="可选" />
            </Form.Item>
            <Form.Item name="show_price" label="显示价格" valuePropName="checked" style={{ minWidth: 120 }}>
              <Switch />
            </Form.Item>
            <Form.Item name="status" label="上架" valuePropName="checked" style={{ minWidth: 120 }}>
              <Switch />
            </Form.Item>
            <Form.Item name="sort" label="排序" style={{ minWidth: 120 }}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Space>
          <Form.Item name="brief" label="简介">
            <Input.TextArea rows={2} maxLength={200} placeholder="产品一句话简介" />
          </Form.Item>
          <Typography.Paragraph type="secondary">规格参数</Typography.Paragraph>
          <Form.List name="params">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Space key={key} align="baseline" style={{ display: "flex", marginBottom: 8 }}>
                    <Form.Item {...rest} name={[name, "key"]} label="参数名" style={{ marginBottom: 0 }}>
                      <Input placeholder="如：尺寸" style={{ width: 160 }} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "value"]} label="参数值" style={{ marginBottom: 0 }}>
                      <Input placeholder="如：120×60cm" style={{ width: 240 }} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add({ key: "", value: "" })} block icon={<PlusOutlined />}>
                    添加参数
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
          <Form.Item name="detail_content" label="详情（富文本）">
            <RichTextEditor height={300} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
