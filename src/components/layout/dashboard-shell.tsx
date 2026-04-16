"use client";

import {
  AuditOutlined,
  FolderOpenOutlined,
  LogoutOutlined,
  NotificationOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { App, Button, Layout, Menu, Typography } from "antd";
import type { ItemType } from "antd/es/menu/interface";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Reveal } from "@/components/ui/reveal";

const menuItems: ItemType[] = [
  { key: "/teams", icon: <TeamOutlined />, label: "团队管理" },
  { key: "/teacher/scores", icon: <AuditOutlined />, label: "老师评分" },
  { key: "/announcements", icon: <NotificationOutlined />, label: "公告中心" },
  { key: "/files", icon: <FolderOpenOutlined />, label: "文件管理" },
  { key: "/profile", icon: <UserOutlined />, label: "个人中心" },
];

type LogoutResult = {
  type: "success" | "error";
  message: string;
  shouldRedirect: boolean;
};

export function getDashboardSelectedKey(pathname: string): string[] {
  if (pathname === "/files") {
    return ["/files"];
  }

  const matched = menuItems.find((item) => {
    const key = String(item?.key);
    return pathname === key || pathname.startsWith(`${key}/`);
  });

  return matched ? [String(matched.key)] : ["/teams"];
}

export function getLogoutResult(ok: boolean): LogoutResult {
  if (ok) {
    return {
      type: "success",
      message: "已退出登录",
      shouldRedirect: true,
    };
  }

  return {
    type: "error",
    message: "退出失败，请稍后重试",
    shouldRedirect: false,
  };
}

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { message } = App.useApp();

  const selectedKey = useMemo(() => getDashboardSelectedKey(pathname), [pathname]);

  return (
    <Layout className="min-h-screen bg-transparent">
      <Layout.Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={288}
        theme="light"
        className="!bg-transparent p-4"
      >
        <Reveal className="h-full">
          <div className="glass-panel glass-panel-strong glass-panel-premium flex h-[800px] min-h-[800px] flex-col rounded-[36px] p-5">
            <div className="mb-5 rounded-[26px] bg-white/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
              <Typography.Text className="block text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                KAS Platform
              </Typography.Text>
              <Typography.Title level={4} className="!mb-0 !mt-2">
                协作平台
              </Typography.Title>
              <Typography.Paragraph className="!mb-0 !mt-2 soft-text">
                课程小组协作、任务推进与成果沉淀
              </Typography.Paragraph>
            </div>

            <div className="flex-1 rounded-[26px] border border-white/65 bg-white/30 p-2">
              <Menu
                mode="inline"
                selectedKeys={selectedKey}
                items={menuItems}
                onClick={({ key }) => router.push(String(key))}
                className="!h-full !border-none !bg-transparent [&_.ant-menu-item]:!my-1.5 [&_.ant-menu-item]:!h-12 [&_.ant-menu-item]:!leading-[48px]"
              />
            </div>

            {!collapsed ? (
              <div className="mt-4 rounded-[22px] border border-white/70 bg-white/40 px-4 py-3">
                <Typography.Text className="block text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                  Navigation
                </Typography.Text>
                <Typography.Text className="mt-1 block text-sm text-slate-600">
              
                </Typography.Text>
              </div>
            ) : null}
          </div>
        </Reveal>
      </Layout.Sider>

      <Layout className="bg-transparent p-4 pl-0">
        <Reveal delay={0.06}>
                     <Layout.Header className="glass-panel glass-panel-strong glass-panel-premium mb-4 !h-auto !min-h-0 rounded-[34px] !bg-transparent !p-0 !leading-normal">
            <div className="page-shell">
              <div className="w-full rounded-[26px]   px-2 py-4 ">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <Typography.Text className="block text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                      Liquid Workspace
                    </Typography.Text>
                    <Typography.Title level={4} className="!mb-0 !mt-1">
                      大学生创业实践课程协作系统
                    </Typography.Title>
                    <Typography.Paragraph className="!mb-0 !mt-1 soft-text">
                      任务协作、看板推进、成果沉淀
                    </Typography.Paragraph>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="hidden rounded-2xl border border-white/70 bg-white/50 px-3 py-2 md:block">
                      <Typography.Text className="text-xs font-medium text-slate-600">
                        控制台在线
                      </Typography.Text>
                    </div>

                    <Button
                      size="large"
                      icon={<LogoutOutlined />}
                      className="!h-11 !rounded-2xl !border-white/70 !bg-white/75 !px-5 !shadow-none"
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/auth/logout", { method: "POST" });
                          const result = getLogoutResult(res.ok);

                          if (result.type === "success") {
                            message.success(result.message);
                          } else {
                            message.error(result.message);
                          }

                          if (result.shouldRedirect) {
                            router.push("/login");
                          }
                        } catch {
                          message.error("退出失败，请稍后重试");
                        }
                      }}
                    >
                      退出
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Layout.Header>
        </Reveal>

        <Layout.Content className="bg-transparent">
          <div className="page-shell">
            <Reveal delay={0.12}>{children}</Reveal>
          </div>
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
