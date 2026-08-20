import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Button,
  Form,
  Input,
  Select,
  InputNumber,
  Space,
  Typography,
  Row,
  Col,
  message,
  ConfigProvider,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { bannerApi } from "../api";
import ImageUpload from "../components/ImageUpload";

const LINK_TYPES = [
  { value: "none", label: "无跳转" },
  { value: "product", label: "产品详情" },
  { value: "news", label: "新闻详情" },
  { value: "url", label: "外部链接" },
];

export default function BannerForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) {
      form.setFieldsValue({ link_type: "none", sort: 0 });
      return;
    }
    bannerApi
      .get(id)
      .then((d) => form.setFieldsValue(d))
      .catch((e) => message.error(e.message || "加载轮播失败"))
      .finally(() => setLoading(false));
  }, [id, isEdit, form]);

  const handleSave = async () => {
    let v;
    try {
      v = await form.validateFields();
    } catch (e) {
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await bannerApi.update(id, v);
        message.success("修改成功");
      } else {
        await bannerApi.create(v);
        message.success("新增成功");
      }
      navigate("/banner");
    } catch (e) {
      message.error(e.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <style>{`
        .banner-form-compact .ant-form-item { margin-bottom: 8px; }
        .banner-form-compact .ant-form-item-label { padding-bottom: 2px; }
      `}</style>
      <Space align="center" style={{ marginBottom: 8, flexWrap: "wrap" }}>
        <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => navigate("/banner")}>
          返回列表
        </Button>
        <Typography.Title level={5} style={{ margin: 0 }}>
          {isEdit ? "编辑轮播" : "新增轮播"}
        </Typography.Title>
      </Space>

      <Card loading={loading} styles={{ body: { padding: 16 } }}>
        <ConfigProvider componentSize="small">
          <div className="banner-form-compact">
            <Form form={form} layout="vertical" requiredMark>
              {/* 行 1：整行 —— 轮播图片 */}
              <Form.Item
                name="image_url"
                label="轮播图片"
                rules={[{ required: true, message: "请上传图片" }]}
              >
                <ImageUpload width={160} height={80} />
              </Form.Item>
              {/* 行 2：值少，一行两个 —— 标题 + 副标题 */}
              <Row gutter={12}>
                <Col xs={24} sm={12} lg={12}>
                  <Form.Item
                    name="title"
                    label="标题"
                    rules={[{ required: true, message: "请输入标题" }]}
                  >
                    <Input placeholder="轮播标题" maxLength={50} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={12}>
                  <Form.Item name="subtitle" label="副标题">
                    <Input placeholder="可选" maxLength={100} />
                  </Form.Item>
                </Col>
              </Row>
              {/* 行 3：值少，一行三个 —— 跳转类型 / 排序 / （占位） */}
              <Row gutter={12}>
                <Col xs={12} sm={12} lg={8}>
                  <Form.Item name="link_type" label="跳转类型" rules={[{ required: true }]}>
                    <Select options={LINK_TYPES} />
                  </Form.Item>
                </Col>
                <Col xs={12} sm={12} lg={8}>
                  <Form.Item name="sort" label="排序" rules={[{ required: true }]}>
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
              {/* 行 4：条件显示 —— 链接目标 */}
              <Form.Item noStyle shouldUpdate={(p, c) => p.link_type !== c.link_type}>
                {({ getFieldValue }) => {
                  const lt = getFieldValue("link_type");
                  if (lt === "url") {
                    return (
                      <Form.Item
                        name="link_target"
                        label="链接地址"
                        rules={[{ required: true, message: "请输入链接" }]}
                      >
                        <Input placeholder="https://..." />
                      </Form.Item>
                    );
                  }
                  if (lt === "product" || lt === "news") {
                    return (
                      <Form.Item
                        name="link_target"
                        label={lt === "product" ? "产品 ID" : "新闻 ID"}
                        rules={[{ required: true, message: "请输入目标 ID" }]}
                      >
                        <InputNumber style={{ width: "100%" }} placeholder="对应产品/新闻 ID" />
                      </Form.Item>
                    );
                  }
                  return null;
                }}
              </Form.Item>
            </Form>
            <Space>
              <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
                保存
              </Button>
              <Button onClick={() => navigate("/banner")}>取消</Button>
            </Space>
          </div>
        </ConfigProvider>
      </Card>
    </div>
  );
}
