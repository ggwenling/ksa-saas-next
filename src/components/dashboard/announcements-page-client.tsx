"use client";

import { App, Button, Card, Empty, Form, Input, List, Space, Tag, Typography } from "antd";
import { useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import type { AnnouncementRow } from "@/lib/dashboard/types";
import { publishAnnouncementAction } from "@/lib/server/dashboard-actions";

type AnnouncementsPageClientProps = {
  canPublish: boolean;
  rows: AnnouncementRow[];
};

const roleLabel: Record<AnnouncementRow["author"]["role"], string> = {
  TEACHER: "老师",
  LEADER: "队长",
  MEMBER: "队员",
};

export function AnnouncementsPageClient({
  canPublish,
  rows,
}: AnnouncementsPageClientProps) {
  const [announcementRows, setAnnouncementRows] = useState(rows);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<{ title: string; content: string }>();
  const { message } = App.useApp();

  const publishAnnouncement = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const result = await publishAnnouncementAction(values);
      if (!result.ok || !result.data) {
        message.error(result.message);
        return;
      }
      const nextAnnouncement = result.data;

      message.success(result.message);
      setAnnouncementRows((current) => [nextAnnouncement, ...current]);
      form.resetFields();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Space orientation="vertical" size={20} className="w-full">
      <Reveal className="glass-panel glass-panel-strong rounded-[34px] px-6 py-6">
        <Typography.Text className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
          Notice Stream
        </Typography.Text>
        <Typography.Title className="!mb-2 !mt-3 !text-3xl">公告中心</Typography.Title>
        <Typography.Paragraph className="!mb-0 max-w-2xl soft-text">
          在这里统一发布课程安排、小组提醒和阶段通知。信息集中、角色清晰、阅读成本更低。
        </Typography.Paragraph>
      </Reveal>

      {canPublish ? (
        <Reveal delay={0.04}>
          <Card className="glass-panel rounded-[30px] !border-white/70 !bg-white/55" title="发布公告">
            <Form form={form} layout="vertical">
              <Form.Item
                name="title"
                label="公告标题"
                rules={[{ required: true, message: "请输入公告标题" }]}
              >
                <Input size="large" placeholder="例如：本周路演彩排安排" />
              </Form.Item>
              <Form.Item
                name="content"
                label="公告内容"
                rules={[{ required: true, message: "请输入公告内容" }]}
              >
                <Input.TextArea rows={5} maxLength={1000} placeholder="请写下公告的完整内容" />
              </Form.Item>
              <Button type="primary" size="large" loading={submitting} onClick={() => void publishAnnouncement()}>
                发布公告
              </Button>
            </Form>
          </Card>
        </Reveal>
      ) : (
        <Reveal delay={0.04}>
          <Card className="glass-panel rounded-[30px] !border-white/70 !bg-white/55">
            <Typography.Text className="soft-text">
              当前账号仅支持查看公告，无发布权限。
            </Typography.Text>
          </Card>
        </Reveal>
      )}

      <Reveal delay={0.08}>
        <Card className="glass-panel rounded-[30px] !border-white/70 !bg-white/55" title="公告列表">
          {announcementRows.length === 0 ? (
            <Empty description="暂无公告" />
          ) : (
            <List
              dataSource={announcementRows}
              split={false}
              renderItem={(item) => (
                <List.Item key={item.id} className="!px-0 !py-3">
                  <div className="glass-panel glass-panel-strong w-full rounded-[24px] px-5 py-5">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Typography.Title level={5} className="!m-0">
                        {item.title}
                      </Typography.Title>
                      <Tag color="blue">{roleLabel[item.author.role]}</Tag>
                      <Typography.Text className="soft-text">
                        发布人：{item.author.displayName}
                      </Typography.Text>
                      <Typography.Text className="soft-text">
                        发布时间：{item.createdAt.slice(0, 16)}
                      </Typography.Text>
                    </div>
                    <Typography.Paragraph className="!mb-0 leading-8 text-slate-700">
                      {item.content}
                    </Typography.Paragraph>
                  </div>
                </List.Item>
              )}
            />
          )}
        </Card>
      </Reveal>
    </Space>
  );
}
