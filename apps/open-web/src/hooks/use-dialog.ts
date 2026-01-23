import * as React from 'react';

export function useInputDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [value, setValue] = React.useState('');
  const [resolvePromise, setResolvePromise] = React.useState<((value: string) => void) | null>(null);

  const show = React.useCallback((config: { title: string; defaultValue?: string }): Promise<string> => {
    return new Promise((resolve) => {
      setTitle(config.title);
      setValue(config.defaultValue || '');
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = () => {
    if (resolvePromise) {
      resolvePromise(value);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (resolvePromise) {
      resolvePromise('');
    }
    setIsOpen(false);
  };

  return {
    isOpen,
    title,
    value,
    setValue,
    onValueChange: setValue,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
    show
  };
}

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [title, setTitle] = React.useState('确认操作');
  const [message, setMessage] = React.useState('');
  const [resolvePromise, setResolvePromise] = React.useState<((confirmed: boolean) => void) | null>(null);

  const show = React.useCallback((config: { title?: string; message: string }): Promise<boolean> => {
    return new Promise((resolve) => {
      setTitle(config.title || '确认操作');
      setMessage(config.message);
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = () => {
    if (resolvePromise) {
      resolvePromise(true);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (resolvePromise) {
      resolvePromise(false);
    }
    setIsOpen(false);
  };

  return {
    isOpen,
    title,
    message,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
    show
  };
}
