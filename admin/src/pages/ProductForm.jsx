import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Button,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Space,
  Typography,
  Row,
  Col,
  message,
  ConfigProvider,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import { productApi, categoryApi } from "../api";
import ImageUpload from "../components/ImageUpload";
import MultiImageUpload from "../components/MultiImageUpload";
import RichTextEditor from "../components/RichTextEditor";

/**
 * 产品「新增 / 编辑」独立页面（替代弹窗）。
 *
 * 布局说明（Row/Col 栅格，随屏幕宽度自适应）：
 * - 值少的控件：一行放多个（所属分类 + 产品名称；价格组 5 项一行；封面图 + 简介）
 * - 值内容多的控件：占一整行（产品图集、规格参数、富文本详情）
 *
 * 紧凑化：控件小尺寸（ConfigProvider size=small）、图集 80px、富文本 220px、
 * 表单项间距收紧，尽量在首屏一屏内展示，减少滚动条。
 */
export default function ProductForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    categoryApi.list({}).then((r) => setCategories(r.items || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) {
      form.setFieldsValue({
        show_price: true,
        status: true,
        sort: 0,
        images: [],
        params: [],
      });
      return;
    }
    productApi
      .get(id)
      .then((d) => {
        form.setFieldsValue({
          ...d,
          show_price: !!d.show_price,
          status: !!d.status,
        });
      })
      .catch((e) => message.error(e.message || "加载产品失败"))
      .finally(() => setLoading(false));
  }, [id, isEdit, form]);

  const handleSave = async () => {
    let v;
    try {
      v = await form.validateFields();
    } catch (e) {
      return; // 校验失败，antd 已高亮错误项
    }
    setSaving(true);
    try {
      if (isEdit) {
        await productApi.update(id, v);
        message.success("修改成功");
      } else {
        await productApi.create(v);
        message.success("新增成功");
      }
      navigate("/product");
    } catch (e) {
      message.error(e.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const catOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  return (
    <div>
      {/* 紧凑化覆盖样式：图集缩到 80px、表单项间距收紧 */}
      <style>{`
        .product-form-compact .ant-form-item { margin-bottom: 8px; }
        .product-form-compact .ant-form-item-label { padding-bottom: 2px; }
        .product-form-compact .ant-upload-list-picture-card-container,
        .product-form-compact .ant-upload.ant-upload-select-picture-card {
          width: 80px; height: 80px;
        }
        .product-form-compact .ant-upload-list-picture-card .ant-upload-list-item {
          width: 80px; height: 80px;
        }
      `}</style>

      <Space align="center" style={{ marginBottom: 8, flexWrap: "wrap" }}>
        <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => navigate("/product")}>
          返回列表
        </Button>
        <Typography.Title level={5} style={{ margin: 0 }}>
          {isEdit ? "编辑产品" : "新增产品"}
        </Typography.Title>
      </Space>

      <Card loading={loading} styles={{ body: { padding: 16 } }}>
        <ConfigProvider componentSize="small">
          <div className="product-form-compact">
            <Form form={form} layout="vertical" requiredMark>
              {/* 行 1：值少，一行两个 —— 所属分类 + 产品名称 */}
              <Row gutter={12}>
                <Col xs={24} sm={12} lg={8}>
                  <Form.Item
                    name="category_id"
                    label="所属分类"
                    rules={[{ required: true, message: "请选择分类" }]}
                  >
                    <Select placeholder="选择分类" options={catOptions} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={16}>
                  <Form.Item
                    name="name"
                    label="产品名称"
                    rules={[{ required: true, message: "请输入名称" }]}
                  >
                    <Input placeholder="产品名称" maxLength={100} />
                  </Form.Item>
                </Col>
              </Row>

              {/* 行 2：值少，一行五个 —— 价格下限 / 价格上限 / 显示价格 / 上架 / 排序 */}
              <Row gutter={12}>
                <Col xs={12} sm={12} lg={6}>
                  <Form.Item name="price_min" label="价格下限">
                    <InputNumber min={0} style={{ width: "100%" }} placeholder="0 表示面议" />
                  </Form.Item>
                </Col>
                <Col xs={12} sm={12} lg={6}>
                  <Form.Item name="price_max" label="价格上限">
                    <InputNumber min={0} style={{ width: "100%" }} placeholder="可选" />
                  </Form.Item>
                </Col>
                <Col xs={8} sm={8} lg={4}>
                  <Form.Item name="show_price" label="显示价格" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={8} sm={8} lg={4}>
                  <Form.Item name="status" label="上架" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={8} sm={8} lg={4}>
                  <Form.Item name="sort" label="排序">
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>

              {/* 行 3：中等控件，一行两个 —— 封面图 + 简介 */}
              <Row gutter={12}>
                <Col xs={24} sm={24} lg={8}>
                  <Form.Item
                    name="cover_image"
                    label="封面图"
                    rules={[{ required: true, message: "请上传封面" }]}
                  >
                    <ImageUpload width={128} height={80} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24} lg={16}>
                  <Form.Item name="brief" label="简介">
                    <Input.TextArea
                      rows={2}
                      maxLength={200}
                      placeholder="产品一句话简介（值内容较多，占一行）"
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* 行 4：内容多，整行 —— 产品图集 */}
              <Form.Item name="images" label="产品图集">
                <MultiImageUpload maxCount={8} />
              </Form.Item>

              {/* 行 5：内容多，整行 —— 规格参数（动态列表） */}
              <Form.Item label="规格参数" style={{ marginBottom: 0 }}>
                <Form.List name="params">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...rest }) => (
                        <Row key={key} gutter={12} align="middle" style={{ marginBottom: 4 }}>
                          <Col xs={24} sm={11}>
                            <Form.Item
                              {...rest}
                              name={[name, "key"]}
                              rules={[{ required: true, message: "请输入参数名" }]}
                              style={{ marginBottom: 0 }}
                            >
                              <Input placeholder="参数名，如：尺寸" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={11}>
                            <Form.Item
                              {...rest}
                              name={[name, "value"]}
                              rules={[{ required: true, message: "请输入参数值" }]}
                              style={{ marginBottom: 0 }}
                            >
                              <Input placeholder="参数值，如：120×60cm" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={2} style={{ textAlign: "center" }}>
                            <Button
                              type="text"
                              danger
                              icon={<MinusCircleOutlined />}
                              onClick={() => remove(name)}
                            />
                          </Col>
                        </Row>
                      ))}
                      <Button
                        type="dashed"
                        onClick={() => add({ key: "", value: "" })}
                        block
                        icon={<PlusOutlined />}
                        style={{ marginTop: 4 }}
                      >
                        添加参数
                      </Button>
                    </>
                  )}
                </Form.List>
              </Form.Item>

              {/* 行 6：内容多，整行 —— 富文本详情 */}
              <Form.Item name="detail_content" label="详情（富文本）">
                <RichTextEditor height={200} />
              </Form.Item>
            </Form>

            <Space style={{ marginTop: 0 }}>
              <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
                保存
              </Button>
              <Button onClick={() => navigate("/product")}>取消</Button>
            </Space>
          </div>
        </ConfigProvider>
      </Card>
    </div>
  );
}
