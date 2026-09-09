import type { FixContext } from '../fixPrompt'
import type { DeleteContext } from '../deletePrompt'

/**
 * Every word the page shows, in English. The French file mirrors this object key for key — the
 * type check is what keeps the two in step. Strings that need a number or a name are functions.
 */
export const en = {
  locale: 'en-GB',

  titles: {
    welcome: 'claude-context — every layer a session loads',
    projects: 'Projects — claude-context',
    project: 'Project — claude-context',
    session: 'Session layers — claude-context',
  },

  header: {
    project: 'project',
    changeFolder: 'change folder',
  },

  footer: {
    license: 'MIT licence',
    author: 'by Vincent Caudron',
    language: 'Language',
    localOnly: 'reads your transcripts locally, writes nothing',
  },

  viewer: { label: 'View', rendered: 'Rendered', source: 'Source' },

  link: {
    title: 'Linked file',
    open: 'Follow links to files on disk',
    back: 'Back',
    at: 'at',
    anchor: (fragment: string) => `the link pointed at #${fragment}; the whole file is shown`,
    missing: 'Nothing on disk at that path. The link is stale, or the file was renamed.',
    binary: 'Not text — nothing useful to show here.',
    'too-large': 'Larger than 256 kB, so it is not read.',
    unreadable: 'That path could not be read.',
    directory: (n: number) => `A directory — ${n} entries. Pick one to read it.`,
    empty: 'An empty directory.',
    external: 'opens in a new tab',
  },

  ui: {
    reading: (what: string) => `Reading ${what}…`,
    couldNotRead: 'Could not read that.',
    worktree: 'worktree',
    backToProjects: 'All projects in this folder',
    backToProject: 'Back to this project',
    backToPicker: 'Choose another Claude folder',
  },

  format: { daysAgo: (n: number) => `${n}d ago` },

  groups: {
    system: {
      title: 'System prompt',
      short: 'System prompt',
      hint: 'Who Claude is told it is. The same for every session on this client and model.',
    },
    instructions: {
      title: 'Your instructions',
      short: 'Your instructions',
      hint: 'CLAUDE.md files and the auto-memory index — the part you control.',
    },
    capabilities: {
      title: 'What it can reach for',
      short: 'Capabilities',
      hint: 'Tool names, skills, MCP servers and sub-agents. Usually the heaviest layer.',
    },
    session: {
      title: 'This session',
      short: 'This session',
      hint: 'Model, environment, output style and the per-turn reminders.',
    },
    runtime: {
      title: 'Pulled in while working',
      short: 'While working',
      hint: 'Files read and edited, directory listings, plans, queued prompts. Where the context goes.',
    },
  },

  welcome: {
    tagline:
      'Every Claude Code session opens with a stack of context you never see: a system prompt, the CLAUDE.md files it found, your auto-memory index, the tools and skills on offer. This reads the transcripts on disk and lays that stack out — per project, per session, layer by layer, down to the exact text.',
    chooseFolder: 'choose a Claude folder',
    loadingHomes: 'the Claude folders on this machine',
    default: 'default',
    projectFolders: 'project folders',
    withMemory: (n: number, when: string) => `${n} with memory · last active ${when}`,
    orName: 'Or name another folder',
    placeholder: '~/.claude-work',
    checking: 'Checking…',
    open: 'Open',
    refused: 'that folder was refused',
    privacy:
      'Everything stays on this machine: the server binds to localhost, writes nothing, and refuses requests from other pages.',
    threeThings: 'three things worth knowing',
    threeThingsIntro:
      'The numbers on the pages that follow make more sense with a picture of what they measure: how the prompt is put together, what a conversation does to it, and what a token is.',
    lesson1: {
      title: 'The system prompt is a stack, sent once',
      p1: 'Before your first message leaves, Claude Code assembles one long text and puts it ahead of it: who the model is and how it should behave, then the instructions it found on disk, then the names of everything it can reach for, then the facts of this session.',
      p2a: 'You write one of those layers — ',
      p2b: ' and the memory index. The rest is fixed by the client, the model and the tools you have connected, and it is usually the heaviest part.',
    },
    lesson2: {
      title: 'A conversation is a box that fills up',
      p1: 'The model has no memory between turns. Each time you send a message, the whole conversation is sent again — the startup stack, everything you said, everything Claude answered, every file it read along the way. That is the context window, and it is finite.',
      p2: 'As it fills, the room left for a reply shrinks. When it gets tight, Claude Code folds the older turns into a summary and continues from there. The startup stack never leaves: it is paid on every single turn, which is why its size is worth knowing.',
    },
    lesson3: {
      title: 'A token is a piece of text, not a word',
      p1: 'Models read and write in tokens — chunks of a few characters that the tokenizer learned from frequency. Common words are one token; rare words, names and code break into several. Everything a window holds, and everything you pay for, is counted in them.',
    },
  },

  stack: {
    eyebrow: 'what one session carries, top to bottom',
    hints: {
      system: 'set by the client and the model',
      instructions: 'CLAUDE.md + memory index',
      capabilities: 'tools, skills, MCP, sub-agents',
      session: 'model, cwd, output style',
      runtime: 'files read & edited, growing',
    },
    caption1: 'assembled once, sent as one text',
    caption2: 'ahead of your first message — before a word is typed',
    aria: 'Five layers read top to bottom: the system prompt, then your instructions, then the capabilities on offer, then this session’s settings — these four are assembled once and sent as one text ahead of your first message — and under them the context pulled in while working, which keeps growing.',
  },

  assembly: {
    eyebrow: 'one request, top to bottom',
    toModel: '→ the model',
    firstMessage: 'Your first message',
    example: 'Where are we on this project?',
  },

  context: {
    eyebrow: 'one window, four moments',
    moments: [
      {
        label: 'the session opens',
        note: 'the startup stack is already there — nothing has been typed',
      },
      {
        label: 'a few turns in',
        note: 'each turn adds your message, Claude’s answer, and every file it read',
      },
      {
        label: 'near the limit',
        note: 'all of it is resent on every turn — what is left is room to reply',
      },
      {
        label: 'after compaction',
        note: 'older turns fold into a summary; the stack stays, the work goes on',
      },
    ],
    compaction: '↓ compaction',
    legend: {
      startup: 'the startup stack',
      you: 'what you typed',
      claude: 'what Claude answered',
      files: 'files & tool results',
      summary: 'summary of older turns',
      free: 'room left for the reply',
    },
    aria: 'The same fixed-size box four times: when the session opens only the startup stack is in it; a few turns in, messages, replies and files read fill it further to the right; near the limit little room is left; after compaction the older turns are replaced by a short summary and room is freed.',
  },

  token: {
    eyebrowSentence: 'a sentence, the way a model sees it',
    // An illustrative split: pieces, not words, and not letters. A real tokenizer cuts differently.
    pieces: [
      'Every',
      ' CLA',
      'UDE',
      '.md',
      ' is',
      ' token',
      'ized',
      ' before',
      ' Claude',
      ' reads',
      ' it',
      '.',
    ],
    piecesFor: (pieces: number, chars: number) => [`${pieces} pieces`, ` for ${chars} characters.`],
    explain:
      'A frequent word is one piece; a rare one, a name, a file extension come apart into several. The cuts drawn here are illustrative — a real tokenizer picks its own, and code or another language costs more pieces per word.',
    eyebrowCount: 'how this page counts',
    characters: (n: number) => `${n} characters`,
    tokens: (n: number) => `≈ ${n} tokens`,
    ruleTitle: 'Characters ÷ 4.',
    ruleExplain:
      'Every ≈ on this site is that rule — the transcripts hold text, not tokens, and four characters per token is a fair average for English prose. It runs a little generous on code and a little short on other languages.',
  },

  projects: {
    loading: 'the project folders',
    diagram: {
      eyebrow: 'how the Claude folder is laid out',
      root: 'the folder you chose',
      folder: 'one folder per working directory — its path, every separator turned into a dash',
      transcript: 'one transcript per session; this is what the tool reads',
      memoryDir: 'the auto-memory of that project',
      index: 'the index, loaded whole at the start of every session',
      memoryFile: 'one memory per file, recalled when it looks relevant',
      worktree: 'a git worktree: its own transcripts, but the memory of the checkout it came from',
      temporary: 'a headless run: a throwaway directory per invocation, hidden by default',
    },
    title: 'Projects',
    intro:
      'One folder per working directory Claude Code has run in. A git worktree gets its own transcripts but reads the memory of the checkout it came from — open one to see which.',
    count: (shown: number, total: number) => `${shown} of ${total} project folders`,
    filterPlaceholder: 'Filter by name or path',
    filterAria: 'Filter projects by name or path',
    includeTemporary: (n: number) => `include ${n} temporary`,
    columns: {
      project: 'Project',
      sessions: 'Sessions',
      memory: 'Memory',
      transcripts: 'Transcripts',
      lastActive: 'Last active',
    },
    temporary: 'temporary',
    update: 'Update',
    upToDate: 'Up to date',
    upToDateHint: 'Nothing has changed on disk since this was read.',
    watchOff: 'Not following this folder',
    watchOffHint:
      'This folder cannot be watched, so a change on disk goes unnoticed. Reload the page to read it again.',
    updateHint: (n: number) =>
      `${n === 1 ? '1 project folder has' : `${n} project folders have`} changed on disk. The table takes ${n === 1 ? 'it' : 'them'} in when the bar runs out, or now if you click.`,
    nothingMatches: (query: string | null) =>
      query ? `Nothing matches “${query}”.` : 'Nothing matches that.',
    hiddenNote: (n: number) =>
      `${n} folders under the system temp directory are hidden. They come from tools driving the CLI headlessly — each run gets a throwaway directory, so one project folder is left behind per invocation.`,
  },

  remove: {
    button: 'Remove this folder',
    title: 'Remove this project folder',
    intro:
      'This page writes nothing and deletes nothing. Below is a prompt: paste it into Claude Code and it will check the folder, then remove it — you see the listing before anything goes.',
    what: 'what this folder is',
    whatText:
      'A project folder holds only what Claude Code recorded about running in a directory: the transcripts, and the auto-memory written for that project. It is not the repository. Removing it leaves the working directory and its CLAUDE.md files exactly as they are, and Claude Code makes a fresh folder the next time it runs there.',
    goes: 'what would go',
    transcripts: (n: number, size: string) =>
      n === 1 ? `1 transcript, ${size}.` : `${n} transcripts, ${size}.`,
    noTranscripts: 'No transcripts. Nothing was ever recorded here.',
    memoryWarning: (n: number) =>
      `${n} memory files, plus the index. Auto-memory is written a fact at a time over weeks and exists nowhere else — read it before you agree to this.`,
    memoryNone: 'No memory files of its own, so nothing recalled in a session is at stake.',
    memoryElsewhere: (root: string) =>
      `The memory these sessions read lives at ${root}, which belongs to another project and is not touched.`,
    cwdGone:
      'The directory these sessions ran in is no longer on disk, so this folder records work on something that is already gone.',
    cwdHere: (cwd: string) => `The directory these sessions ran in, ${cwd}, stays untouched.`,
    promptLabel: 'the prompt',
    copy: 'Copy the prompt',
    copied: 'Copied',
    steps: 'Open a terminal, start Claude Code, paste the prompt:',
    prompt: (p: DeleteContext) => {
      const lines = [
        'Remove this Claude Code project folder:',
        p.folder,
        '',
        'First list what is in it and show me, because the only real risk here is removing the wrong folder. It should hold:',
        p.sessions === 0
          ? '- no transcript at all'
          : p.sessions === 1
            ? `- 1 transcript (.jsonl), ${p.size} in total`
            : `- ${p.sessions} transcripts (.jsonl), ${p.size} in total`,
        p.memoryFiles > 0
          ? `- a memory/ folder with ${p.memoryFiles} memory files and an index`
          : '- a memory/ folder with no memory files in it, or none at all',
        '- possibly one subdirectory per session, holding sub-agent transcripts, tool results spilled to disk, workflow runs or published artifacts',
        '',
        p.sessions === 0 && p.memoryFiles === 0
          ? 'The folder is empty, so removing it destroys no record of any session. It is the leftover folder itself and nothing more.'
          : 'What removing it destroys, with no way back: the record of what was said in those sessions, and of which CLAUDE.md files and context layers were loaded into them.',
      ]
      if (p.memoryFiles > 0)
        lines.push(
          `It also destroys ${p.memoryFiles} auto-memory files. Those were written one fact at a time and exist nowhere else — read them out to me first and stop, so I can decide whether to keep any.`,
        )
      if (p.memoryElsewhere)
        lines.push(
          `It does not touch the memory these sessions actually read, which is at ${p.memoryElsewhere} and belongs to another project.`,
        )
      lines.push(
        '',
        p.cwd && p.cwdExists
          ? `What it must not touch: ${p.cwd}. That is the working directory itself, with its own CLAUDE.md files. Do not go near it.`
          : p.cwd
            ? `The working directory it recorded, ${p.cwd}, is no longer on disk, so nothing outside the folder above is involved.`
            : 'No transcript here records a working directory, so nothing outside the folder above is involved.',
        '',
        'Delete it only if the listing matches what I described. If it holds anything else, stop and tell me. When you are done, say what was removed.',
      )
      return lines.join('\n')
    },
  },
  extras: {
    loading: 'the rest of the project folder',
    how: 'what else is in this folder',
    howText:
      'The sessions tab lists the transcripts and the memory tab the memories. This is everything those two skip: a session that spawned sub-agents keeps their transcripts in a subdirectory of its own, a tool result too large to sit inline is spilled to a file beside it, and workflows, published artifacts, hook output and the desktop app’s own markers land here too.',
    subagentNote:
      'A sub-agent runs a context window of its own, and only its final report comes back to the session that spawned it — so none of what it read is counted in that session’s figures. Its transcript is the only place that work is recorded.',
    total: (files: number, size: string) => `${files} files, ${size} in total.`,
    empty: 'Nothing else in this folder.',
    emptyHint:
      'Only the transcripts and the memory folder, both listed on the other tabs. No sub-agent ran here, and no tool result was large enough to be spilled to disk.',
    kinds: {
      subagent: 'Sub-agent transcripts',
      'tool-result': 'Spilled tool results',
      workflow: 'Workflow runs',
      artifact: 'Published artifacts',
      hook: 'Hook output',
      index: 'Session index',
      released: 'Desktop app markers',
      other: 'Everything else',
    },
    hints: {
      subagent: 'one per agent spawned, with the type it ran as and what it was asked to do',
      'tool-result': 'written to disk instead of into the conversation, and referenced from it',
      workflow: 'the script of a workflow run and what each of its agents returned',
      artifact: 'a page published from a session, kept beside its transcript',
      hook: 'context a hook added, saved next to the turn it was added on',
      index: 'a listing of this folder’s sessions, written by the client',
      released: 'a note that the desktop app let go of a session, and why',
      other: 'nothing this page recognises — worth a look',
    },
    truncated: 'The walk stopped at its file cap — there may be more further down.',
  },
  project: {
    loading: 'the project',
    sessionsRecorded: 'sessions recorded',
    memoryFiles: 'memory files',
    linesInIndex: 'lines in MEMORY.md',
    thingToFix: 'thing to fix',
    thingsToFix: 'things to fix',
    tabs: {
      instructions: 'Instructions',
      memory: 'Memory',
      sessions: 'Sessions',
      files: 'Other files',
    },
    sessionsHow: 'what a session is',
    sessionsWhat:
      'One run of Claude Code in this directory, recorded in a single file named by its id. It holds everything that was said and everything that was injected: the layers of the prompt, the files read, the tool results. Open one to see those layers weighed.',
    sessionsSpan:
      'A session is not a day of work. Resuming one appends to the same file, so it can run across several days, move between git branches and cross a CLI upgrade on the way. The branch and version below are the ones it started on.',
    columns: {
      session: 'Session',
      branch: 'Branch',
      cli: 'CLI',
      size: 'Size',
      lastActive: 'Last active',
    },
  },

  memory: {
    issues: {
      'broken-link': 'points at a memory that does not exist',
      orphan: 'not listed in MEMORY.md — only recalled by luck',
      'dead-index': 'listed in MEMORY.md but missing from disk',
      'no-frontmatter': 'no frontmatter at all — no name, no description, no type',
      'no-name': 'no name: — no [[link]] can ever reach it',
      'name-not-slug': 'its name: is a sentence, not a slug',
      'name-off-filename': 'its name: and its filename disagree',
      'no-description': 'no description: — nothing to judge it by at recall time',
      'type-at-root': 'type: sits at the frontmatter root instead of under metadata:',
      'no-type': 'no type under metadata:',
      'unknown-type': 'unknown type — expected user, feedback, project or reference',
    },
    details: { 'no line in MEMORY.md': 'no line in MEMORY.md' },
    noFolder: 'No memory folder for this project.',
    noFolderHint:
      'Nothing has been written yet, or the sessions here load another project’s memory and none of them says which.',
    folder: 'memory folder',
    summary: (files: number, tokens: number) => `${files} files, ≈${tokens} tokens in total`,
    indexCost: (tokens: number, lines: number, each: number) =>
      `MEMORY.md is ≈${tokens} of those tokens, loaded whole on every session: ${lines} lines, about ${each} tokens a line.`,
    sharedBefore: 'Shared: these sessions read the memory belonging to ',
    sharedAfter: ', not a folder of their own.',
    indexExplain:
      'MEMORY.md is loaded whole at the start of every session — its size is a fixed cost on each one, unlike the individual files, which are only pulled in when they look relevant.',
    doNotAddUp: (n: number) => `${n} things that do not add up`,
  },

  instructions: {
    loading: 'the instruction files on disk',
    kinds: {
      user: 'you, everywhere',
      managed: 'organisation',
      project: 'this repository',
      local: 'you, this repository',
      nested: 'subdirectory',
      import: '@import',
      'memory-index': 'auto-memory',
    },
    statuses: {
      start: 'loads at start',
      'on-demand': 'loads on demand',
      empty: 'empty',
      absent: 'not on disk',
    },
    tok: 'tok',
    seenIn: (seen: number, recorded: number) => `seen in ${seen}/${recorded}`,
    neverSeen: 'never seen',
    howToRead: 'how to read this',
    howToReadText:
      'The session pages show what was actually injected, read back from the transcript. This is the other half: everything on disk that can be injected here, and whether any session carried it. A file that exists but is never seen is a different problem from one that is missing.',
    recorded: (recorded: number, sessions: number) =>
      `${recorded} of this project’s ${sessions} transcripts recorded an instruction stack — a short SDK run, or a session from a CLI old enough not to have written them, carries none. The counts on the right are out of those ${recorded}.`,
    cwdGone:
      'The working directory is gone from disk, so only the machine-wide files could be checked.',
    loadedEvery: 'loaded with every session',
    nestedEyebrow: (found: number, loaded: number) =>
      `subdirectory CLAUDE.md — ${found} found, ${loaded} ever loaded`,
    nestedSummary: 'Pulled in the first time Claude touches a file under them — never all at once.',
    nestedTotal: (tokens: number) => `≈${tokens} tok in total`,
    truncated: 'The walk stopped at its file cap — there may be more further down.',
    // What the server says about a file, keyed by the English it sends.
    labels: {
      'managed settings': 'managed settings',
      'auto-memory index (MEMORY.md)': 'auto-memory index (MEMORY.md)',
    },
    notes: {
      'exists but is empty, so nothing is injected from it':
        'exists but is empty, so nothing is injected from it',
      'your own instructions for every project would go here':
        'your own instructions for every project would go here',
      'pushed by your organisation — read it to see what it enforces':
        'pushed by your organisation — read it to see what it enforces',
      'nothing pushed by an organisation on this machine':
        'nothing pushed by an organisation on this machine',
      'loaded whole on every session; the individual memories are recalled as needed':
        'loaded whole on every session; the individual memories are recalled as needed',
      'the repository’s own instructions': 'the repository’s own instructions',
      'yours, not committed': 'yours, not committed',
      'pulled in by an @import': 'pulled in by an @import',
    },
  },

  fix: {
    button: 'Fix these',
    title: 'Fix the memory with Claude Code',
    intro:
      'This page writes nothing. The fix is a prompt: paste it into Claude Code opened in this project and it will edit the memory files for you — you review the changes as you would any other.',
    how: 'what each problem means',
    kinds: {
      'broken-link':
        'A [[link]] names a memory that does not exist under that exact slug — most often the same name with dashes for underscores. Point it at the right existing slug, or remove it.',
      orphan:
        'A file has no line in MEMORY.md, so it is only ever recalled by luck. Add one line to the index.',
      'dead-index':
        'A line in MEMORY.md points at a file that is gone. Remove the line, or point it at the renamed file.',
      'no-frontmatter':
        'A file opens with no `---` block, so it has no name to be linked by, no description to be recalled by and no type. Add one.',
      'no-name':
        'No `name:`, so no [[link]] can reach the file. Add one matching the filename without its extension.',
      'name-not-slug':
        'The `name:` is a sentence rather than a slug. A link is written `[[the-name]]`, so a name with spaces can never be linked to; move the sentence into `description:` if that is where it belongs.',
      'name-off-filename':
        'The `name:` and the filename disagree, usually dashes against underscores. Recall matches the name exactly, so this is what breaks links written from the filename. Settle on one spelling.',
      'no-description':
        'No `description:`, so nothing describes the file when relevance is being judged at recall time. Add a one-line summary.',
      'type-at-root':
        'The `type:` sits at the frontmatter root instead of under `metadata:`, where it is read as no type at all. Nest it.',
      'no-type': 'No type under `metadata:`. Add `metadata:` with a `type:` under it.',
      'unknown-type':
        'The type is not one of the four the instructions ask for. Use user, feedback, project or reference.',
    },
    steps: 'Open a terminal in the project, start Claude Code, paste the prompt:',
    promptLabel: 'the prompt',
    copy: 'Copy the prompt',
    copied: 'Copied',
    close: 'Close',
    prompt: (p: FixContext) => {
      const lines = [
        'Fix the auto-memory of this project. The memory folder is:',
        p.root,
        '',
        'How this folder works: every memory is one Markdown file with YAML frontmatter (name, description, metadata.type). A [[link]] in a body points at another memory’s `name:` slug, exactly — dashes and underscores are not interchangeable. MEMORY.md is the index: one line per memory, of the form `- [Title](file.md) — hook`, and nothing else.',
        '',
        `A check found ${p.broken.length + p.orphans.length + p.dead.length + p.shape.length} problems, listed below. Fix each one. Do not invent facts: never write a new memory whose content you do not know, and do not change the meaning of an existing one.`,
      ]
      if (p.broken.length) {
        lines.push('', '## Broken links')
        for (const item of p.broken)
          lines.push(
            item.candidates.length
              ? `- In \`${item.file}\`: [[${item.link}]] — probably meant \`${item.candidates.join('` or `')}\`. Point the link at that exact slug.`
              : `- In \`${item.file}\`: [[${item.link}]] — no existing memory is close. Remove the link, or point it at the right existing slug if you know it.`,
          )
      }
      if (p.orphans.length) {
        lines.push('', '## Files missing from MEMORY.md')
        for (const item of p.orphans)
          lines.push(
            `- \`${item.file}\`${item.name ? ` (name: ${item.name}` : ''}${item.description ? `${item.name ? ' — ' : ' ('}${item.description}` : ''}${item.name || item.description ? ')' : ''}: add one line to MEMORY.md, \`- [Title](${item.file}) — hook\`, with a title and hook drawn from the file.`,
          )
      }
      if (p.shape.length) {
        lines.push('', '## Frontmatter that does not hold up')
        const say: Record<string, (one: (typeof p.shape)[number]) => string> = {
          'no-frontmatter': (one) =>
            `- \`${one.file}\`: no \`---\` block at all. Add one with \`name:\` (the filename without its extension), a one-line \`description:\`, and \`metadata:\` holding a \`type:\`.`,
          'no-name': (one) =>
            `- \`${one.file}\`: no \`name:\`. Add \`name: ${one.file.replace(/\.md$/, '')}\`.`,
          'name-not-slug': (one) =>
            `- \`${one.file}\`: \`name:\` is a sentence — ${JSON.stringify(one.detail)}. Replace it with \`${one.file.replace(/\.md$/, '')}\`, and keep the sentence as the \`description:\` if the file has none.`,
          'name-off-filename': (one) =>
            `- \`${one.file}\`: \`name: ${one.detail}\` does not match the filename. Settle on the filename's spelling and update any \`[[link]]\` to it.`,
          'no-description': (one) =>
            `- \`${one.file}\`: no \`description:\`. Write a one-line summary from what the file says — do not invent anything it does not.`,
          'type-at-root': (one) =>
            `- \`${one.file}\`: \`type: ${one.detail}\` is at the frontmatter root. Move it under \`metadata:\`.`,
          'no-type': (one) =>
            `- \`${one.file}\`: no type. Add \`metadata:\` with a \`type:\` under it, chosen from user, feedback, project or reference by what the file holds.`,
          'unknown-type': (one) =>
            `- \`${one.file}\`: type ${JSON.stringify(one.detail)} is not one of user, feedback, project or reference. Pick the closest by what the file holds.`,
        }
        for (const one of p.shape)
          lines.push(say[one.kind]?.(one) ?? `- \`${one.file}\`: ${one.kind}`)
      }
      if (p.dead.length) {
        lines.push('', '## Index lines pointing at missing files')
        for (const target of p.dead)
          lines.push(
            `- \`${target}\`: remove the line from MEMORY.md, unless the file was renamed — then point the line at the new name.`,
          )
      }
      lines.push(
        '',
        'When done, list what changed, file by file. Touch nothing else in the folder.',
      )
      return lines.join('\n')
    },
  },

  session: {
    loading: 'the session',
    statStack: 'tokens in the prompt stack',
    statRuntime: 'pulled in while working',
    statLayers: 'distinct layers',
    statMessages: 'prompts / replies',
    lowerBound:
      'A lower bound: the transcript records these layers, not the schemas of the tools that are always loaded. Counts are characters over four. Some of the stack arrives mid-session — a nested CLAUDE.md loads the first time Claude touches a file under it.',
    memoryFrom: 'Memory read from ',
    worktreeShared: ' — a worktree, so that folder is shared with its checkout.',
    sessionId: (id: string) => `session ${id}`,
    allSessions: '← all sessions in this project',
    // Layer labels, keyed by the record type the server reports.
    layers: {
      prompt_snapshot: 'System prompt',
      output_style_instructions: 'Output style',
      instructions: 'CLAUDE.md & memory index',
      nested_memory: 'Nested CLAUDE.md',
      hook_additional_context: 'Hook-injected context',
      deferred_tools_delta: 'Deferred tools (MCP)',
      deferred_tools_record: 'Tools loaded on demand',
      skill_listing: 'Skills',
      mcp_instructions_delta: 'MCP server instructions',
      agent_listing_delta: 'Sub-agents',
      command_permissions: 'Command permissions',
      session_context: 'Session context',
      environment: 'Environment',
      model: 'Model',
      output_style: 'Output style reminder',
      auto_mode: 'Auto mode',
      language: 'Language',
      date: 'Date',
      date_change: 'Date rollover',
      total_tokens_reminder: 'Token budget reminder',
      thinking_stripped: 'Thinking stripped',
      file: 'Files read',
      edited_text_file: 'Files edited',
      directory: 'Directory listings',
      todo_reminder: 'Todo reminder',
      task_reminder: 'Task reminder',
      queued_command: 'Queued prompts',
      compact_file_reference: 'Compacted tool results',
      plan_mode: 'Plan mode',
      plan_mode_exit: 'Plan mode exit',
      plan_file_reference: 'Plan file',
    } as Record<string, string>,
  },
}

export type Strings = typeof en
