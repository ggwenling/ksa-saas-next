"use client";

import { PlusOutlined } from "@ant-design/icons";
import { App, Button, Card, Col, Empty, Form, Input, Modal, Progress, Row, Space, Tag, Typography } from "antd";
import Link from "next/link";
import { useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import type { TeamSummary } from "@/lib/dashboard/types";
import { createTeamAction } from "@/lib/server/dashboard-actions";

type TeamsPageClientProps = {
  teams: TeamSummary[];
};

export function TeamsPageClient({ teams }: TeamsPageClientProps) {
  const [teamRows, setTeamRows] = useState(teams);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<{ name: string; description?: string }>();
  const { message } = App.useApp();

  const createTeam = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const result = await createTeamAction(values);
      if (!result.ok || !result.data) {
        message.error(result.message);
        return;
      }
      const nextTeam = result.data;

      message.success(result.message);
      setTeamRows((current) => [nextTeam, ...current]);
      setOpen(false);
      form.resetFields();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Space orientation="vertical" size={20} className="w-full">
      <Reveal className="glass-panel glass-panel-strong rounded-[34px] px-6 py-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <Typography.Text className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
              Team Workspace
            </Typography.Text>
            <Typography.Title className="!mb-2 !mt-3 !text-3xl">团队管理</Typography.Title>
            <Typography.Paragraph className="!mb-0 max-w-2xl soft-text">
              在这里查看每个团队的进度、成员规模与邀请码，并快速进入任务看板和文件空间。
            </Typography.Paragraph>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            className="!h-12 !rounded-2xl"
            onClick={() => setOpen(true)}
          >
            新建团队
          </Button>
        </div>
      </Reveal>

      {teamRows.length === 0 ? (
        <Card className="glass-panel rounded-[30px] !border-white/70 !bg-white/55">
          <Empty description="暂无团队" />
        </Card>
      ) : (
        <Row gutter={[18, 18]}>
          {teamRows.map((team, index) => (
            <Col key={team.id} xs={24} lg={12}>
              <Reveal delay={0.04 * index}>
                <Card
                  className="glass-panel rounded-[30px] !border-white/70 !bg-white/55"
                  title={
                    <div className="flex items-center gap-3">
                      <span>{team.name}</span>
                      <Tag color="cyan">进行中</Tag>
                    </div>
                  }
                  actions={[
                    <Link key="board" href={`/teams/${team.id}/board`}>
                      进入看板
                    </Link>,
                    <Link key="files" href={`/teams/${team.id}/files`}>
                      团队文件
                    </Link>,
                  ]}
                >
                  <Typography.Paragraph className="!mb-4 soft-text">
                    {team.description || "该团队目前还没有补充简介，可以在后续协作中继续完善。"}
                  </Typography.Paragraph>

                  <div className="mb-4 grid gap-3 md:grid-cols-3">
                    {[
                      ["团队人数", `${team.memberCount} 人`],
                      ["当前进度", `${team.progress}%`],
                      ["邀请码", team.inviteCode ?? "仅队长可见"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-[22px] border border-white/65 bg-white/42 px-4 py-3"
                      >
                        <Typography.Text className="block text-xs text-slate-500">
                          {label}
                        </Typography.Text>
                        <Typography.Text className="mt-2 block font-semibold text-slate-800">
                          {value}
                        </Typography.Text>
                      </div>
                    ))}
                  </div>

                  <Progress percent={team.progress} strokeColor="#1d8b80" showInfo={false} />
                </Card>
              </Reveal>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title="新建团队"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => void createTeam()}
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="团队名称" rules={[{ required: true, min: 2 }]}>
            <Input placeholder="例如：智创小队" />
          </Form.Item>
          <Form.Item name="description" label="团队简介">
            <Input.TextArea rows={3} placeholder="选填" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
