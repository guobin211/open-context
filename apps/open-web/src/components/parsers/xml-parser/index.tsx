import { useState } from 'react';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const defaultXml = `<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="fiction">
    <title lang="en">Harry Potter</title>
    <author>J.K. Rowling</author>
    <year>2005</year>
    <price>29.99</price>
  </book>
  <book category="non-fiction">
    <title lang="en">Learning XML</title>
    <author>Erik T. Ray</author>
    <year>2003</year>
    <price>39.95</price>
  </book>
</bookstore>`;

export const XmlParser = () => {
  const [xml, setXml] = useState(defaultXml);
  const [json, setJson] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleParse = () => {
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_'
      });
      const result = parser.parse(xml);
      setJson(JSON.stringify(result, null, 2));
      setError(null);
    } catch (e) {
      setError(`解析错误: ${e}`);
      setJson('');
    }
  };

  const handleBuild = () => {
    try {
      const obj = JSON.parse(json);
      const builder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        format: true
      });
      const result = builder.build(obj);
      setXml(result);
      setError(null);
    } catch (e) {
      setError(`构建错误: ${e}`);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex gap-2">
        <Button onClick={handleParse}>XML → JSON</Button>
        <Button onClick={handleBuild} variant="outline">
          JSON → XML
        </Button>
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>

      <div className="flex flex-1 gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <Label>XML</Label>
          <Textarea
            value={xml}
            onChange={(e) => setXml(e.target.value)}
            className="flex-1 font-mono text-sm"
            placeholder="输入 XML..."
          />
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <Label>JSON</Label>
          <Textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            className="flex-1 font-mono text-sm"
            placeholder="解析后的 JSON..."
          />
        </div>
      </div>
    </div>
  );
};
