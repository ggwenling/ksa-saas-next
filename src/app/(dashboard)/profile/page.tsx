"use client";

import { UserOutlined } from "@ant-design/icons";
import { Avatar, Card, Descriptions, Space, Typography } from "antd";
import { Reveal } from "@/components/ui/reveal";

export default function ProfilePage() {
  return (
    <Space orientation="vertical" size={20} className="w-full">
      <Reveal className="glass-panel glass-panel-strong rounded-[34px] px-6 py-6">
        <Typography.Text className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
          Personal Profile
        </Typography.Text>
        <Typography.Title className="!mb-2 !mt-3 !text-3xl">个人中心</Typography.Title>
        <Typography.Paragraph className="!mb-0 max-w-2xl soft-text">
          查看当前账号的基础信息与身份定位，帮助团队内分工和协作角色保持清晰。
        </Typography.Paragraph>
      </Reveal>

      <Reveal delay={0.06}>
        <Card className="glass-panel rounded-[30px] !border-white/70 !bg-white/55">
          <div className="mb-8 flex items-center gap-4">
            <Avatar size={68} icon={<UserOutlined />} className="!bg-[#d9f1ee] !text-[#1d8b80]" />
            <div>
              <Typography.Title level={3} className="!mb-0">
                张三
              </Typography.Title>
              <Typography.Text className="soft-text">队长 / 智创小队</Typography.Text>
            </div>
          </div>

          <Descriptions column={1} bordered>
            <Descriptions.Item label="账号">leader01</Descriptions.Item>
            <Descriptions.Item label="角色">队长</Descriptions.Item>
            <Descriptions.Item label="加入时间">2026-04-10</Descriptions.Item>
          </Descriptions>
        </Card>
      </Reveal>
    </Space>
  );
}
