"use client";

import { UserOutlined } from "@ant-design/icons";
import { Card, Space, Typography } from "antd";
import { Reveal } from "@/components/ui/reveal";
import type { ProfileSummary } from "@/lib/dashboard/types";

type ProfilePageClientProps = {
  profile: ProfileSummary;
};

const profileFields: Array<{ label: string; valueKey: keyof Pick<ProfileSummary, "username" | "roleLabel" | "joinedAtLabel"> }> = [
  { label: "账号", valueKey: "username" },
  { label: "角色", valueKey: "roleLabel" },
  { label: "加入时间", valueKey: "joinedAtLabel" },
];

export function ProfilePageClient({ profile }: ProfilePageClientProps) {
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
            <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#d9f1ee] text-[30px] text-[#1d8b80]">
              <UserOutlined />
            </div>
            <div>
              <Typography.Title level={3} className="!mb-0">
                {profile.displayName}
              </Typography.Title>
              <Typography.Text className="soft-text">
                {profile.roleLabel} / {profile.teamLabel}
              </Typography.Text>
            </div>
          </div>

          <div className="grid gap-3">
            {profileFields.map((field) => (
              <div
                key={field.label}
                className="rounded-[22px] border border-white/65 bg-white/42 px-4 py-3"
              >
                <Typography.Text className="block text-xs text-slate-500">
                  {field.label}
                </Typography.Text>
                <Typography.Text className="mt-2 block font-semibold text-slate-800">
                  {profile[field.valueKey]}
                </Typography.Text>
              </div>
            ))}
          </div>
        </Card>
      </Reveal>
    </Space>
  );
}
