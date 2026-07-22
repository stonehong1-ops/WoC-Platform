// 그룹 내부 클래스 등록용 위임 에디터 컴포넌트
"use client";

import React from "react";
import { Group, GroupClass } from "@/types/group";
import ClassAddEditor from "@/components/class/ClassAddEditor";

interface GroupClassAddEditorProps {
  group: Group | null;
  onClose: () => void;
  onSave?: () => void;
  initialData?: GroupClass;
  targetMonth?: string;
  isSpecial?: boolean;
}

const GroupClassAddEditor: React.FC<GroupClassAddEditorProps> = ({
  group,
  onClose,
  onSave,
  initialData,
  targetMonth,
  isSpecial,
}) => {
  return (
    <ClassAddEditor
      group={group}
      onClose={onClose}
      onSave={onSave}
      initialData={initialData}
      targetMonth={targetMonth}
      isSpecial={isSpecial}
      initialType={isSpecial ? "special" : "regular"}
    />
  );
};

export default GroupClassAddEditor;
