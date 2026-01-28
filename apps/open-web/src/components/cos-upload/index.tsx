import { useState, useRef, useCallback } from 'react';
import {
  Button,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui';
import { Upload, Trash2, Copy, Check, Loader2 } from 'lucide-react';

interface UploadResult {
  name: string;
  url: string;
  size: number;
  provider: string;
}

type ProviderType = 'cos' | 'oss' | 's3';

interface ProviderConfig {
  cos: {
    secretId: string;
    secretKey: string;
    bucket: string;
    region: string;
  };
  oss: {
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
    region: string;
  };
  s3: {
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    region: string;
    endpoint?: string;
  };
}

/**
 * 云存储上传组件，支持腾讯云 COS、阿里云 OSS、AWS S3
 */
export const CosUpload = () => {
  const [activeTab, setActiveTab] = useState<ProviderType>('cos');
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState<ProviderConfig>({
    cos: { secretId: '', secretKey: '', bucket: '', region: 'ap-guangzhou' },
    oss: { accessKeyId: '', accessKeySecret: '', bucket: '', region: 'oss-cn-hangzhou' },
    s3: { accessKeyId: '', secretAccessKey: '', bucket: '', region: 'us-east-1', endpoint: '' }
  });

  const updateConfig = <T extends ProviderType>(provider: T, key: keyof ProviderConfig[T], value: string) => {
    setConfig((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], [key]: value }
    }));
  };

  const handleCopy = useCallback(async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  }, []);

  const uploadToCos = async (file: File): Promise<string> => {
    const COS = (await import('cos-js-sdk-v5')).default;
    const cos = new COS({
      SecretId: config.cos.secretId,
      SecretKey: config.cos.secretKey
    });

    return new Promise((resolve, reject) => {
      const key = `uploads/${Date.now()}-${file.name}`;
      cos.uploadFile(
        {
          Bucket: config.cos.bucket,
          Region: config.cos.region,
          Key: key,
          Body: file
        },
        (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(`https://${data.Location}`);
          }
        }
      );
    });
  };

  const uploadToOss = async (file: File): Promise<string> => {
    const OSS = (await import('ali-oss')).default;
    const client = new OSS({
      accessKeyId: config.oss.accessKeyId,
      accessKeySecret: config.oss.accessKeySecret,
      bucket: config.oss.bucket,
      region: config.oss.region
    });

    const key = `uploads/${Date.now()}-${file.name}`;
    const result = await client.put(key, file);
    return result.url;
  };

  const uploadToS3 = async (file: File): Promise<string> => {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const client = new S3Client({
      region: config.s3.region,
      credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey
      },
      ...(config.s3.endpoint && { endpoint: config.s3.endpoint })
    });

    const key = `uploads/${Date.now()}-${file.name}`;
    const arrayBuffer = await file.arrayBuffer();

    await client.send(
      new PutObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
        Body: new Uint8Array(arrayBuffer),
        ContentType: file.type
      })
    );

    const endpoint = config.s3.endpoint || `https://${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com`;
    return `${endpoint}/${key}`;
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const newResults: UploadResult[] = [];

    for (const file of Array.from(files)) {
      try {
        let url: string;
        switch (activeTab) {
          case 'cos':
            url = await uploadToCos(file);
            break;
          case 'oss':
            url = await uploadToOss(file);
            break;
          case 's3':
            url = await uploadToS3(file);
            break;
        }
        newResults.push({
          name: file.name,
          url,
          size: file.size,
          provider: activeTab.toUpperCase()
        });
      } catch (error) {
        console.error(`Upload failed for ${file.name}:`, error);
      }
    }

    setResults((prev) => [...newResults, ...prev]);
    setUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeResult = (url: string) => {
    setResults((prev) => prev.filter((r) => r.url !== url));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProviderType)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cos">腾讯云 COS</TabsTrigger>
          <TabsTrigger value="oss">阿里云 OSS</TabsTrigger>
          <TabsTrigger value="s3">AWS S3</TabsTrigger>
        </TabsList>

        <TabsContent value="cos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">腾讯云 COS 配置</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>SecretId</Label>
                <Input
                  type="password"
                  placeholder="输入 SecretId"
                  value={config.cos.secretId}
                  onChange={(e) => updateConfig('cos', 'secretId', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>SecretKey</Label>
                <Input
                  type="password"
                  placeholder="输入 SecretKey"
                  value={config.cos.secretKey}
                  onChange={(e) => updateConfig('cos', 'secretKey', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Bucket</Label>
                <Input
                  placeholder="输入 Bucket 名称"
                  value={config.cos.bucket}
                  onChange={(e) => updateConfig('cos', 'bucket', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Region</Label>
                <Input
                  placeholder="如 ap-guangzhou"
                  value={config.cos.region}
                  onChange={(e) => updateConfig('cos', 'region', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="oss" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">阿里云 OSS 配置</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>AccessKeyId</Label>
                <Input
                  type="password"
                  placeholder="输入 AccessKeyId"
                  value={config.oss.accessKeyId}
                  onChange={(e) => updateConfig('oss', 'accessKeyId', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>AccessKeySecret</Label>
                <Input
                  type="password"
                  placeholder="输入 AccessKeySecret"
                  value={config.oss.accessKeySecret}
                  onChange={(e) => updateConfig('oss', 'accessKeySecret', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Bucket</Label>
                <Input
                  placeholder="输入 Bucket 名称"
                  value={config.oss.bucket}
                  onChange={(e) => updateConfig('oss', 'bucket', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Region</Label>
                <Input
                  placeholder="如 oss-cn-hangzhou"
                  value={config.oss.region}
                  onChange={(e) => updateConfig('oss', 'region', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="s3" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AWS S3 配置</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>AccessKeyId</Label>
                <Input
                  type="password"
                  placeholder="输入 AccessKeyId"
                  value={config.s3.accessKeyId}
                  onChange={(e) => updateConfig('s3', 'accessKeyId', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>SecretAccessKey</Label>
                <Input
                  type="password"
                  placeholder="输入 SecretAccessKey"
                  value={config.s3.secretAccessKey}
                  onChange={(e) => updateConfig('s3', 'secretAccessKey', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Bucket</Label>
                <Input
                  placeholder="输入 Bucket 名称"
                  value={config.s3.bucket}
                  onChange={(e) => updateConfig('s3', 'bucket', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Region</Label>
                <Input
                  placeholder="如 us-east-1"
                  value={config.s3.region}
                  onChange={(e) => updateConfig('s3', 'region', e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Endpoint（可选，用于兼容 S3 协议的服务）</Label>
                <Input
                  placeholder="如 https://s3.example.com"
                  value={config.s3.endpoint}
                  onChange={(e) => updateConfig('s3', 'endpoint', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? '上传中...' : '选择文件上传'}
        </Button>
      </div>

      {results.length > 0 && (
        <Card className="flex-1 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">上传结果</CardTitle>
          </CardHeader>
          <CardContent className="max-h-100 overflow-auto">
            <div className="space-y-2">
              {results.map((result) => (
                <div key={result.url} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-muted rounded px-1.5 py-0.5 text-xs font-medium">{result.provider}</span>
                      <span className="truncate text-sm font-medium">{result.name}</span>
                      <span className="text-muted-foreground text-xs">{formatSize(result.size)}</span>
                    </div>
                    <p className="text-muted-foreground mt-1 truncate text-xs">{result.url}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(result.url)}>
                      {copiedUrl === result.url ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive h-8 w-8"
                      onClick={() => removeResult(result.url)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
