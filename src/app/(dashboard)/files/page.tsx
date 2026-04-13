"use client";

import { Card, Empty, Space, Spin, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Reveal } from "@/components/ui/reveal";

type TeamCard = {
  id: string;
  name: string;
  description: string | null;
  progress: number;
  memberCount: number;
  inviteCode: string | null;
};

type TeamListResponse = {
  data?: TeamCard[];
  message?: string;
};

export default function FilesEntryPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TeamCard[]>([]);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teams", { cache: "no-store" });
      const json = (await res.json()) as TeamListResponse;
      if (!res.ok) {
        return;
      }
      setRows(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTeams();
  }, [fetchTeams]);

  const columns: ColumnsType<TeamCard> = [
    { title: "团队名称", dataIndex: "name" },
    {
      title: "进度",
      render: (_, row) => <Tag color="cyan">{row.progress}%</Tag>,
    },
    {
      title: "成员数",
      dataIndex: "memberCount",
    },
    {
      title: "操作",
      render: (_, row) => <Link href={`/teams/${row.id}/files`}>进入文件管理</Link>,
    },
  ];

  return (
    <Space orientation="vertical" size={20} className="w-full">
      <Reveal className="glass-panel glass-panel-strong rounded-[34px] px-6 py-6">
        <Typography.Text className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
          File Matrix
        </Typography.Text>
        <Typography.Title className="!mb-2 !mt-3 !text-3xl">文件管理</Typography.Title>
        <Typography.Paragraph className="!mb-0 max-w-2xl soft-text">
          选择一个团队进入文件空间，继续上传、下载、共享和沉淀资料。
        </Typography.Paragraph>
      </Reveal>

      <Reveal delay={0.05}>
        <Card className="glass-panel rounded-[30px] !border-white/70 !bg-white/55">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Spin />
            </div>
          ) : rows.length === 0 ? (
            <Empty description="暂无可访问团队" />
          ) : (
            <Table rowKey="id" dataSource={rows} columns={columns} pagination={false} />
          )}
        </Card>
      </Reveal>
    </Space>
  );
}
