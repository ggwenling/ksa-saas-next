"use client";

import { App, ConfigProvider, theme } from "antd";
import zhCN from "antd/locale/zh_CN";

type AppProviderProps = {
  children: React.ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#1d8b80",
          colorInfo: "#1d8b80",
          colorSuccess: "#3aa17f",
          colorWarning: "#d2a35b",
          colorText: "#13232b",
          colorTextSecondary: "rgba(40, 66, 79, 0.7)",
          colorBorder: "rgba(129, 157, 170, 0.18)",
          colorBgBase: "#f4f8fa",
          colorBgContainer: "rgba(255,255,255,0.62)",
          colorBgElevated: "rgba(255,255,255,0.8)",
          borderRadius: 24,
          borderRadiusLG: 28,
          borderRadiusSM: 18,
          boxShadow:
            "0 22px 72px rgba(98, 126, 143, 0.14), 0 3px 14px rgba(255,255,255,0.4) inset",
          fontFamily:
            '"Alibaba PuHuiTi", "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif',
        },
        components: {
          Layout: {
            siderBg: "rgba(255,255,255,0.46)",
            headerBg: "rgba(255,255,255,0.46)",
            bodyBg: "transparent",
            triggerBg: "rgba(255,255,255,0.32)",
            triggerColor: "#23414f",
          },
          Menu: {
            itemBg: "transparent",
            itemColor: "rgba(25, 53, 64, 0.78)",
            itemBorderRadius: 18,
            itemSelectedBg: "rgba(255,255,255,0.66)",
            itemSelectedColor: "#134d58",
            itemHoverBg: "rgba(255,255,255,0.42)",
          },
          Card: {
            colorBgContainer: "rgba(255,255,255,0.56)",
            headerBg: "transparent",
          },
          Button: {
            borderRadius: 16,
            defaultBorderColor: "rgba(139, 166, 179, 0.28)",
            defaultBg: "rgba(255,255,255,0.52)",
            defaultColor: "#17343f",
            primaryShadow: "0 18px 36px rgba(29, 139, 128, 0.24)",
          },
          Input: {
            activeBg: "rgba(255,255,255,0.72)",
            hoverBg: "rgba(255,255,255,0.72)",
            activeBorderColor: "rgba(29, 139, 128, 0.45)",
          },
          Select: {
            optionSelectedBg: "rgba(29, 139, 128, 0.12)",
          },
          Modal: {
            contentBg: "rgba(255,255,255,0.82)",
            headerBg: "transparent",
          },
          Table: {
            headerBg: "rgba(255,255,255,0.32)",
            headerColor: "#17343f",
            rowHoverBg: "rgba(255,255,255,0.42)",
            borderColor: "rgba(129,157,170,0.18)",
          },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
