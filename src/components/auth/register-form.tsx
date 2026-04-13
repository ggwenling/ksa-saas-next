"use client";

import { ArrowRightOutlined, UsergroupAddOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Form, Input, Radio, Typography } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Reveal } from "@/components/ui/reveal";

type RegisterRole = "LEADER" | "MEMBER";

type RegisterResponse = {
  message: string;
};

export function RegisterForm() {
  const [role, setRole] = useState<RegisterRole>("LEADER");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const tip = useMemo(() => {
    if (role === "LEADER") {
      return "注册后自动创建团队，并生成一枚可分享的邀请码。";
    }
    return "通过队长提供的邀请码加入现有团队，立即参与协作。";
  }, [role]);

  return (
    <Reveal className="grid w-full max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]" y={22}>
      <Card className="glass-panel glass-panel-strong glass-panel-premium rounded-[34px] !border-white/70 px-2 py-3 shadow-[0_18px_34px_rgba(104,132,148,0.12)]">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white/70 text-lg text-[#1d8b80]">
            <UsergroupAddOutlined />
          </div>
          <div>
            <Typography.Title level={3} className="!mb-0">
              创建账号
            </Typography.Title>
            <Typography.Text className="soft-text">{tip}</Typography.Text>
          </div>
        </div>

        {error ? <Alert type="error" className="mb-4 rounded-2xl" title={error} /> : null}

        <Form
          layout="vertical"
          initialValues={{ role: "LEADER" }}
          onFinish={async (values: {
            username: string;
            password: string;
            displayName: string;
            role: RegisterRole;
            inviteCode?: string;
          }) => {
            setPending(true);
            setError(null);
            try {
              const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...values,
                  inviteCode: values.inviteCode ?? null,
                }),
              });
              const data = (await res.json()) as RegisterResponse;
              if (!res.ok) {
                setError(data.message ?? "注册失败，请稍后重试");
                return;
              }
              router.push("/login");
            } catch {
              setError("网络异常，请稍后重试");
            } finally {
              setPending(false);
            }
          }}
        >
          <Form.Item label="身份" name="role">
            <Radio.Group
              onChange={(event) => setRole(event.target.value as RegisterRole)}
              optionType="button"
              buttonStyle="solid"
              className="w-full [&_.ant-radio-button-wrapper]:!h-11 [&_.ant-radio-button-wrapper]:!rounded-2xl [&_.ant-radio-button-wrapper]:!bg-white/55 [&_.ant-radio-button-wrapper]:!leading-[44px]"
              options={[
                { label: "我是队长", value: "LEADER" },
                { label: "我是队员", value: "MEMBER" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="账号"
            name="username"
            rules={[
              { required: true, message: "请输入账号" },
              { min: 3, message: "账号至少 3 位" },
            ]}
          >
            <Input
              size="large"
              autoComplete="username"
              placeholder="仅支持字母、数字、下划线"
              className="!rounded-2xl !bg-white/68"
            />
          </Form.Item>

          <Form.Item
            label="昵称"
            name="displayName"
            rules={[{ required: true, message: "请输入昵称" }]}
          >
            <Input
              size="large"
              placeholder="例如：策划负责人、路演主讲人"
              className="!rounded-2xl !bg-white/68"
            />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: "请输入密码" },
              { min: 8, message: "密码至少 8 位" },
            ]}
          >
            <Input.Password
              size="large"
              autoComplete="new-password"
              placeholder="至少包含字母和数字"
              className="!rounded-2xl !bg-white/68"
            />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.role !== curr.role}>
            {({ getFieldValue }) =>
              getFieldValue("role") === "MEMBER" ? (
                <Form.Item
                  label="邀请码"
                  name="inviteCode"
                  rules={[{ required: true, message: "请输入邀请码" }]}
                >
                  <Input
                    size="large"
                    placeholder="例如：TEAM-XXXXXX"
                    className="!rounded-2xl !bg-white/68"
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Button
            type="primary"
            size="large"
            block
            htmlType="submit"
            loading={pending}
            icon={<ArrowRightOutlined />}
            iconPosition="end"
            className="!mt-2 !h-12 !rounded-2xl"
          >
            创建账号
          </Button>
        </Form>

        <Typography.Paragraph className="!mb-0 !mt-6 text-center soft-text">
          已有账号？<Link href="/login">返回登录</Link>
        </Typography.Paragraph>
      </Card>

      <section className="glass-panel glass-panel-strong glass-panel-premium liquid-grid rounded-[38px] p-8 lg:p-12">
        <Typography.Text className="text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-500">
          Team Onboarding
        </Typography.Text>
        <Typography.Title className="!mb-3 !mt-6 !text-4xl !leading-[1.08] lg:!text-[56px]">
          把临时小组，变成真正有节奏的项目团队
        </Typography.Title>
        <Typography.Paragraph className="max-w-xl !text-base !leading-8 soft-text">
          账号创建只是开始。后续你们会在同一套系统里推进任务、上传资料、发布公告、记录评分，把课程作业做成一套完整的协作过程。
        </Typography.Paragraph>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            ["组队更清晰", "队长创建团队，队员凭邀请码加入"],
            ["分工更明确", "所有人都能看到任务流转和责任人"],
            ["成果更集中", "公告、文件和评分统一沉淀"],
          ].map(([title, desc]) => (
            <Card
              key={title}
              className="!rounded-[24px] !border-white/60 !bg-white/46 shadow-[0_18px_35px_rgba(104,132,148,0.1)]"
            >
              <Typography.Title level={5} className="!mb-2">
                {title}
              </Typography.Title>
              <Typography.Paragraph className="!mb-0 soft-text">
                {desc}
              </Typography.Paragraph>
            </Card>
          ))}
        </div>
      </section>
    </Reveal>
  );
}
