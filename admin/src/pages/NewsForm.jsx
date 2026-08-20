import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Button,
  Form,
  Input,
  Select,
  Space,
  Typography,
  Row,
  Col,
  message,
  ConfigProvider,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { newsApi } from "../api";
import ImageUpload from "../components/ImageUpload";
import RichTextEditor from "../components/RichTextEditor";

export default function NewsForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) {
      form.setFieldsValue({ status: 0 });
      return;
    }
    newsApi
      .get(id)
      .then((d) => form.setFieldsValue(d))
      .catch((e) => message.error(e.message || "加载新闻失败"))
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
        await newsApi.update(id, v);
        message.success("修改成功");
      } else {
        await newsApi.create(v);
        message.success("新增成功");
      }
      navigate("/news");
    } catch (e) {
      message.error(e.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <style>{`
        .news-form-compact .ant-form-item { margin-bottom: 8px; }
        .news-form-compact .ant-form-item-label { padding-bottom: 2px; }
      `}</style>
      <Space align="center" style={{ marginBottom: 8, flexWrap: "wrap" }}>
        <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => navigate("/news")}>
          返回列表
        </Button>
        <Typography.Title level={5} style={{ margin: 0 }}>
          {isEdit ? "编辑新闻" : "新增新闻"}
        </Typography.Title>
      </Space>

      <Card loading={loading} styles={{ body: { padding: 16 } }}>
        <ConfigProvider componentSize="small">
          <div className="news-form-compact">
            <Form form={form} layout="vertical" requiredMark>
              {/* 行 1：值少，一行两个 —— 标题 + 分类 */}
              <Row gutter={12}>
                <Col xs={24} sm={24} lg={16}>
                  <Form.Item
                    name="title"
                    label="标题"
                    rules={[{ required: true, message: "请输入标题" }]}
                  >
                    <Input placeholder="新闻标题" maxLength={100} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24} lg={8}>
                  <Form.Item name="category" label="分类">
                    <Input placeholder="如：公司动态" maxLength={50} />
                  </Form.Item>
                </Col>
              </Row>
              {/* 行 2：值少，一行两个 —— 封面图 + 状态 */}
              <Row gutter={12}>
                <Col xs={24} sm={24} lg={12}>
                  <Form.Item name="cover_image" label="封面图">
                    <ImageUpload width={128} height={80} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24} lg={12}>
                  <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                    <Select
                      options={[
                        { value: 0, label: "草稿" },
                        { value: 1, label: "发布" },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
              {/* 行 3：内容多，整行 —— 摘要 */}
              <Form.Item name="summary" label="摘要">
                <Input.TextArea rows={2} maxLength={200} placeholder="列表摘要（可选）" />
              </Form.Item>
              {/* 行 4：内容多，整行 —— 正文富文本 */}
              <Form.Item name="content" label="正文">
                <RichTextEditor height={240} />
              </Form.Item>
            </Form>
            <Space>
              <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
                保存
              </Button>
              <Button onClick={() => navigate("/news")}>取消</Button>
            </Space>
          </div>
        </ConfigProvider>
      </Card>
    </div>
  );
}
