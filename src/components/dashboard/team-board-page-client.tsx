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
  Tag,
  Typography,
} from "antd";
import type { Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import type { TaskItem, TeamMember } from "@/lib/dashboard/types";
import { buildTaskDetail } from "@/lib/domain/task-detail";
import { createTaskAction, deleteTaskAction, updateTaskStatusAction } from "@/lib/server/dashboard-actions";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type TaskPriority = "高" | "中" | "低" | null;

type TeamBoardPageClientProps = {
  teamId: string;
  tasks: TaskItem[];
  members: TeamMember[];
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

export function TeamBoardPageClient({ teamId, tasks, members }: TeamBoardPageClientProps) {
  const { message } = App.useApp();
  const [taskRows, setTaskRows] = useState(tasks);
  const [open, setOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mutating, setMutating] = useState(false);
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

  const grouped = useMemo(
    () => ({
      TODO: taskRows.filter((task) => task.status === "TODO"),
      IN_PROGRESS: taskRows.filter((task) => task.status === "IN_PROGRESS"),
      DONE: taskRows.filter((task) => task.status === "DONE"),
    }),
    [taskRows],
  );

  const selectedTask = useMemo(
    () => taskRows.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, taskRows],
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
      priority: selectedTask.priority as TaskPriority,
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
      const result = await createTaskAction(teamId, {
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
      });

      if (!result.ok || !result.data) {
        message.error(result.message);
        return;
      }
      const nextTask = result.data;

      message.success(result.message);
      setTaskRows((current) => [nextTask, ...current]);
      setOpen(false);
      form.resetFields();
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (taskId: string, status: TaskStatus) => {
    setMutating(true);
    try {
      const result = await updateTaskStatusAction(teamId, taskId, status);
      if (!result.ok || !result.data) {
        message.error(result.message);
        return;
      }
      const nextTask = result.data;

      message.success(result.message);
      setTaskRows((current) =>
        current.map((task) => (task.id === nextTask.id ? nextTask : task)),
      );
    } finally {
      setMutating(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    setMutating(true);
    try {
      const result = await deleteTaskAction(teamId, taskId);
      if (!result.ok || !result.data) {
        message.error(result.message);
        return;
      }
      const deletedTaskId = result.data.taskId;

      message.success(result.message);
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
      }
      setTaskRows((current) => current.filter((task) => task.id !== deletedTaskId));
    } finally {
      setMutating(false);
    }
  };

  const TaskColumn = ({ status, title }: { status: TaskStatus; title: string }) => (
    <Card title={title} className="glass-panel rounded-[30px] !border-white/70 !bg-white/55">
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
                onClick={() => setSelectedTaskId(task.id)}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <Typography.Text strong>{task.title}</Typography.Text>
                  <Popconfirm title="确认删除该任务？" onConfirm={() => void deleteTask(task.id)}>
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      disabled={mutating}
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
                  {task.priority ? <Tag color={priorityColor[task.priority as Exclude<TaskPriority, null>]}>{task.priority}优先级</Tag> : null}
                  {task.dueDate ? <Tag color="gold">截止：{task.dueDate.slice(0, 10)}</Tag> : null}
                </Space>

                <div className="mt-3">
                  <Select
                    className="w-full"
                    value={task.status}
                    disabled={mutating}
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
                      setSelectedTaskId(task.id);
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
              团队任务从待处理、进行中到已完成的推进状态会在这里持续更新。点开任意任务，都能看到完整文案与创建人信息。
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

      <Modal
        title="新建任务"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => void createTask()}
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
            <Input.TextArea rows={3} placeholder={"每行一条，例如：\n样本不足影响判断\n截止前可能时间不够"} />
          </Form.Item>
          <Form.Item name="deliverables" label="建议输出物">
            <Input.TextArea rows={3} placeholder={"每行一条，例如：\n竞品分析表\n讲稿文案\n角色分工表"} />
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
        onCancel={() => setSelectedTaskId(null)}
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
