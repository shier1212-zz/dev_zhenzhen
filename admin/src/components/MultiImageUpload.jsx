import React from "react";
import { Upload } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { uploadApi } from "../api";

// 多图上传：value 为 URL 数组（受控）。
export default function MultiImageUpload({ value = [], onChange, maxCount = 8 }) {
  const customRequest = async ({ file, onSuccess, onError }) => {
    try {
      const url = await uploadApi.upload(file);
      const next = [...(value || []), url];
      onChange && onChange(next);
      onSuccess(url);
    } catch (e) {
      onError(e);
    }
  };

  const handleRemove = (file) => {
    onChange && onChange((value || []).filter((x) => x !== file.url));
  };

  const items = (value || []).map((url, i) => ({
    uid: String(i),
    name: `img${i}`,
    status: "done",
    url,
  }));

  return (
    <Upload
      listType="picture-card"
      fileList={items}
      customRequest={customRequest}
      onRemove={handleRemove}
      accept="image/png,image/jpeg,image/webp"
      maxCount={maxCount}
    >
      {(value || []).length >= maxCount ? null : (
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>上传</div>
        </div>
      )}
    </Upload>
  );
}
