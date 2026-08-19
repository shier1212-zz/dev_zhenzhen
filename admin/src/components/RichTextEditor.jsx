import React, { useState } from "react";
import { Editor, Toolbar } from "@wangeditor/editor-for-react";
import "@wangeditor/editor/dist/css/style.css";
import { uploadApi } from "../api";

// 富文本编辑器（wangEditor 5）。value/onChange 受控，父组件回传相同 html 时为空操作，不跳光标。
export default function RichTextEditor({ value = "", onChange, height = 360 }) {
  const [editor, setEditor] = useState(null);

  const editorConfig = {
    placeholder: "请输入内容...",
    MENU_CONF: {
      uploadImage: {
        customUpload: async (file, insertFn) => {
          try {
            const url = await uploadApi.upload(file);
            insertFn(url, file.name || "图片", url);
          } catch (e) {
            // 上传失败由全局拦截器提示
          }
        },
      },
    },
  };

  const onCreated = (e) => setEditor(e);

  return (
    <div className="rich-editor-wrap">
      <Toolbar editor={editor} defaultConfig={{}} mode="default" />
      <Editor
        defaultConfig={editorConfig}
        value={value}
        onCreated={onCreated}
        onChange={(e) => onChange && onChange(e.getHtml())}
        style={{ height, overflowY: "hidden" }}
      />
    </div>
  );
}
