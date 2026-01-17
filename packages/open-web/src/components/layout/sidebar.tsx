import { ScrollArea } from '@/components/ui/scroll-area';
import { Logo, SearchInput, NavSection, SpaceTree, NoteTree, FileTree, BottomActions } from '@/components/sidebar';

export function Sidebar() {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-gray-200 bg-[#F7F7F5]">
      <Logo />
      <SearchInput />

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-4">
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
