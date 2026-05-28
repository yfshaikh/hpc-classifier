interface Props {
  code: string
  caption?: string
  lang?: string
}

/* Lightweight token-ish highlighter — tints comments, strings, numbers,
   and a small set of keywords across Python/C/shell. */
function highlight(line: string, lang: string) {
  const commentToken =
    lang === 'python' || lang === 'shell' || lang === 'bash' || lang === 'perf'
      ? /(#(?!define|ifdef|include|endif|!\/))/
      : lang === 'c' || lang === 'cpp'
        ? /(\/\/|\/\*)/
        : /(\/\/|#(?!define|ifdef|include|endif))/

  const commentIdx = line.search(commentToken)
  let comment = ''
  let codePart = line
  if (commentIdx >= 0) {
    comment = line.slice(commentIdx)
    codePart = line.slice(0, commentIdx)
  }

  const keywordSet =
    lang === 'python'
      ? /\b(?:def|import|from|return|class|for|in|if|elif|else|while|with|as|try|except|finally|raise|yield|pass|break|continue|lambda|None|True|False|self|np|plt|nonlocal|global)\b/
      : lang === 'c' || lang === 'cpp'
        ? /\b(?:int|int8_t|int16_t|int32_t|int64_t|uint8_t|uint16_t|uint32_t|uint64_t|float|double|char|void|short|long|signed|unsigned|const|static|struct|typedef|return|if|else|for|while|do|switch|case|break|continue|sizeof|extern|volatile|inline|enum|union|#define|#include|#ifdef|#endif|#ifndef|#else)\b/
        : /\b(?:sudo|perf|stat|record|report|chmod|chown|mkdir|cd|cp|mv|rm|ls|cat|grep|find|export|echo|source|sh|bash|python|python3|pip|npm|git|make|gcc|arm-none-eabi-gcc|openocd|st-link)\b/

  const re = new RegExp(
    `("[^"]*"|'[^']*'|0x[0-9A-Fa-f]+|\\b\\d+(?:\\.\\d+)?\\b|${keywordSet.source.slice(2, -2)})`,
    'g',
  )

  const parts: { t: string; c: string }[] = []
  let last = 0
  for (const m of codePart.matchAll(re)) {
    const idx = m.index ?? 0
    if (idx > last) parts.push({ t: codePart.slice(last, idx), c: 'text-ink/80' })
    const tok = m[0]
    let cls = 'text-ink/80'
    if (/^0x/.test(tok)) cls = 'text-warn-bright'
    else if (/^["']/.test(tok)) cls = 'text-go'
    else if (/^\d+(\.\d+)?$/.test(tok)) cls = 'text-warn'
    else cls = 'text-data-bright'
    parts.push({ t: tok, c: cls })
    last = idx + tok.length
  }
  if (last < codePart.length) parts.push({ t: codePart.slice(last), c: 'text-ink/80' })
  return (
    <>
      {parts.map((p, i) => (
        <span key={i} className={p.c}>
          {p.t}
        </span>
      ))}
      {comment && <span className="text-faint italic">{comment}</span>}
    </>
  )
}

export function CodeBlock({ code, caption, lang = 'shell' }: Props) {
  const lines = code.replace(/\n$/, '').split('\n')
  return (
    <div className="my-5 overflow-hidden rounded-lg border border-line bg-[#0a0d14]">
      <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
        <span className="tag text-faint">{lang}</span>
        {caption && <span className="tag text-muted">{caption}</span>}
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-[13px] leading-6">
        <code className="font-mono">
          {lines.map((ln, i) => (
            <div key={i} className="flex">
              <span
                className="select-none pr-4 text-right text-faint/50"
                style={{ minWidth: '2ch' }}
              >
                {i + 1}
              </span>
              <span className="whitespace-pre">{highlight(ln, lang) || ' '}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  )
}
