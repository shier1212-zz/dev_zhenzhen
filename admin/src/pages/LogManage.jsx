import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Input,
  Select,
  Tag,
  Typography,
  Space,
} from "antd";
import { logApi } from "../api";

const MODULE_OPTIONS = [
  { value: "auth", label: "认证" },
  { value: "banner", label: "轮播" },
  { value: "news", label: "新闻" },
  { value: "home", label: "首页" },
  { value: "about", label: "关于我们" },
  { value: "contact", label: "联系信息" },
  { value: "product", label: "产品" },
  { value: "message", label: "留言" },
  { value: "dept", label: "部门" },
  { value: "role", label: "角色" },
  { value: "user", label: "账号" },
];

export default function LogManage() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [module, setModule] = useState(null);
  const [username, setUsername] = useState("");
  const [action, setAction] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await logApi.list({
        page,
        page_size: 10,
        module: module || undefined,
        username: username || undefined,
        action: action || undefined,
      });
      setData(res.items || []);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, module, username, action]);

  const columns = [
    { title: "ID", dataIndex: "id", width: 70 },
    { title: "操作人", dataIndex: "username", width: 110 },
    {
      title: "模块",
      dataIndex: "module",
      width: 110,
      render: (v) => <Tag>{v}</Tag>,
    },
    { title: "动作", dataIndex: "action", width: 90 },
    { title: "对象", dataIndex: "target", render: (v) => v || "-" },
    { title: "IP", dataIndex: "ip", width: 130, render: (v) => v || "-" },
    { title: "时间", dataIndex: "created_date", width: 170, render: (v) => v || "-" },
  ];

  return (
    <div>
      <Typography.Title level={4}>操作日志</Typography.Title>
      <Card>
        <Space style={{ marginBottom: 16, flexWrap: "wrap" }}>
          <Select
            placeholder="模块"
            allowClear
            style={{ width: 140 }}
            value={module}
            onChange={setModule}
            options={MODULE_OPTIONS}
          />
          <Input.Search
            placeholder="操作人"
            allowClear
            onSearch={(v) => {
              setUsername(v);
              setPage(1);
            }}
            style={{ width: 160 }}
          />
          <Input
            placeholder="动作"
            allowClear
            style={{ width: 140 }}
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          />
        </Space>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={{ current: page, total, pageSize: 10, onChange: setPage }}
        />
      </Card>
    </div>
  );
}
