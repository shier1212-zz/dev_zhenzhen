import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  TreeSelect,
  Typography,
  Popconfirm,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { departmentApi } from "../api";
import { hasPerm } from "../store/auth";

function toTreeData(items, excludeId) {
  return (items || [])
    .filter((d) => d.id !== excludeId)
    .map((d) => ({
      value: d.id,
      title: d.name,
      children: toTreeData(d.children, excludeId),
    }));
}

export default function DepartmentManage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

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
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ sort: 0 });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    form.setFieldsValue({ ...row, parent_id: row.parent_id || undefined });
    setModalOpen(true);
  };

  const handleOk = async () => {
    const v = await form.validateFields();
    if (editing) {
      await departmentApi.update(editing.id, v);
      message.success("修改成功");
    } else {
      await departmentApi.create(v);
      message.success("新增成功");
    }
    setModalOpen(false);
    load();
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

      <Modal
        title={editing ? "编辑部门" : "新增部门"}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="部门名称" rules={[{ required: true, message: "请输入部门名称" }]}>
            <Input placeholder="部门名称" maxLength={50} />
          </Form.Item>
          <Form.Item name="parent_id" label="上级部门">
            <TreeSelect
              treeData={toTreeData(data, editing?.id)}
              placeholder="不选择则为顶级部门"
              allowClear
              treeDefaultExpandAll
            />
          </Form.Item>
          <Form.Item name="code" label="部门编码">
            <Input placeholder="如 HQ / MKT（唯一）" maxLength={50} />
          </Form.Item>
          <Form.Item name="sort" label="排序" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
