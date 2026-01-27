import { useState, useRef, useCallback, useEffect } from 'react';

// 文件Tab类型定义
export interface EditorTab {
  id: string;
  title: string;
  content: string;
  isUntitled: boolean;
}

// 编辑器分屏类型
export type SplitMode = 'none' | 'horizontal' | 'vertical';

// 布局状态类型
export interface LayoutState {
  // 侧栏显隐
  leftSidebarVisible: boolean;
  rightSidebarVisible: boolean;
  setLeftSidebarVisible: (visible: boolean) => void;
  setRightSidebarVisible: (visible: boolean) => void;

  // 侧栏宽度
  leftSidebarWidth: number;
  rightSidebarWidth: number;
  setLeftSidebarWidth: (width: number) => void;
  setRightSidebarWidth: (width: number) => void;

  // 编辑器Tabs
  editorTabs: EditorTab[];
  activeTabId: string;
  setActiveTabId: (id: string) => void;

  // 分屏状态
  splitMode: SplitMode;
  splitRatio: number;
  setSplitMode: (mode: SplitMode) => void;
  setSplitRatio: (ratio: number) => void;

  // 操作方法
  handleAddTab: () => void;
  handleCloseTab: (tabId: string, e: React.MouseEvent) => void;
  handleContentChange: (tabId: string, content: string) => void;
  handleOpenFile: () => void;
  handleToggleSplit: (mode: SplitMode) => void;
}

/**
 * 自定义Hook：管理布局状态和交互逻辑
 */
export const useLayoutState = (): LayoutState => {
  // 左侧栏和右侧栏显隐状态
  const [leftSidebarVisible, setLeftSidebarVisible] = useState(true);
  const [rightSidebarVisible, setRightSidebarVisible] = useState(true);

  // 左右侧栏宽度
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(240);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(240);

  // 编辑器Tabs管理
  const [editorTabs, setEditorTabs] = useState<EditorTab[]>([
    {
      id: '1',
      title: '未命名文件',
      content: '',
      isUntitled: true
    }
  ]);
  const [activeTabId, setActiveTabId] = useState('1');

  // 分屏状态
  const [splitMode, setSplitMode] = useState<SplitMode>('none');
  const [splitRatio, setSplitRatio] = useState(50);

  // 文件ID计数器
  const fileIdCounter = useRef(2);

  /**
   * 新增编辑器Tab
   */
  const handleAddTab = useCallback(() => {
    const newTab: EditorTab = {
      id: String(fileIdCounter.current++),
      title: `未命名文件${fileIdCounter.current - 2}`,
      content: '',
      isUntitled: true
    };
    setEditorTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  /**
   * 关闭编辑器Tab
   */
  const handleCloseTab = useCallback(
    (tabId: string, e: React.MouseEvent) => {
      e.stopPropagation();

      // 至少保留一个Tab
      if (editorTabs.length <= 1) {
        return;
      }

      const tabIndex = editorTabs.findIndex((tab) => tab.id === tabId);
      const newTabs = editorTabs.filter((tab) => tab.id !== tabId);

      setEditorTabs(newTabs);

      // 如果关闭的是当前激活的Tab，切换到相邻Tab
      if (activeTabId === tabId) {
        const nextTab = newTabs[tabIndex] || newTabs[tabIndex - 1];
        setActiveTabId(nextTab.id);
      }
    },
    [editorTabs, activeTabId]
  );

  /**
   * 更新编辑器内容
   */
  const handleContentChange = useCallback((tabId: string, content: string) => {
    setEditorTabs((prev) => prev.map((tab) => (tab.id === tabId ? { ...tab, content } : tab)));
  }, []);

  /**
   * 模拟打开文件
   */
  const handleOpenFile = useCallback(() => {
    const fileName = prompt('输入文件名（如index.html、app.js）：');
    if (!fileName) return;

    const newTab: EditorTab = {
      id: String(fileIdCounter.current++),
      title: fileName,
      content: `// ${fileName} 的内容\n`,
      isUntitled: false
    };
    setEditorTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  /**
   * 切换分屏模式
   */
  const handleToggleSplit = useCallback((mode: SplitMode) => {
    setSplitMode((prev) => (prev === mode ? 'none' : mode));
    setSplitRatio(50);
  }, []);

  return {
    leftSidebarVisible,
    rightSidebarVisible,
    setLeftSidebarVisible,
    setRightSidebarVisible,
    leftSidebarWidth,
    rightSidebarWidth,
    setLeftSidebarWidth,
    setRightSidebarWidth,
    editorTabs,
    activeTabId,
    setActiveTabId,
    splitMode,
    splitRatio,
    setSplitMode,
    setSplitRatio,
    handleAddTab,
    handleCloseTab,
    handleContentChange,
    handleOpenFile,
    handleToggleSplit
  };
};

/**
 * 自定义Hook：处理拖拽逻辑
 */
export const useDragResize = () => {
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  const dragCallbacksRef = useRef<{
    onLeftDrag?: (e: MouseEvent) => void;
    onRightDrag?: (e: MouseEvent) => void;
    onSplitDrag?: (e: MouseEvent) => void;
  }>({});

  // 监听全局拖拽事件
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft && dragCallbacksRef.current.onLeftDrag) {
        dragCallbacksRef.current.onLeftDrag(e);
      }
      if (isDraggingRight && dragCallbacksRef.current.onRightDrag) {
        dragCallbacksRef.current.onRightDrag(e);
      }
      if (isDraggingSplit && dragCallbacksRef.current.onSplitDrag) {
        dragCallbacksRef.current.onSplitDrag(e);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
      setIsDraggingSplit(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingLeft, isDraggingRight, isDraggingSplit]);

  return {
    isDraggingLeft,
    isDraggingRight,
    isDraggingSplit,
    setIsDraggingLeft,
    setIsDraggingRight,
    setIsDraggingSplit,
    dragCallbacksRef
  };
};