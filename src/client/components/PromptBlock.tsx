import { useRef } from 'react'
import { CopyButton } from './ui'

/**
 * A prompt to take away: a bar naming it with the copy button, then the text itself. One block
 * rather than a loose label, a loose button and a loose field, so the button has room of its own
 * and cannot end up sitting on the edge of the text.
 *
 * The field is read-only and selects itself on focus, which is also the fallback when the
 * clipboard is refused: the text is already selected, so a keyboard copy still works.
 */
export const PromptBlock = ({
  label,
  text,
  copy,
  copied,
  rows = 14,
}: {
  label: string
  text: string
  copy: string
  copied: string
  rows?: number
}) => {
  const area = useRef<HTMLTextAreaElement>(null)

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-code-bg px-3 py-2">
        <span className="text-[11px] tracking-wide text-faint uppercase">{label}</span>
        <CopyButton
          text={text}
          label={copy}
          done={copied}
          onRefused={() => area.current?.select()}
        />
      </div>
      <textarea
        ref={area}
        readOnly
        value={text}
        rows={rows}
        spellCheck={false}
        onFocus={(event) => event.currentTarget.select()}
        className="block w-full resize-y bg-panel px-3 py-2.5 font-mono text-[12px] leading-relaxed outline-none"
      />
    </div>
  )
}
