import React from "react";
import { Upload, Button, Image } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { uploadApi } from "../api";

// 单图上传（复用后端 /upload）。value 为图片 URL。
export default function ImageUpload({ value, onChange, width = 104, height = 104 }) {
  const customRequest = async ({ file, onSuccess, onError }) => {
    try {
      const { url } = await uploadApi.upload(file);
      onChange && onChange(url);
      onSuccess(url);
    } catch (e) {
      onError(e);
    }
  };

  const cardStyle = { width, height, overflow: "hidden" };

  return (
    <div style={{ display: "inline-block" }}>
      <Upload
        listType="picture-card"
        showUploadList={false}
        accept="image/png,image/jpeg,image/webp"
        customRequest={customRequest}
        style={cardStyle}
      >
        {value ? (
          <img
            src={value}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ paddingTop: 8 }}>
            <UploadOutlined />
            <div style={{ marginTop: 8 }}>上传图片</div>
          </div>
        )}
      </Upload>
      {value && (
        <Button
          type="link"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => onChange && onChange("")}
        >
          移除
        </Button>
      )}
    </div>
  );
}
