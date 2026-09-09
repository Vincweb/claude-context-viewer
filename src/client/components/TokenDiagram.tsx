import { useT } from '../i18n'

const TINTS = [
  'bg-accent-soft text-accent',
  'bg-[#e9f0f8] text-[#2f5f9a]',
  'bg-[#e6f1ee] text-[#2f6b5c]',
  'bg-[#f6f0dc] text-[#7a5d0c]',
]

/** How this page counts: the characters of a layer, four at a time. */
const RULER_TEXT = 'context viewer'
const CHARS_PER_TOKEN = 4

/**
 * Two halves. Left, a sentence cut into pieces the way a tokenizer would — an illustrative split,
 * and the text says so. Right, the rule this page actually uses to count: characters over four.
 */
export const TokenDiagram = () => {
  const t = useT()
  const pieces = t.token.pieces
  const sentence = pieces.join('')
  const [piecesCount, forChars] = t.token.piecesFor(pieces.length, sentence.length)
  const groups = Math.ceil(RULER_TEXT.length / CHARS_PER_TOKEN)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div>
        <p className="mb-3 text-[11px] tracking-wide text-faint uppercase">
          {t.token.eyebrowSentence}
        </p>
        <p
          className="flex flex-wrap gap-y-1.5 font-mono text-[13px] leading-none"
          aria-label={sentence}
        >
          {pieces.map((piece, index) => (
            <span
              key={index}
              className={`animate-pop rounded-md px-1.5 py-1.5 ${TINTS[index % TINTS.length]} ${
                piece.startsWith(' ') ? 'ml-1' : ''
              }`}
              style={{ animationDelay: `${200 + index * 55}ms` }}
              aria-hidden
            >
              {piece.replace(/^ /, ' ')}
            </span>
          ))}
        </p>
        <p className="mt-3 text-muted">
          <span className="font-medium text-text">{piecesCount}</span>
          {forChars} {t.token.explain}
        </p>
      </div>

      <div>
        <p className="mb-3 text-[11px] tracking-wide text-faint uppercase">
          {t.token.eyebrowCount}
        </p>
        <div className="font-mono text-[12px]">
          <p className="mb-1 font-sans text-[11px] text-faint">
            {t.token.characters(RULER_TEXT.length)}
          </p>
          <div className="flex gap-[3px]">
            {RULER_TEXT.split('').map((char, index) => (
              <span
                key={index}
                className="animate-pop flex h-7 flex-1 items-center justify-center rounded-[4px] border border-line bg-panel"
                style={{ animationDelay: `${300 + index * 30}ms` }}
              >
                {char === ' ' ? '␣' : char}
              </span>
            ))}
          </div>
          <div className="mt-1.5 flex gap-[3px]">
            {Array.from({ length: groups }, (_, index) => {
              const span = Math.min(CHARS_PER_TOKEN, RULER_TEXT.length - index * CHARS_PER_TOKEN)
              return (
                <span
                  key={index}
                  className="animate-rise flex h-6 items-center justify-center rounded-[4px] bg-clay text-[11px] text-[#faf9f5]"
                  style={{ flexGrow: span, flexBasis: 0, animationDelay: `${700 + index * 90}ms` }}
                >
                  ≈1
                </span>
              )
            })}
          </div>
          <p className="mt-1 font-sans text-[11px] text-faint">{t.token.tokens(groups)}</p>
        </div>
        <p className="mt-3 text-muted">
          <span className="font-medium text-text">{t.token.ruleTitle}</span> {t.token.ruleExplain}
        </p>
      </div>
    </div>
  )
}
