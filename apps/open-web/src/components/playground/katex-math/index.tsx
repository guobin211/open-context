import { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const defaultFormula = String.raw`\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}

E = mc^2

\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}

\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}

\frac{\partial f}{\partial x} = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}`;

export const KatexMath = () => {
  const [formula, setFormula] = useState(defaultFormula);
  const [error, setError] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      try {
        const formulas = formula.split('\n\n').filter((f) => f.trim());
        outputRef.current.innerHTML = formulas
          .map((f) => {
            try {
              return `<div class="mb-4">${katex.renderToString(f.trim(), {
                throwOnError: false,
                displayMode: true
              })}</div>`;
            } catch {
              return `<div class="text-red-500 mb-4">Invalid: ${f}</div>`;
            }
          })
          .join('');
        setError(null);
      } catch (e) {
        setError(String(e));
      }
    }
  }, [formula]);

  return (
    <div className="flex h-full gap-6 p-4">
      <div className="flex w-1/2 flex-col gap-2">
        <Label>LaTeX 公式（用空行分隔多个公式）</Label>
        <Textarea
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          className="flex-1 font-mono text-sm"
          placeholder="输入 LaTeX 公式..."
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <div className="flex w-1/2 flex-col gap-2">
        <Label>渲染结果</Label>
        <div ref={outputRef} className="flex-1 overflow-auto rounded-lg border bg-white p-6" />
      </div>
    </div>
  );
};
