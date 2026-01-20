import { ScrollArea } from '../ui/scroll-area';
import { Logo, NavSection, SpaceTree, NoteTree, FileTree, BottomActions } from '../sidebar';
import { ConversationTree } from '../sidebar/conversation-tree';

export function Sidebar() {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-gray-200 bg-[#F7F7F5]">
      <Logo />
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-2">
          <NavSection title="会话" type="chat">
            <ConversationTree />
          </NavSection>

          <NavSection title="笔记" type="note">
            <NoteTree />
          </NavSection>

          <NavSection title="文件" type="file">
            <FileTree />
          </NavSection>

          <NavSection title="空间" type="space">
            <SpaceTree />
          </NavSection>
        </div>
      </ScrollArea>
      <BottomActions />
    </aside>
  );
}
