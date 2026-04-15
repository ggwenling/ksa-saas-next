"use client";

import { DeleteOutlined, DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import { App, Button, Card, Empty, Popconfirm, Space, Table, Tag, Typography, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile } from "antd/es/upload/interface";
import { useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import type { TeamFileRow } from "@/lib/dashboard/types";
import { deleteTeamFileAction } from "@/lib/server/dashboard-actions";

type TeamFilesPageClientProps = {
  teamId: string;
  rows: TeamFileRow[];
};

const roleLabel: Record<TeamFileRow["uploader"]["role"], string> = {
  TEACHER: "老师",
  LEADER: "队长",
  MEMBER: "队员",
};

function formatSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

export function TeamFilesPageClient({ teamId, rows }: TeamFilesPageClientProps) {
  const { message } = App.useApp();
  const [fileRows, setFileRows] = useState(rows);
  const [selectedFiles, setSelectedFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const uploadFile = async () => {
    const fileObj = selectedFiles[0]?.originFileObj;
    if (!fileObj) {
      message.warning("请先选择要上传的文件");
      return;
    }

    const formData = new FormData();
    formData.append("file", fileObj);

    setUploading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/files`, {
        method: "POST",
        body: formData,
      });
      const json = (await res.json()) as { message?: string; data?: TeamFileRow };
      if (!res.ok || !json.data) {
        message.error(json.message ?? "上传文件失败");
        return;
      }
      const nextFile = json.data;

      message.success(json.message ?? "上传文件成功");
      setFileRows((current) => [nextFile, ...current]);
      setSelectedFiles([]);
    } catch {
      message.error("网络异常，上传文件失败");
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    setDeleting(true);
    try {
      const result = await deleteTeamFileAction(teamId, fileId);
      if (!result.ok || !result.data) {
        message.error(result.message);
        return;
      }
      const deletedFileId = result.data.fileId;

      message.success(result.message);
      setFileRows((current) => current.filter((row) => row.id !== deletedFileId));
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnsType<TeamFileRow> = [
    {
      title: "文件名",
      dataIndex: "originalName",
      ellipsis: true,
    },
    {
      title: "大小",
      render: (_, row) => formatSize(row.size),
    },
    {
      title: "上传人",
      render: (_, row) => (
        <Space size={6}>
          <span>{row.uploader.displayName}</span>
          <Tag color="blue">{roleLabel[row.uploader.role]}</Tag>
        </Space>
      ),
    },
    {
      title: "上传时间",
      render: (_, row) => row.createdAt.slice(0, 16),
    },
    {
      title: "操作",
      render: (_, row) => (
        <Space>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() =>
              window.open(
                `/api/teams/${teamId}/files/${row.id}/download`,
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            下载
          </Button>
          {row.canDelete ? (
            <Popconfirm title="确认删除该文件？" onConfirm={() => void deleteFile(row.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} disabled={deleting}>
                删除
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <Space orientation="vertical" size={20} className="w-full">
      <Reveal className="glass-panel glass-panel-strong rounded-[34px] px-6 py-6">
        <Typography.Text className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
          Shared Assets
        </Typography.Text>
        <Typography.Title className="!mb-2 !mt-3 !text-3xl">团队文件</Typography.Title>
        <Typography.Paragraph className="!mb-0 max-w-2xl soft-text">
          在团队文件空间里集中上传文档、图片和路演材料，老师与队长可管理所有文件。
        </Typography.Paragraph>
      </Reveal>

      <Reveal delay={0.05}>
        <Card className="glass-panel rounded-[30px] !border-white/70 !bg-white/55" title="上传文件">
          <div className="flex flex-wrap items-center gap-3">
            <Upload
              fileList={selectedFiles}
              beforeUpload={() => false}
              maxCount={1}
              onChange={({ fileList }) => setSelectedFiles(fileList)}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
              listType="text"
              showUploadList={false}
            >
              <Button type="default" size="large" icon={<UploadOutlined />} className="!rounded-2xl">
                选择文件（支持图片/文档）
              </Button>
            </Upload>

            <Button
              type="primary"
              size="large"
              icon={<UploadOutlined />}
              loading={uploading}
              className="!rounded-2xl"
              onClick={() => void uploadFile()}
            >
              上传文件
            </Button>

            <Typography.Text className="soft-text">
              {selectedFiles[0]?.name ? `已选择：${selectedFiles[0].name}` : "未选择文件"}
            </Typography.Text>
            <Typography.Text className="soft-text">单文件最大 50MB</Typography.Text>
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.1}>
        <Card className="glass-panel rounded-[30px] !border-white/70 !bg-white/55" title="文件列表">
          {fileRows.length === 0 ? (
            <Empty description="暂无文件" />
          ) : (
            <Table rowKey="id" dataSource={fileRows} columns={columns} pagination={{ pageSize: 8 }} />
          )}
        </Card>
      </Reveal>
    </Space>
  );
}
