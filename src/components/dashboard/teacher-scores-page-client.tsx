"use client";

import { App, Button, Card, Form, Input, InputNumber, Select, Space, Table, Typography } from "antd";
import { useMemo, useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import type { ScoreRow } from "@/lib/dashboard/types";
import { saveScoreAction } from "@/lib/server/dashboard-actions";

type FormValues = {
  teamId: string;
  businessPlanScore: number;
  defenseScore: number;
  bonusScore: number;
  comment?: string;
};

type TeacherScoresPageClientProps = {
  rows: ScoreRow[];
};

export function TeacherScoresPageClient({ rows }: TeacherScoresPageClientProps) {
  const [scoreRows, setScoreRows] = useState(rows);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const { message } = App.useApp();

  const mapByTeam = useMemo(() => new Map(scoreRows.map((row) => [row.teamId, row])), [scoreRows]);

  const handleTeamChange = (teamId: string) => {
    const row = mapByTeam.get(teamId);
    form.setFieldsValue({
      teamId,
      businessPlanScore: row?.score?.businessPlanScore ?? 0,
      defenseScore: row?.score?.defenseScore ?? 0,
      bonusScore: row?.score?.bonusScore ?? 0,
      comment: row?.score?.comment ?? "",
    });
  };

  const submitScore = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const result = await saveScoreAction(values);
      if (!result.ok || !result.data) {
        message.error(result.message);
        return;
      }
      const nextScore = result.data;

      message.success(result.message);
      setScoreRows((current) =>
        current.map((row) => (row.teamId === nextScore.teamId ? nextScore : row)),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Space orientation="vertical" size={20} className="w-full">
      <Reveal className="glass-panel glass-panel-strong rounded-[34px] px-6 py-6">
        <Typography.Text className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
          Evaluation Desk
        </Typography.Text>
        <Typography.Title className="!mb-2 !mt-3 !text-3xl">老师评分</Typography.Title>
        <Typography.Paragraph className="!mb-0 max-w-2xl soft-text">
          评分规则：商业计划书 60 分、路演答辩 30 分、特色加分 10 分。结果会统一沉淀在项目记录中。
        </Typography.Paragraph>
      </Reveal>

      <Reveal delay={0.05}>
        <Card className="glass-panel rounded-[30px] !border-white/70 !bg-white/55" title="评分表单">
          <Form
            form={form}
            layout="vertical"
            initialValues={{ businessPlanScore: 0, defenseScore: 0, bonusScore: 0 }}
          >
            <Form.Item name="teamId" label="团队" rules={[{ required: true, message: "请选择团队" }]}>
              <Select
                size="large"
                placeholder="请选择团队"
                options={scoreRows.map((row) => ({ value: row.teamId, label: row.teamName }))}
                onChange={handleTeamChange}
              />
            </Form.Item>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Form.Item name="businessPlanScore" label="商业计划书（0-60）" rules={[{ required: true }]}>
                <InputNumber min={0} max={60} className="w-full" size="large" />
              </Form.Item>
              <Form.Item name="defenseScore" label="路演答辩（0-30）" rules={[{ required: true }]}>
                <InputNumber min={0} max={30} className="w-full" size="large" />
              </Form.Item>
              <Form.Item name="bonusScore" label="特色加分（0-10）" rules={[{ required: true }]}>
                <InputNumber min={0} max={10} className="w-full" size="large" />
              </Form.Item>
            </div>

            <Form.Item name="comment" label="评语">
              <Input.TextArea rows={4} maxLength={300} placeholder="输入对团队表现的综合评价" />
            </Form.Item>

            <Button type="primary" size="large" loading={submitting} onClick={() => void submitScore()}>
              保存评分
            </Button>
          </Form>
        </Card>
      </Reveal>

      <Reveal delay={0.1}>
        <Card className="glass-panel rounded-[30px] !border-white/70 !bg-white/55" title="评分记录">
          <Table
            rowKey="teamId"
            dataSource={scoreRows}
            pagination={{ pageSize: 8 }}
            columns={[
              { title: "团队", dataIndex: "teamName" },
              {
                title: "计划书",
                render: (_, row: ScoreRow) => row.score?.businessPlanScore ?? "-",
              },
              {
                title: "答辩",
                render: (_, row: ScoreRow) => row.score?.defenseScore ?? "-",
              },
              {
                title: "特色",
                render: (_, row: ScoreRow) => row.score?.bonusScore ?? "-",
              },
              {
                title: "总分",
                render: (_, row: ScoreRow) =>
                  row.score
                    ? row.score.businessPlanScore + row.score.defenseScore + row.score.bonusScore
                    : "-",
              },
              {
                title: "更新时间",
                render: (_, row: ScoreRow) =>
                  row.score?.updatedAt ? row.score.updatedAt.slice(0, 16) : "-",
              },
            ]}
          />
        </Card>
      </Reveal>
    </Space>
  );
}
