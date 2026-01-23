import { MoreHorizontal } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { NavSection, NoteTree, FileTree, SpaceTree } from '../sidebar';
import { ConversationTree } from '../sidebar/conversation-tree';
import { HEADER_HEIGHT } from './constants';

export const Sidebar = () => {
  return (
    <aside className="flex h-full w-52 flex-col border-r border-gray-200 bg-[#F7F7F5]">
      {/* 顶部标题 */}
      <div className={`flex ${HEADER_HEIGHT} items-center justify-between border-b border-gray-200 px-3`}>
        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">Agent</span>
        <button className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1 p-2">
          <NavSection title="CONVERSATIONS" type="chat" defaultExpanded>
            <ConversationTree />
          </NavSection>
          <NavSection title="NOTES" type="note" defaultExpanded>
            <NoteTree />
          </NavSection>
          <NavSection title="RESOURCES" type="file" defaultExpanded>
            <FileTree />
          </NavSection>
          <NavSection title="WORKSPACE" type="file" defaultExpanded>
            <SpaceTree />
          </NavSection>
        </div>
      </ScrollArea>
    </aside>
  );
};
