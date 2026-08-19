import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Table,
  Typography,
  Button,
  message,
  Spin,
  Select,
  Modal,
  Space,
  Image,
  InputNumber,
  Popconfirm,
} from "antd";
import { homeApi, productApi, categoryApi } from "../api";

function formatPrice(row) {
  if (!row || row.show_price === 0) return "面议";
  const min = row.price_min ?? "";
  const max = row.price_max ?? "";
  if (min === "" && max === "") return "面议";
  if (max !== "" && min !== max) return `¥${min} ~ ${max} 起`;
  return `¥${min} 起`;
}

export default function HomeFeatured() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [targetKeys, setTargetKeys] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalCatId, setModalCatId] = useState(null);
  const [modalSelected, setModalSelected] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [all, feat, cats] = await Promise.all([
          productApi.list({ page: 1, page_size: 200 }),
          homeApi.getFeatured(),
          categoryApi.list({ page: 1, page_size: 200 }),
        ]);
        const catMap = new Map((cats.items || []).map((c) => [c.id, c.name]));
        setProducts(
          (all.items || []).map((p) => ({
            ...p,
            key: String(p.id),
            category_name: p.category_name || catMap.get(p.category_id) || "-",
          }))
        );
        setCategories(cats.items || []);
        setTargetKeys((feat.items || []).map((it) => String(it.product_id)));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const productMap = useMemo(
    () => new Map(products.map((p) => [String(p.id), p])),
    [products]
  );

  const selectedRows = useMemo(
    () =>
      targetKeys
        .map((id) => productMap.get(id))
        .filter(Boolean)
        .map((row, idx) => ({ ...row, sort: idx + 1 })),
    [targetKeys, productMap]
  );

  const moveTo = (id, newSort) => {
    const max = targetKeys.length;
    const next = Math.max(1, Math.min(Number(newSort) || 1, max));
    const oldIndex = targetKeys.indexOf(id);
    if (oldIndex === -1) return;
    const arr = [...targetKeys];
    arr.splice(oldIndex, 1);
    arr.splice(next - 1, 0, id);
    setTargetKeys(arr);
  };

  const removeSelected = (id) => {
    setTargetKeys((prev) => prev.filter((k) => k !== id));
  };

  const restoreDefault = () => {
    const latest = [...products]
      .filter((p) => p.status === 1 && p.is_activate === 1)
      .sort((a, b) => b.id - a.id)
      .slice(0, 4)
      .map((p) => String(p.id));
    setTargetKeys(latest);
    message.success("已恢复为最新 4 个产品");
  };

  const onSave = async () => {
    if (targetKeys.length === 0) {
      message.warning("请至少选择一个产品");
      return;
    }
    if (targetKeys.length > 8) {
      message.warning("精选产品最多 8 个");
      return;
    }
    setSaving(true);
    try {
      await homeApi.updateFeatured(targetKeys.map(Number));
      message.success("精选配置已更新");
    } finally {
      setSaving(false);
    }
  };

  const openModal = () => {
    setModalCatId(null);
    setModalSelected([]);
    setModalOpen(true);
  };

  const addSelected = () => {
    const next = [...targetKeys];
    let added = 0;
    modalSelected.forEach((id) => {
      if (!next.includes(id)) {
        if (next.length >= 8) return;
        next.push(id);
        added++;
      }
    });
    if (added === 0) {
      message.info("没有可添加的新产品（已达上限或已存在）");
      return;
    }
    setTargetKeys(next);
    setModalOpen(false);
    message.success(`已添加 ${added} 个产品`);
  };

  const catOptions = categories.map((c) => ({ label: c.name, value: c.id }));

  const selectedColumns = [
    {
      title: "排序",
      dataIndex: "sort",
      width: 90,
      render: (_, row) => (
        <InputNumber
          min={1}
          max={targetKeys.length}
          value={row.sort}
          style={{ width: 60 }}
          onChange={(v) => moveTo(String(row.id), v)}
        />
      ),
    },
    {
      title: "产品",
      render: (_, row) => (
        <Space>
          <Image
            src={row.cover_image}
            width={64}
            height={40}
            style={{ objectFit: "cover", borderRadius: 4 }}
            preview={false}
          />
          <Typography.Text>{row.name}</Typography.Text>
        </Space>
      ),
    },
    {
      title: "分类",
      dataIndex: "category_name",
      width: 140,
    },
    {
      title: "价格",
      width: 140,
      render: (_, row) => formatPrice(row),
    },
    {
      title: "操作",
      width: 100,
      render: (_, row) => (
        <Button type="link" danger size="small" onClick={() => removeSelected(String(row.id))}>
          移除
        </Button>
      ),
    },
  ];

  const modalPool = useMemo(() => {
    const selectedSet = new Set(targetKeys);
    return products.filter((p) => {
      if (selectedSet.has(String(p.id))) return false;
      if (!modalCatId) return true;
      return p.category_id === modalCatId;
    });
  }, [products, targetKeys, modalCatId]);

  const poolColumns = [
    {
      title: "封面",
      dataIndex: "cover_image",
      width: 90,
      render: (v) => (
        <Image
          src={v}
          width={64}
          height={40}
          style={{ objectFit: "cover", borderRadius: 4 }}
          preview={false}
        />
      ),
    },
    { title: "名称", dataIndex: "name" },
    { title: "分类", dataIndex: "category_name", width: 130 },
    {
      title: "价格",
      width: 130,
      render: (_, row) => formatPrice(row),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>首页精选产品配置</Typography.Title>
      <Card>
        <Spin spinning={loading}>
          <Typography.Paragraph type="secondary">
            从产品列表中选择 1~8 个加入首页精选（可排序），未配置时将自动取最新上架 4 个兜底。
          </Typography.Paragraph>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <Typography.Text strong>已选 {targetKeys.length} / 8 个</Typography.Text>
            <Space>
              <Popconfirm
                title="恢复默认"
                description="确定将精选产品恢复为最新上架的 4 个产品吗？"
                onConfirm={restoreDefault}
              >
                <Button>恢复默认（最新 4 个）</Button>
              </Popconfirm>
              <Button type="primary" loading={saving} onClick={onSave}>
                保存配置
              </Button>
            </Space>
          </div>

          <Table
            rowKey="id"
            columns={selectedColumns}
            dataSource={selectedRows}
            pagination={false}
            size="small"
            bordered
            locale={{ emptyText: "暂无精选产品，点击下方按钮添加" }}
          />

          <div style={{ marginTop: 16 }}>
            <Button type="primary" onClick={openModal} disabled={targetKeys.length >= 8}>
              + 添加精选产品
            </Button>
          </div>
        </Spin>
      </Card>

      <Modal
        title="添加精选产品"
        open={modalOpen}
        width={720}
        onOk={addSelected}
        onCancel={() => setModalOpen(false)}
        okText="确定添加"
        cancelText="取消"
        okButtonProps={{ disabled: modalSelected.length === 0 || targetKeys.length >= 8 }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <Typography.Text type="secondary" style={{ marginRight: 8 }}>
              产品分类：
            </Typography.Text>
            <Select
              placeholder="请选择产品分类"
              allowClear
              style={{ width: 240 }}
              value={modalCatId}
              onChange={setModalCatId}
              options={catOptions}
            />
          </div>
          <Typography.Text type="secondary">
            共 {modalPool.length} 个产品，已选 {modalSelected.length} 个
            {targetKeys.length >= 8 && (
              <span style={{ color: "#ff4d4f", marginLeft: 12 }}>精选产品已达上限 8 个</span>
            )}
          </Typography.Text>
          <Table
            rowKey="id"
            columns={poolColumns}
            dataSource={modalPool}
            size="small"
            pagination={{ pageSize: 10, simple: true }}
            rowSelection={{
              selectedRowKeys: modalSelected,
              onChange: (keys) => setModalSelected(keys.map(String)),
              getCheckboxProps: () => ({
                disabled: targetKeys.length >= 8,
              }),
            }}
          />
        </Space>
      </Modal>
    </div>
  );
}
