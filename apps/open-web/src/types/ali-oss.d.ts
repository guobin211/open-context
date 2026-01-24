declare module 'ali-oss' {
  import type { ClientOptions } from './client';

  export default class OSS {
    constructor(options: ClientOptions);

    put(name: string, file: File | Blob | string, options?: any): Promise<any>;

    list(options?: any): Promise<{
      objects?: any[];
      prefixes?: any[];
      isTruncated: boolean;
      nextMarker?: string;
      commonPrefixes?: any[];
    }>;

    get(name: string, options?: any): Promise<any>;

    delete(name: string, options?: any): Promise<any>;

    copy(name: string, sourceName: string, options?: any): Promise<any>;

    signatureUrl(name: string, options?: any): string;
  }
}
