import { useState, useRef, useCallback } from 'react';
import Tesseract from 'tesseract.js';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export const OcrViewer = () => {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState('');
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setResult('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRecognize = useCallback(async () => {
    if (!image) return;

    setIsProcessing(true);
    setProgress(0);
    setResult('');

    try {
      const result = await Tesseract.recognize(image, 'chi_sim+eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        }
      });
      setResult(result.data.text);
    } catch (error) {
      setResult(`识别失败: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  }, [image]);

  return (
    <div className="flex h-full gap-6 p-4">
      <div className="flex w-1/2 flex-col gap-4">
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          <Button onClick={() => fileInputRef.current?.click()}>选择图片</Button>
          <Button onClick={handleRecognize} disabled={!image || isProcessing}>
            {isProcessing ? '识别中...' : '开始识别'}
          </Button>
        </div>

        {isProcessing && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-muted-foreground text-sm">识别进度: {progress}%</p>
          </div>
        )}

        {image && (
          <div className="flex-1 overflow-auto rounded-lg border">
            <img src={image} alt="待识别图片" className="max-w-full" />
          </div>
        )}
      </div>

      <div className="flex w-1/2 flex-col gap-2">
        <h3 className="font-medium">识别结果</h3>
        <div className="bg-muted flex-1 overflow-auto rounded-lg border p-4 whitespace-pre-wrap">
          {result || '请选择图片并点击识别'}
        </div>
      </div>
    </div>
  );
};
