import React, { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, List, Tag, Typography, Spin, Empty } from "antd";
import {
  AppstoreOutlined,
  FileTextOutlined,
  MessageOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { productApi, newsApi, messageApi, userApi, logApi } from "../api";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ product: 0, news: 0, message: 0, user: 0 });
  const [pendings, setPendings] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [p, n, m, u, mp, lp] = await Promise.all([
          productApi.list({ page: 1, page_size: 1 }),
          newsApi.list({ page: 1, page_size: 1 }),
          messageApi.list({ page: 1, page_size: 1, status: 0 }),
          userApi.list({ page: 1, page_size: 1 }),
          messageApi.list({ page: 1, page_size: 5, status: 0 }),
          logApi.list({ page: 1, page_size: 6 }),
        ]);
        setStats({
          product: p.total,
          news: n.total,
          message: m.total,
          user: u.total,
        });
        setPendings(mp.items || []);
        setLogs(lp.items || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = [
    { title: "产品总数", value: stats.product, icon: <AppstoreOutlined />, color: "#0E9384" },
    { title: "新闻总数", value: stats.news, icon: <FileTextOutlined />, color: "#1677ff" },
    { title: "待处理留言", value: stats.message, icon: <MessageOutlined />, color: "#fa8c16" },
    { title: "账号总数", value: stats.user, icon: <TeamOutlined />, color: "#722ed1" },
  ];

  return (
    <div>
      <Typography.Title level={4}>工作台</Typography.Title>
      <Spin spinning={loading}>
        <Row gutter={16}>
          {cards.map((c) => (
            <Col xs={24} sm={12} md={6} key={c.title} style={{ marginBottom: 16 }}>
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
          <Col xs={24} md={12} style={{ marginBottom: 16 }}>
            <Card title="待处理留言" extra={<Tag color="orange">{pendings.length}</Tag>}>
              {pendings.length ? (
                <List
                  dataSource={pendings}
                  renderItem={(it) => (
                    <List.Item>
                      <List.Item.Meta
                        title={`${it.name} · ${it.phone}`}
                        description={it.content.length > 40 ? it.content.slice(0, 40) + "…" : it.content}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无待处理留言" />
              )}
            </Card>
          </Col>
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
        </Row>
      </Spin>
    </div>
  );
}
