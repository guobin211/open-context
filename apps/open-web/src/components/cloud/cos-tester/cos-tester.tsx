import { useState } from 'react';
import { Cloud, Upload, FolderOpen, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import OSS from 'ali-oss';
import COS from 'cos-js-sdk-v5';

interface CosTesterProps {
  className?: string;
}

type CloudProvider = 'aws-s3' | 'ali-oss' | 'tencent-cos';

interface CloudConfig {
  provider: CloudProvider;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint?: string;
}

interface TestResult {
  id: string;
  provider: CloudProvider;
  operation: string;
  status: 'success' | 'error';
  message: string;
  timestamp: Date;
}

export const CosTester = ({ className }: CosTesterProps) => {
  const [config, setConfig] = useState<CloudConfig>({
    provider: 'aws-s3',
    region: '',
    accessKeyId: '',
    secretAccessKey: '',
    bucket: '',
    endpoint: ''
  });

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const addResult = (operation: string, status: 'success' | 'error', message: string) => {
    const result: TestResult = {
      id: `${Date.now()}-${Math.random()}`,
      provider: config.provider,
      operation,
      status,
      message,
      timestamp: new Date()
    };
    setTestResults([result, ...testResults]);
  };

  const validateConfig = (): boolean => {
    if (!config.region || !config.accessKeyId || !config.secretAccessKey || !config.bucket) {
      addResult('配置验证', 'error', '请填写所有必填字段');
      return false;
    }
    return true;
  };

  const testAwsS3Connect = async () => {
    if (!validateConfig()) return;

    setLoading(true);
    try {
      const { S3Client } = await import('@aws-sdk/client-s3');

      const client = new S3Client({
        region: config.region,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey
        }
      });

      const command = new ListObjectsV2Command({
        Bucket: config.bucket,
        MaxKeys: 1
      });

      await client.send(command);
      addResult('连接测试', 'success', 'AWS S3 连接成功');
    } catch (error) {
      addResult('连接测试', 'error', error instanceof Error ? error.message : '连接失败');
    } finally {
      setLoading(false);
    }
  };

  const testAliOssConnect = async () => {
    if (!validateConfig()) return;

    setLoading(true);
    try {
      const client = new OSS({
        region: config.region,
        accessKeyId: config.accessKeyId,
        accessKeySecret: config.secretAccessKey,
        bucket: config.bucket
      });

      await client.list({
        'max-keys': 1
      });
      addResult('连接测试', 'success', '阿里云 OSS 连接成功');
    } catch (error) {
      addResult('连接测试', 'error', error instanceof Error ? error.message : '连接失败');
    } finally {
      setLoading(false);
    }
  };

  const testTencentCosConnect = async () => {
    if (!validateConfig() || !config.endpoint) {
      addResult('配置验证', 'error', '腾讯云 COS 需要填写 Endpoint');
      return;
    }

    setLoading(true);
    try {
      const client = new COS({
        SecretId: config.accessKeyId,
        SecretKey: config.secretAccessKey
      });

      await client.getBucket({
        Bucket: config.bucket,
        Region: config.region
      });
      addResult('连接测试', 'success', '腾讯云 COS 连接成功');
    } catch (error) {
      addResult('连接测试', 'error', error instanceof Error ? error.message : '连接失败');
    } finally {
      setLoading(false);
    }
  };

  const testListObjects = async () => {
    if (!validateConfig()) return;

    setLoading(true);
    try {
      if (config.provider === 'aws-s3') {
        const { S3Client } = await import('@aws-sdk/client-s3');
        const client = new S3Client({
          region: config.region,
          credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey
          }
        });
        const command = new ListObjectsV2Command({
          Bucket: config.bucket,
          MaxKeys: 10
        });
        const response = await client.send(command);
        const count = response.Contents?.length || 0;
        addResult('列出对象', 'success', `成功列出 ${count} 个对象`);
      } else if (config.provider === 'ali-oss') {
        const client = new OSS({
          region: config.region,
          accessKeyId: config.accessKeyId,
          accessKeySecret: config.secretAccessKey,
          bucket: config.bucket
        });
        const result = await client.list({
          'max-keys': 10
        });
        const count = result.objects?.length || 0;
        addResult('列出对象', 'success', `成功列出 ${count} 个对象`);
      } else if (config.provider === 'tencent-cos') {
        const client = new COS({
          SecretId: config.accessKeyId,
          SecretKey: config.secretAccessKey
        });
        void client.getBucket({
          Bucket: config.bucket,
          Region: config.region
        });
        addResult('列出对象', 'success', `存储桶存在`);
      }
    } catch (error) {
      addResult('列出对象', 'error', error instanceof Error ? error.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const testUpload = async () => {
    if (!validateConfig() || !uploadFile) {
      addResult('上传测试', 'error', '请选择要上传的文件');
      return;
    }

    setLoading(true);
    try {
      const objectKey = `test-${Date.now()}-${uploadFile.name}`;

      if (config.provider === 'aws-s3') {
        const { S3Client } = await import('@aws-sdk/client-s3');
        const client = new S3Client({
          region: config.region,
          credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey
          }
        });
        const command = new PutObjectCommand({
          Bucket: config.bucket,
          Key: objectKey,
          Body: uploadFile
        });
        await client.send(command);
        addResult('上传文件', 'success', `成功上传 ${uploadFile.name} (${(uploadFile.size / 1024).toFixed(2)} KB)`);
      } else if (config.provider === 'ali-oss') {
        const client = new OSS({
          region: config.region,
          accessKeyId: config.accessKeyId,
          accessKeySecret: config.secretAccessKey,
          bucket: config.bucket
        });
        await client.put(objectKey, uploadFile);
        addResult('上传文件', 'success', `成功上传 ${uploadFile.name} (${(uploadFile.size / 1024).toFixed(2)} KB)`);
      } else if (config.provider === 'tencent-cos') {
        const client = new COS({
          SecretId: config.accessKeyId,
          SecretKey: config.secretAccessKey
        });
        await client.putObject({
          Bucket: config.bucket,
          Region: config.region,
          Key: objectKey,
          Body: uploadFile
        });
        addResult('上传文件', 'success', `成功上传 ${uploadFile.name} (${(uploadFile.size / 1024).toFixed(2)} KB)`);
      }
    } catch (error) {
      addResult('上传文件', 'error', error instanceof Error ? error.message : '上传失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (config.provider === 'aws-s3') {
      await testAwsS3Connect();
    } else if (config.provider === 'ali-oss') {
      await testAliOssConnect();
    } else if (config.provider === 'tencent-cos') {
      await testTencentCosConnect();
    }
  };

  const getProviderName = (provider: CloudProvider): string => {
    switch (provider) {
      case 'aws-s3':
        return 'AWS S3';
      case 'ali-oss':
        return '阿里云 OSS';
      case 'tencent-cos':
        return '腾讯云 COS';
      default:
        return provider;
    }
  };

  const getRegionPlaceholder = (provider: CloudProvider): string => {
    switch (provider) {
      case 'aws-s3':
        return 'us-east-1';
      case 'ali-oss':
        return 'oss-cn-hangzhou';
      case 'tencent-cos':
        return 'ap-guangzhou';
      default:
        return 'region';
    }
  };

  return (
    <div className={cn('flex h-full gap-6', className)}>
      <div className="flex min-w-100 flex-col gap-4">
        <div className="rounded-lg border p-4">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Cloud className="size-5" />
            云存储测试
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-muted-foreground mb-1 block text-sm">云服务商</label>
              <select
                value={config.provider}
                onChange={(e) => setConfig({ ...config, provider: e.target.value as CloudProvider })}
                className="bg-muted w-full rounded-md px-3 py-2 text-sm"
              >
                <option value="aws-s3">AWS S3</option>
                <option value="ali-oss">阿里云 OSS</option>
                <option value="tencent-cos">腾讯云 COS</option>
              </select>
            </div>

            <div>
              <label className="rtext-muted-foreground mb-1 block text-sm">
                Region {config.provider === 'ali-oss' ? '(OSS)' : config.provider === 'tencent-cos' ? '(COS)' : ''}
              </label>
              <input
                type="text"
                value={config.region}
                onChange={(e) => setConfig({ ...config, region: e.target.value })}
                placeholder={getRegionPlaceholder(config.provider)}
                className="bg-muted w-full rounded-md px-3 py-2 text-sm"
              />
            </div>

            {config.provider === 'tencent-cos' && (
              <div>
                <label className="text-muted-foreground mb-1 block text-sm">Endpoint</label>
                <input
                  type="text"
                  value={config.endpoint}
                  onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
                  placeholder="cos.ap-guangzhou.myqcloud.com"
                  className="bg-muted w-full rounded-md px-3 py-2 text-sm"
                />
              </div>
            )}

            <div>
              <label className="text-muted-foreground mb-1 block text-sm">
                Access Key ID {config.provider === 'tencent-cos' ? '(SecretId)' : ''}
              </label>
              <input
                type="password"
                value={config.accessKeyId}
                onChange={(e) => setConfig({ ...config, accessKeyId: e.target.value })}
                placeholder="输入 Access Key ID"
                className="bg-muted w-full rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-muted-foreground mb-1 block text-sm">
                Secret Access Key{' '}
                {config.provider === 'tencent-cos'
                  ? '(SecretKey)'
                  : config.provider === 'ali-oss'
                    ? '(AccessKeySecret)'
                    : ''}
              </label>
              <input
                type="password"
                value={config.secretAccessKey}
                onChange={(e) => setConfig({ ...config, secretAccessKey: e.target.value })}
                placeholder="输入 Secret Access Key"
                className="bg-muted w-full rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-muted-foreground mb-1 block text-sm">Bucket / 存储桶</label>
              <input
                type="text"
                value={config.bucket}
                onChange={(e) => setConfig({ ...config, bucket: e.target.value })}
                placeholder="my-bucket"
                className="bg-muted w-full rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-muted-foreground mb-1 block text-sm">上传测试文件</label>
              <input
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="bg-muted w-full rounded-md px-3 py-2 text-sm"
              />
              {uploadFile && (
                <p className="text-muted-foreground mt-1 text-xs">
                  已选择: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={handleConnect}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="size-4" />
              测试连接
            </button>

            <button
              onClick={testListObjects}
              disabled={loading}
              className="bg-muted hover:bg-muted/80 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm transition-colors disabled:opacity-50"
            >
              <FolderOpen className="size-4" />
              列出对象
            </button>

            <button
              onClick={testUpload}
              disabled={loading}
              className="bg-muted hover:bg-muted/80 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm transition-colors disabled:opacity-50"
            >
              <Upload className="size-4" />
              上传文件
            </button>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-semibold">支持的云服务商</h3>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
            <li>
              <strong>AWS S3</strong>: Amazon Simple Storage Service
            </li>
            <li>
              <strong>阿里云 OSS</strong>: 阿里云对象存储服务
            </li>
            <li>
              <strong>腾讯云 COS</strong>: 腾讯云对象存储服务
            </li>
          </ul>

          <h3 className="mt-4 mb-2 font-semibold">注意事项</h3>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
            <li>凭证信息仅在本地使用，不会上传到服务器</li>
            <li>上传的文件会以 test- 前缀命名</li>
            <li>请确保存储桶权限配置正确</li>
            <li>建议使用临时访问凭证而非长期密钥</li>
          </ul>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <div className="bg-card rounded-lg border p-4">
          <h3 className="mb-3 flex items-center gap-2 font-semibold">
            <AlertCircle className="size-5" />
            测试结果
            {testResults.length > 0 && <span className="text-muted-foreground text-sm">({testResults.length})</span>}
          </h3>

          <div className="overflow-auto">
            {testResults.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground text-sm">暂无测试结果</p>
                <p className="text-muted-foreground mt-1 text-xs">请填写配置信息后点击"测试连接"</p>
              </div>
            ) : (
              <div className="space-y-2">
                {testResults.map((result) => (
                  <div
                    key={result.id}
                    className={cn(
                      'rounded-md border p-3',
                      result.status === 'success'
                        ? 'border-green-600 bg-green-600/5'
                        : 'border-destructive bg-destructive/5'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-sm font-medium">{result.operation}</span>
                          <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
                            {getProviderName(result.provider)}
                          </span>
                        </div>
                        <p
                          className={cn('text-sm', result.status === 'success' ? 'text-green-700' : 'text-destructive')}
                        >
                          {result.message}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">{result.timestamp.toLocaleString('zh-CN')}</p>
                      </div>
                      {result.status === 'success' ? (
                        <CheckCircle2 className="size-5 shrink-0 text-green-600" />
                      ) : (
                        <XCircle className="text-destructive size-5 shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="bg-muted bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center">
            <div className="text-center">
              <div className="border-primary mx-auto mb-3 size-8 animate-spin rounded-full border-4 border-t-transparent" />
              <p className="text-foreground font-medium">正在测试...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
