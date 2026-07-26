"use client";

import React from "react";
import { Capacitor } from "@capacitor/core";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: string;
}

export interface DetailTabBarProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onTabChange: (id: T) => void;
  isStuck?: boolean;
}

export default function DetailTabBar<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  isStuck = false,
}: DetailTabBarProps<T>) {
  const TabBarContent = () => (
    <div className="flex bg-white border-b border-[#e0e4e5] w-full">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold tracking-wide transition-all border-b-2 ${
              isActive
                ? "text-primary border-primary"
                : "text-[#acb3b4] border-transparent hover:text-[#596061]"
            }`}
          >
            {tab.icon && (
              <span
                className="material-symbols-rounded text-base"
                style={{
                  fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                {tab.icon}
              </span>
            )}
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  if (isStuck) {
    return (
      <div
        className="fixed left-0 right-0 z-40 bg-white"
        style={{
          top: Capacitor.isNativePlatform()
            ? "calc(56px + env(safe-area-inset-top, 0px))"
            : "56px",
        }}
      >
        <TabBarContent />
      </div>
    );
  }

  return <TabBarContent />;
}
