import { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const QrcodeGenerator = () => {
  const [text, setText] = useState('https://example.com');
  const [size, setSize] = useState(256);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && text) {
      QRCode.toCanvas(canvasRef.current, text, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }).catch(console.error);
    }
  }, [text, size]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = 'qrcode.png';
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="flex h-full gap-6 p-4">
      <div className="flex w-80 flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="qr-text">内容</Label>
          <Input
            id="qr-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入要生成二维码的内容"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="qr-size">尺寸: {size}px</Label>
          <Input
            id="qr-size"
            type="range"
            min={128}
            max={512}
            step={32}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
        </div>

        <Button onClick={handleDownload}>下载二维码</Button>
      </div>

      <div className="flex flex-1 items-center justify-center rounded-lg border bg-white">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};
