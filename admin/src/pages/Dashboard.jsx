import React, { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, List, Tag, Typography, Spin, Empty } from "antd";
import {
  AppstoreOutlined,
  FileTextOutlined,
  MessageOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { productApi, newsApi, messageApi, userApi, logApi } from "../api";
import { hasPerm } from "../store/auth";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ product: 0, news: 0, message: 0, user: 0 });
  const [pendings, setPendings] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // 按权限矩阵拉取，无权限模块不请求，避免整页 403 失败
        const jobs = [];
        if (hasPerm("product", "view"))
          jobs.push(productApi.list({ page: 1, page_size: 1 }).then((r) => ["product", r.total]));
        if (hasPerm("news", "view"))
          jobs.push(newsApi.list({ page: 1, page_size: 1 }).then((r) => ["news", r.total]));
        if (hasPerm("message", "view"))
          jobs.push(
            messageApi
              .list({ page: 1, page_size: 1, status: 0 })
              .then((r) => ["message", r.total])
          );
        if (hasPerm("user", "view"))
          jobs.push(userApi.list({ page: 1, page_size: 1 }).then((r) => ["user", r.total]));
        if (hasPerm("message", "view"))
          jobs.push(
            messageApi
              .list({ page: 1, page_size: 5, status: 0 })
              .then((r) => setPendings(r.items || []))
          );
        if (hasPerm("log", "view"))
          jobs.push(logApi.list({ page: 1, page_size: 6 }).then((r) => setLogs(r.items || [])));

        const results = await Promise.all(jobs);
        const next = { product: 0, news: 0, message: 0, user: 0 };
        results.forEach(([k, v]) => {
          next[k] = v;
        });
        setStats(next);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = [
    { key: "product", title: "产品总数", value: stats.product, icon: <AppstoreOutlined />, color: "#0E9384" },
    { key: "news", title: "新闻总数", value: stats.news, icon: <FileTextOutlined />, color: "#1677ff" },
    { key: "message", title: "待处理留言", value: stats.message, icon: <MessageOutlined />, color: "#fa8c16" },
    { key: "user", title: "账号总数", value: stats.user, icon: <TeamOutlined />, color: "#722ed1" },
  ].filter((c) => hasPerm(c.key, "view") || (c.key === "message" && hasPerm("message", "view")));

  return (
    <div>
      <Typography.Title level={4}>工作台</Typography.Title>
      <Spin spinning={loading}>
        <Row gutter={16}>
          {cards.map((c) => (
            <Col xs={24} sm={12} md={6} key={c.key} style={{ marginBottom: 16 }}>
              <Card>
                <Statistic
                  title={c.title}
                  value={c.value}
                  prefix={<span style={{ color: c.color, marginRight: 8 }}>{c.icon}</span>}
                  valueStyle={{ color: c.color }}
                />
              </Card>
            </Col>
          ))}
        </Row>
        <Row gutter={16}>
          {hasPerm("message", "view") && (
            <Col xs={24} md={12} style={{ marginBottom: 16 }}>
              <Card title="待处理留言" extra={<Tag color="orange">{pendings.length}</Tag>}>
                {pendings.length ? (
                  <List
                    dataSource={pendings}
                    renderItem={(it) => (
                      <List.Item>
                        <List.Item.Meta
                          title={`${it.name} · ${it.phone}`}
                          description={
                            it.content.length > 40 ? it.content.slice(0, 40) + "…" : it.content
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="暂无待处理留言" />
                )}
              </Card>
            </Col>
          )}
          {hasPerm("log", "view") && (
            <Col xs={24} md={12}>
              <Card title="最近操作日志">
                {logs.length ? (
                  <List
                    dataSource={logs}
                    renderItem={(it) => (
                      <List.Item>
                        <List.Item.Meta
                          title={
                            <span>
                              {it.username} <Tag>{it.module}</Tag> {it.action}
                            </span>
                          }
                          description={it.created_date || "-"}
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="暂无操作日志" />
                )}
              </Card>
            </Col>
          )}
        </Row>
      </Spin>
    </div>
  );
}
