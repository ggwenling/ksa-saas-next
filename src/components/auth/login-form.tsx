"use client";

import { ArrowRightOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Reveal } from "@/components/ui/reveal";

type LoginResponse = {
  message: string;
  data?: {
    role: "LEADER" | "MEMBER" | "TEACHER";
  };
};

export function LoginForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <Reveal className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]" y={22}>
      <section className="glass-panel glass-panel-strong glass-panel-premium liquid-grid rounded-[38px] p-8 lg:p-12">
        <Typography.Text className="text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-500">
          Liquid Collaboration
        </Typography.Text>
        <Typography.Title className="!mb-3 !mt-6 !text-4xl !leading-[1.08] lg:!text-[56px]">
          让课程小组像真正的项目团队一样协作
        </Typography.Title>
        <Typography.Paragraph className="max-w-xl !text-base !leading-8 soft-text">
          在同一套空间里完成组队、任务推进、资料共享、公告同步和老师评分。所有信息都沉淀在统一的玻璃工作台中，清晰、轻盈、现代。
        </Typography.Paragraph>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            ["任务看板", "从待处理到完成，进度一眼可见"],
            ["公告中心", "关键安排统一发布，减少群消息遗漏"],
            ["文件共享", "文档、图片、路演材料集中存储"],
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

      <Card className="glass-panel glass-panel-strong glass-panel-premium rounded-[34px] !border-white/70 px-2 py-3 shadow-[0_18px_34px_rgba(104,132,148,0.12)]">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white/70 text-lg text-[#1d8b80]">
            <SafetyCertificateOutlined />
          </div>
          <div>
            <Typography.Title level={3} className="!mb-0">
              欢迎回来
            </Typography.Title>
            <Typography.Text className="soft-text">
              使用账号密码进入你的液态协作工作台
            </Typography.Text>
          </div>
        </div>

        {error ? <Alert type="error" className="mb-4 rounded-2xl" title={error} /> : null}

        <Form
          layout="vertical"
          onFinish={async (values: { username: string; password: string }) => {
            setPending(true);
            setError(null);
            try {
              const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
              });
              const data = (await res.json()) as LoginResponse;
              if (!res.ok) {
                setError(data.message ?? "登录失败，请重试");
                return;
              }
              if (data.data?.role === "TEACHER") {
                router.push("/teacher/scores");
                return;
              }
              router.push("/teams");
            } catch {
              setError("网络异常，请稍后重试");
            } finally {
              setPending(false);
            }
          }}
        >
          <Form.Item
            label="账号"
            name="username"
            rules={[{ required: true, message: "请输入账号" }]}
          >
            <Input
              size="large"
              autoComplete="username"
              placeholder="例如：leader01"
              className="!rounded-2xl !bg-white/68"
            />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password
              size="large"
              autoComplete="current-password"
              placeholder="请输入密码"
              className="!rounded-2xl !bg-white/68"
            />
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
            进入平台
          </Button>
        </Form>

        <Typography.Paragraph className="!mb-0 !mt-6 text-center soft-text">
          还没有账号？<Link href="/register">立即创建</Link>
        </Typography.Paragraph>
      </Card>
    </Reveal>
  );
}
