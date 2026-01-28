import { memo, useMemo } from 'react';
import MarkdownIt from 'markdown-it';
// @ts-ignore
import MarkdownItAbbr from 'markdown-it-abbr';
// @ts-ignore
import MarkdownItContainer from 'markdown-it-container';
// @ts-ignore
import MarkdownItEmoji from 'markdown-it-emoji';
// @ts-ignore
import MarkdownItMark from 'markdown-it-mark';
// @ts-ignore
import MarkdownItSub from 'markdown-it-sub';
// @ts-ignore
import MarkdownItSup from 'markdown-it-sup';
import MarkdownItMultimdTable from 'markdown-it-multimd-table';
import * as MarkdownItGithubAlerts from 'markdown-it-github-alerts';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Markdown 渲染器组件,使用 markdown-it 渲染 Markdown
 */
export const MarkdownRenderer = memo(({ content, className }: MarkdownRendererProps) => {
  const md = useMemo(() => {
    return new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      breaks: true
    })
      .use(MarkdownItAbbr)
      .use(MarkdownItContainer, 'warning')
      .use(MarkdownItContainer, 'info')
      .use(MarkdownItContainer, 'tip')
      .use(MarkdownItEmoji)
      .use(MarkdownItMark)
      .use(MarkdownItSub)
      .use(MarkdownItSup)
      .use(MarkdownItMultimdTable, {
        multiline: true,
        rowspan: true,
        headerless: true
      })
      .use(MarkdownItGithubAlerts);
  }, []);

  const html = useMemo(() => {
    const rendered = md.render(content);
    return DOMPurify.sanitize(rendered);
  }, [md, content]);

  return (
    <div className={cn('prose prose-gray max-w-none p-4', className)} dangerouslySetInnerHTML={{ __html: html }} />
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';
