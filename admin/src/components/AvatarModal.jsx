import React, { useState } from "react";
import { Modal, Form, message } from "antd";
import { authApi } from "../api";
import { setUser, getUser } from "../store/auth";
import ImageUpload from "./ImageUpload";

// 修改头像：上传图片后调用 /auth/avatar。
export default function AvatarModal({ open, onClose }) {
  const [url, setUrl] = useState(getUser()?.avatar || "");
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    if (!url) {
      message.warning("请先上传头像");
      return;
    }
    setLoading(true);
    try {
      await authApi.updateAvatar({ avatar_url: url });
      const u = getUser();
      if (u) setUser({ ...u, avatar: url });
      message.success("头像已更新");
      onClose && onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="修改头像"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="保存"
      cancelText="取消"
      confirmLoading={loading}
    >
      <div style={{ marginTop: 12 }}>
        <ImageUpload value={url} onChange={setUrl} width={120} height={120} />
      </div>
    </Modal>
  );
}
