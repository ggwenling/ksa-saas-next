"use client";

import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import type { Dayjs } from "dayjs";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import { buildTaskDetail } from "@/lib/domain/task-detail";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type TaskPriority = "高" | "中" | "低" | null;

type TaskPerson = {
  id: string;
  displayName: string;
  username: string;
} | null;

type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  objective: string | null;
  acceptanceCriteria: string | null;
  nextActions: string | null;
  risks: string | null;
  deliverables: string | null;
  collaborationNote: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  assignee: TaskPerson;
  creator: TaskPerson;
  createdAt: string;
  updatedAt: string;
};

type Member = {
  id: string;
  displayName: string;
  username: string;
};

const statusLabel: Record<TaskStatus, string> = {
  TODO: "待处理",
  IN_PROGRESS: "进行中",
  DONE: "已完成",
};

const priorityColor: Record<Exclude<TaskPriority, null>, string> = {
  高: "red",
  中: "gold",
  低: "blue",
};

export default function TeamBoardPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = params.teamId;
  const { message } = App.useApp();

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<{
    title: string;
    description?: string;
    objective?: string;
    acceptanceCriteria?: string;
    nextActions?: string;
    risks?: string;
    deliverables?: string;
    collaborationNote?: string;
    priority?: Exclude<TaskPriority, null>;
    assigneeId?: string;
    dueDate?: Dayjs;
  }>();

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    try {
      const [taskRes, memberRes] = await Promise.all([
        fetch(`/api/teams/${teamId}/tasks`, { cache: "no-store" }),
        fetch(`/api/teams/${teamId}/members`, { cache: "no-store" }),
      ]);

      const taskJson = (await taskRes.json()) as { data?: TaskItem[]; message?: string };
      const memberJson = (await memberRes.json()) as { data?: Member[]; message?: string };

      if (!taskRes.ok) {
        message.error(taskJson.message ?? "获取任务列表失败");
        return;
      }
      if (!memberRes.ok) {
        message.error(memberJson.message ?? "获取成员列表失败");
        return;
      }

      setTasks(taskJson.data ?? []);
      setMembers(memberJson.data ?? []);
    } catch {
      message.error("网络异常，加载看板失败");
    } finally {
      setLoading(false);
    }
  }, [message, teamId]);

  useEffect(() => {
    if (teamId) {
      void fetchBoard();
    }
  }, [fetchBoard, teamId]);

  const grouped = useMemo(
    () => ({
      TODO: tasks.filter((task) => task.status === "TODO"),
      IN_PROGRESS: tasks.filter((task) => task.status === "IN_PROGRESS"),
      DONE: tasks.filter((task) => task.status === "DONE"),
    }),
    [tasks],
  );

  const taskDetail = useMemo(() => {
    if (!selectedTask || !selectedTask.creator) {
      return null;
    }

    return buildTaskDetail({
      title: selectedTask.title,
      description: selectedTask.description,
      objective: selectedTask.objective,
      acceptanceCriteria: selectedTask.acceptanceCriteria,
      nextActions: selectedTask.nextActions,
      risks: selectedTask.risks,
      deliverables: selectedTask.deliverables,
      collaborationNote: selectedTask.collaborationNote,
      priority: selectedTask.priority,
      status: selectedTask.status,
      assignee: selectedTask.assignee,
      creator: selectedTask.creator,
      dueDate: selectedTask.dueDate,
      createdAt: selectedTask.createdAt,
      updatedAt: selectedTask.updatedAt,
    });
  }, [selectedTask]);

  const createTask = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          description: values.description ?? null,
          objective: values.objective ?? null,
          acceptanceCriteria: values.acceptanceCriteria ?? null,
          nextActions: values.nextActions ?? null,
          risks: values.risks ?? null,
          deliverables: values.deliverables ?? null,
          collaborationNote: values.collaborationNote ?? null,
          priority: values.priority ?? null,
          assigneeId: values.assigneeId ?? null,
          dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        }),
      });
      const json = (await res.json()) as { message?: string };
      if (!res.ok) {
        message.error(json.message ?? "创建任务失败");
        return;
      }
      message.success("创建任务成功");
      setOpen(false);
      form.resetFields();
      await fetchBoard();
    } catch {
      message.error("网络异常，创建任务失败");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (taskId: string, status: TaskStatus) => {
    const res = await fetch(`/api/teams/${teamId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = (await res.json()) as { message?: string };
    if (!res.ok) {
      message.error(json.message ?? "更新任务状态失败");
      return;
    }
    await fetchBoard();
  };

  const deleteTask = async (taskId: string) => {
    const res = await fetch(`/api/teams/${teamId}/tasks/${taskId}`, {
      method: "DELETE",
    });
    const json = (await res.json()) as { message?: string };
    if (!res.ok) {
      message.error(json.message ?? "删除任务失败");
      return;
    }
    message.success("删除任务成功");
    await fetchBoard();
  };

  const TaskColumn = ({ status, title }: { status: TaskStatus; title: string }) => (
    <Card
      title={title}
      className="glass-panel rounded-[30px] !border-white/70 !bg-white/55"
    >
      <Space orientation="vertical" size={12} className="w-full">
        {grouped[status].length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无任务" />
        ) : (
          grouped[status].map((task, index) => (
            <Reveal key={task.id} delay={0.03 * index} y={10}>
              <Card
                size="small"
                hoverable
                className="!cursor-pointer !rounded-[24px] !border-white/70 !bg-white/46"
                onClick={() => setSelectedTask(task)}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <Typography.Text strong>{task.title}</Typography.Text>
                  <Popconfirm
                    title="确认删除该任务？"
                    onConfirm={() => void deleteTask(task.id)}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </Popconfirm>
                </div>

                {task.description ? (
                  <Typography.Paragraph className="!mb-2 soft-text">
                    {task.description}
                  </Typography.Paragraph>
                ) : null}

                <Space wrap>
                  <Tag>{task.assignee?.displayName ?? "未分配"}</Tag>
                  <Tag color="blue">{statusLabel[task.status]}</Tag>
                  {task.priority ? <Tag color={priorityColor[task.priority]}>{task.priority}优先级</Tag> : null}
                  {task.dueDate ? <Tag color="gold">截止：{task.dueDate.slice(0, 10)}</Tag> : null}
                </Space>

                <div className="mt-3">
                  <Select
                    className="w-full"
                    value={task.status}
                    options={[
                      { value: "TODO", label: "待处理" },
                      { value: "IN_PROGRESS", label: "进行中" },
                      { value: "DONE", label: "已完成" },
                    ]}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(next) => void updateStatus(task.id, next as TaskStatus)}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <Typography.Text className="soft-text">
                    创建人：{task.creator?.displayName ?? "未知"}
                  </Typography.Text>
                  <Button
                    type="link"
                    className="!px-0"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedTask(task);
                    }}
                  >
                    查看详情
                  </Button>
                </div>
              </Card>
            </Reveal>
          ))
        )}
      </Space>
    </Card>
  );

  return (
    <Space orientation="vertical" size={20} className="w-full">
      <Reveal className="glass-panel glass-panel-strong rounded-[34px] px-6 py-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <Typography.Text className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
              Task Flow
            </Typography.Text>
            <Typography.Title className="!mb-2 !mt-3 !text-3xl">任务看板</Typography.Title>
            <Typography.Paragraph className="!mb-0 max-w-2xl soft-text">
              团队任务从待处理、进行中到已完成的推进状态会在这里持续更新。点开任何任务，都能看到完整档案与创建人信息。
            </Typography.Paragraph>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            className="!h-12 !rounded-2xl"
            onClick={() => setOpen(true)}
          >
            新建任务
          </Button>
        </div>
      </Reveal>

      {loading ? (
        <Card className="glass-panel rounded-[30px] !border-white/70 !bg-white/55">
          <div className="flex h-40 items-center justify-center">
            <Spin />
          </div>
        </Card>
      ) : (
        <Row gutter={[18, 18]}>
          <Col xs={24} xl={8}>
            <TaskColumn status="TODO" title="待处理" />
          </Col>
          <Col xs={24} xl={8}>
            <TaskColumn status="IN_PROGRESS" title="进行中" />
          </Col>
          <Col xs={24} xl={8}>
            <TaskColumn status="DONE" title="已完成" />
          </Col>
        </Row>
      )}

      <Modal
        title="新建任务"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={createTask}
        confirmLoading={submitting}
        width={780}
      >
        <Form form={form} layout="vertical" initialValues={{ priority: "中" }}>
          <Form.Item name="title" label="任务标题" rules={[{ required: true, min: 1, max: 80 }]}>
            <Input placeholder="例如：完成竞品分析、准备答辩讲稿" />
          </Form.Item>
          <Form.Item name="description" label="任务背景">
            <Input.TextArea rows={3} placeholder="说明任务背景、当前上下文，以及为什么要做这项任务" />
          </Form.Item>
          <Form.Item name="objective" label="任务目标">
            <Input.TextArea rows={2} placeholder="例如：输出一版可直接写入计划书的市场分析结论" />
          </Form.Item>
          <Form.Item name="acceptanceCriteria" label="验收标准">
            <Input.TextArea rows={4} placeholder={"每行一条，例如：\n至少整理 3 个竞品案例\n输出对比表和结论摘要"} />
          </Form.Item>
          <Form.Item name="nextActions" label="下一步动作">
            <Input.TextArea rows={3} placeholder={"每行一条，例如：\n补充截图与链接\n同步给路演负责人"} />
          </Form.Item>
          <Form.Item name="risks" label="风险提醒">
            <Input.TextArea rows={3} placeholder={"每行一条，例如：\n样本不足影响判断\n截止前可能时间不足"} />
          </Form.Item>
          <Form.Item name="deliverables" label="建议输出物">
            <Input.TextArea rows={3} placeholder={"每行一条，例如：\n竞品分析表\n讲稿文档\n角色分工表"} />
          </Form.Item>
          <Form.Item name="collaborationNote" label="协作备注">
            <Input.TextArea rows={3} placeholder="填写需要同步给小组成员的说明、配合要求或依赖关系" />
          </Form.Item>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={8}>
              <Form.Item name="priority" label="优先级">
                <Select options={[{ value: "高", label: "高" }, { value: "中", label: "中" }, { value: "低", label: "低" }]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="assigneeId" label="负责人">
                <Select
                  allowClear
                  options={members.map((member) => ({
                    value: member.id,
                    label: `${member.displayName}（${member.username}）`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="dueDate" label="截止日期">
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-3">
            <span>{selectedTask?.title}</span>
            {selectedTask ? <Tag color="blue">{statusLabel[selectedTask.status]}</Tag> : null}
          </div>
        }
        open={Boolean(selectedTask)}
        onCancel={() => setSelectedTask(null)}
        footer={null}
        width={780}
      >
        {selectedTask && taskDetail ? (
          <Space orientation="vertical" size={16} className="w-full">
            <Card size="small" title="基础信息" className="!rounded-[24px] !bg-white/46">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="负责人">{taskDetail.summary.assigneeLabel}</Descriptions.Item>
                <Descriptions.Item label="创建人">{taskDetail.summary.creatorLabel}</Descriptions.Item>
                <Descriptions.Item label="截止日期">{taskDetail.summary.dueDateLabel}</Descriptions.Item>
                <Descriptions.Item label="优先级">{taskDetail.summary.priority}</Descriptions.Item>
                <Descriptions.Item label="创建时间">{taskDetail.summary.createdAtLabel}</Descriptions.Item>
                <Descriptions.Item label="更新时间">{taskDetail.summary.updatedAtLabel}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title="执行情况" className="!rounded-[24px] !bg-white/46">
              <Progress percent={taskDetail.progressPercent} strokeColor="#1d8b80" />
              <Typography.Paragraph className="!mb-0 !mt-3 soft-text">
                {taskDetail.progressStatus}
              </Typography.Paragraph>
            </Card>

            <Card size="small" title="任务背景与目标" className="!rounded-[24px] !bg-white/46">
              <Typography.Paragraph>{taskDetail.taskBackground}</Typography.Paragraph>
              <Typography.Paragraph className="!mb-0">
                <Typography.Text strong>任务目标：</Typography.Text>
                {taskDetail.objective}
              </Typography.Paragraph>
            </Card>

            <Card size="small" title="验收标准" className="!rounded-[24px] !bg-white/46">
              <Space orientation="vertical" size={8} className="w-full">
                {taskDetail.acceptanceCriteria.map((item, index) => (
                  <Typography.Paragraph key={item} className="!mb-0">
                    {index + 1}. {item}
                  </Typography.Paragraph>
                ))}
              </Space>
            </Card>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card size="small" title="下一步动作" className="!rounded-[24px] !bg-white/46">
                  <Space orientation="vertical" size={8} className="w-full">
                    {taskDetail.nextActions.map((item, index) => (
                      <Typography.Paragraph key={item} className="!mb-0">
                        {index + 1}. {item}
                      </Typography.Paragraph>
                    ))}
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" title="风险提醒" className="!rounded-[24px] !bg-white/46">
                  <Space orientation="vertical" size={8} className="w-full">
                    {taskDetail.risks.map((item, index) => (
                      <Typography.Paragraph key={item} className="!mb-0">
                        {index + 1}. {item}
                      </Typography.Paragraph>
                    ))}
                  </Space>
                </Card>
              </Col>
            </Row>

            <Card size="small" title="输出物与协作备注" className="!rounded-[24px] !bg-white/46">
              <Space orientation="vertical" size={8} className="w-full">
                {taskDetail.deliverables.map((item, index) => (
                  <Typography.Paragraph key={item} className="!mb-0">
                    {index + 1}. {item}
                  </Typography.Paragraph>
                ))}
                <Typography.Paragraph className="!mb-0 !mt-3 soft-text">
                  {taskDetail.collaborationNote}
                </Typography.Paragraph>
              </Space>
            </Card>
          </Space>
        ) : null}
      </Modal>
    </Space>
  );
}
