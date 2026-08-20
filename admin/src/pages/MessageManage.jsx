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
  Radio,
  InputNumber,
  Typography,
  Popconfirm,
  message,
  Descriptions,
} from "antd";
import { messageApi } from "../api";
import { hasPerm } from "../store/auth";

// 数据库存 UTC（SQLite CURRENT_TIMESTAMP），统一转为北京时间（UTC+8）显示
function formatBeijing(v) {
  if (!v) return "-";
  const s = typeof v === "string" ? v.replace(" ", "T") : v;
  const hasTz = /[Z]|[+-]\d{2}:\d{2}$/.test(s);
  const d = new Date(hasTz ? s : s + "Z");
  if (isNaN(d.getTime())) return String(v);
  const b = new Date(d.getTime() + 8 * 3600 * 1000); // UTC → UTC+8
  const p = (n) => String(n).padStart(2, "0");
  return `${b.getUTCFullYear()}-${p(b.getUTCMonth() + 1)}-${p(b.getUTCDate())} ${p(
    b.getUTCHours()
  )}:${p(b.getUTCMinutes())}`;
}

export default function MessageManage() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [row, setRow] = useState(null);
  const [form] = Form.useForm();

  const canEdit = hasPerm("message", "edit");

  const load = async () => {
    setLoading(true);
    try {
      const res = await messageApi.list({
        page,
        page_size: 10,
        keyword: keyword || undefined,
        status,
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

  const openProcess = async (r) => {
    const d = await messageApi.get(r.id);
    setRow(d);
    form.setFieldsValue({ status: d.status, handle_note: d.handle_note || "" });
    setModalOpen(true);
  };

  const handleOk = async () => {
    const v = await form.validateFields();
    await messageApi.handle(row.id, v);
    message.success(v.status ? "已标记为已处理" : "已回退为待处理");
    setModalOpen(false);
    load();
  };

  const handleDelete = async (r) => {
    await messageApi.remove(r.id);
    message.success("删除成功");
    load();
  };

  const columns = [
    { title: "姓名", dataIndex: "name", width: 90 },
    { title: "电话", dataIndex: "phone", width: 130 },
    { title: "公司", dataIndex: "company", width: 140, render: (v) => v || "-" },
    {
      title: "留言内容",
      dataIndex: "content",
      render: (v) => (v && v.length > 50 ? v.slice(0, 50) + "…" : v),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (v) => <Tag color={v ? "green" : "orange"}>{v ? "已处理" : "待处理"}</Tag>,
    },
    {
      title: "接收时间",
      dataIndex: "created_date",
      width: 170,
      render: formatBeijing,
    },
    { title: "IP", dataIndex: "ip", width: 120, render: (v) => v || "-" },
    {
      title: "操作",
      width: 150,
      render: (_, r) => (
        <Space>
          {canEdit && <Button size="small" onClick={() => openProcess(r)}>处理</Button>}
          {canEdit && (
            <Popconfirm title="确认删除该留言？" onConfirm={() => handleDelete(r)}>
              <Button size="small" danger>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>留言管理</Typography.Title>
      <Card>
        <Space style={{ marginBottom: 16, flexWrap: "wrap" }}>
          <Input.Search
            placeholder="姓名/电话搜索"
            allowClear
            onSearch={(v) => {
              setKeyword(v);
              setPage(1);
              setTimeout(load, 0);
            }}
            style={{ width: 220 }}
          />
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 120 }}
            value={status}
            onChange={setStatus}
            options={[
              { value: 0, label: "待处理" },
              { value: 1, label: "已处理" },
            ]}
          />
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
        title="处理留言"
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        {row && (
          <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="姓名">{row.name}</Descriptions.Item>
            <Descriptions.Item label="电话">{row.phone}</Descriptions.Item>
            <Descriptions.Item label="公司">{row.company || "-"}</Descriptions.Item>
            <Descriptions.Item label="内容">{row.content}</Descriptions.Item>
          </Descriptions>
        )}
        <Form form={form} layout="vertical">
          <Form.Item name="status" label="处理状态" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value={0}>待处理</Radio>
              <Radio value={1}>已处理</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="handle_note" label="处理备注">
            <Input.TextArea rows={3} maxLength={500} placeholder="处理说明（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
