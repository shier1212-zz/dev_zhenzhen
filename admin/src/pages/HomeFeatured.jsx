import React, { useEffect, useState } from "react";
import { Card, Transfer, Typography, Button, message, Spin } from "antd";
import { homeApi, productApi } from "../api";

export default function HomeFeatured() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [targetKeys, setTargetKeys] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [all, feat] = await Promise.all([
          productApi.list({ page: 1, page_size: 200 }),
          homeApi.getFeatured(),
        ]);
        setProducts(
          (all.items || []).map((p) => ({
            key: String(p.id),
            title: p.name,
            description: (p.brief || "").slice(0, 30),
          }))
        );
        setTargetKeys((feat.items || []).map((it) => String(it.product_id)));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
          </Typography.Paragraph>
          <Transfer
            dataSource={products}
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
