"use client";

import { App, Button, Card, Form, Input, InputNumber, Select, Space, Table, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Reveal } from "@/components/ui/reveal";

type ScoreRow = {
  teamId: string;
  teamName: string;
  score: {
    id: string;
    businessPlanScore: number;
    defenseScore: number;
    bonusScore: number;
    comment: string | null;
    updatedAt: string;
  } | null;
};

type FormValues = {
  teamId: string;
  businessPlanScore: number;
  defenseScore: number;
  bonusScore: number;
  comment?: string;
};

export default function TeacherScoresPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const { message } = App.useApp();
  const forbiddenHandledRef = useRef(false);

  const handleForbidden = useCallback(() => {
    if (forbiddenHandledRef.current) return;
    forbiddenHandledRef.current = true;
    message.error("您没有此权限！请通知管理员修改权限");
    router.replace("/teams");
  }, [message, router]);

  const fetchScores = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/scores", { cache: "no-store" });
      const json = (await res.json()) as { data?: ScoreRow[]; message?: string };
      if (!res.ok) {
        if (res.status === 403) {
          handleForbidden();
          return;
        }
        message.error(json.message ?? "获取评分列表失败");
        return;
      }
      setRows(json.data ?? []);
    } catch {
      message.error("网络异常，获取评分列表失败");
    } finally {
      setLoading(false);
    }
  }, [handleForbidden, message]);

  useEffect(() => {
    void fetchScores();
  }, [fetchScores]);

  const mapByTeam = useMemo(() => new Map(rows.map((row) => [row.teamId, row])), [rows]);

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
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = (await res.json()) as { message?: string };
      if (!res.ok) {
        if (res.status === 403) {
          handleForbidden();
          return;
        }
        message.error(json.message ?? "保存评分失败");
        return;
      }
      message.success("保存评分成功");
      await fetchScores();
    } catch {
      message.error("网络异常，保存评分失败");
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
                options={rows.map((row) => ({ value: row.teamId, label: row.teamName }))}
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

            <Button type="primary" size="large" loading={submitting} onClick={submitScore}>
              保存评分
            </Button>
          </Form>
        </Card>
      </Reveal>

      <Reveal delay={0.1}>
        <Card className="glass-panel rounded-[30px] !border-white/70 !bg-white/55" title="评分记录">
          <Table
            loading={loading}
            rowKey="teamId"
            dataSource={rows}
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
