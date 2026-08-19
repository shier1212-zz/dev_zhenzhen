import React, { useEffect, useState } from "react";
import { Card, Transfer, Typography, Button, message, Spin, Select } from "antd";
import { homeApi, productApi, categoryApi } from "../api";

export default function HomeFeatured() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  const [targetKeys, setTargetKeys] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [all, feat, cats] = await Promise.all([
          productApi.list({ page: 1, page_size: 200 }),
          homeApi.getFeatured(),
          categoryApi.list({ page: 1, page_size: 200 }),
        ]);
        setProducts(
          (all.items || []).map((p) => ({
            key: String(p.id),
            title: p.name,
            description: (p.brief || "").slice(0, 30),
            category_id: p.category_id,
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

  const targetKeySet = new Set(targetKeys);
  // 分类筛选只影响左侧候选池，但右侧「首页精选」必须始终完整保留
  const filteredProducts = products.filter((p) => {
    const selected = targetKeySet.has(p.key);
    if (selected) return true; // 已选中的始终保留在 dataSource 中，确保右侧不丢失
    if (!categoryId) return true; // 未选择分类：左侧显示全部未选产品
    return p.category_id === categoryId; // 选择分类：左侧仅显示该分类下未选产品
  });

  const onChange = (keys) => {
    if (keys.length > 8) {
      message.warning("精选产品最多 8 个");
      return;
    }
    setTargetKeys(keys);
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await homeApi.updateFeatured(targetKeys.map(Number));
      message.success("精选配置已更新");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Typography.Title level={4}>首页精选产品配置</Typography.Title>
      <Card>
        <Spin spinning={loading}>
          <Typography.Paragraph type="secondary">
            从左侧产品池选择 1~8 个作为首页精选，右侧顺序即为展示顺序。
            <br />
            通过「产品分类」可筛选左侧产品池；未选择分类时，产品池包含全部未选产品。
          </Typography.Paragraph>
          <div style={{ marginBottom: 16 }}>
            <Select
              placeholder="请选择产品分类"
              allowClear
              style={{ width: 240 }}
              value={categoryId}
              onChange={setCategoryId}
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
            />
            <Typography.Text type="secondary" style={{ marginLeft: 16 }}>
              共 {products.length} 个产品，已选 {targetKeys.length} 个
            </Typography.Text>
          </div>
          <Transfer
            dataSource={filteredProducts}
            titles={["产品池", "首页精选"]}
            targetKeys={targetKeys}
            onChange={onChange}
            render={(item) => item.title}
            listStyle={{ width: 280, height: 380 }}
          />
          <div style={{ marginTop: 16 }}>
            <Button type="primary" loading={saving} onClick={onSave} disabled={loading}>
              保存配置
            </Button>
          </div>
        </Spin>
      </Card>
    </div>
  );
}
