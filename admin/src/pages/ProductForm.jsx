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
      <Space align="center" style={{ marginBottom: 16, flexWrap: "wrap" }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/product")}>
          返回列表
        </Button>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {isEdit ? "编辑产品" : "新增产品"}
        </Typography.Title>
      </Space>

      <Card loading={loading}>
        <Form form={form} layout="vertical" requiredMark>
          {/* 行 1：值少，一行两个 —— 所属分类 + 产品名称 */}
          <Row gutter={16}>
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
          <Row gutter={16}>
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
          <Row gutter={16}>
            <Col xs={24} sm={24} lg={8}>
              <Form.Item
                name="cover_image"
                label="封面图"
                rules={[{ required: true, message: "请上传封面" }]}
              >
                <ImageUpload width={200} height={120} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} lg={16}>
              <Form.Item name="brief" label="简介">
                <Input.TextArea
                  rows={3}
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
          <Form.Item label="规格参数" style={{ marginBottom: 8 }}>
            <Form.List name="params">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...rest }) => (
                    <Row key={key} gutter={16} align="middle" style={{ marginBottom: 8 }}>
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
                    style={{ marginTop: 8 }}
                  >
                    添加参数
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          {/* 行 6：内容多，整行 —— 富文本详情 */}
          <Form.Item name="detail_content" label="详情（富文本）">
            <RichTextEditor height={320} />
          </Form.Item>
        </Form>

        <Space style={{ marginTop: 8 }}>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
            保存
          </Button>
          <Button onClick={() => navigate("/product")}>取消</Button>
        </Space>
      </Card>
    </div>
  );
}
