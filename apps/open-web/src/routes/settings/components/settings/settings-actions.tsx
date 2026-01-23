import { Button } from '../../../../components/ui/button';

interface SettingsActionsProps {
  onReset?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  resetDisabled?: boolean;
  importDisabled?: boolean;
  exportDisabled?: boolean;
}

export const SettingsActions = ({
  onReset,
  onImport,
  onExport,
  resetDisabled,
  importDisabled,
  exportDisabled
}: SettingsActionsProps) => {
  return (
    <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
      {onReset && (
        <Button variant="outline" onClick={onReset} disabled={resetDisabled}>
          重置为默认
        </Button>
      )}
      {onImport && (
        <Button variant="outline" onClick={onImport} disabled={importDisabled}>
          导入配置
        </Button>
      )}
      {onExport && (
        <Button onClick={onExport} disabled={exportDisabled}>
          导出配置
        </Button>
      )}
    </div>
  );
};
