import type { FixContext } from '../fixPrompt'
import type { DeleteContext } from '../deletePrompt'
import type { Strings } from './en'

export const fr: Strings = {
  locale: 'fr-FR',

  titles: {
    welcome: 'claude-context — chaque couche qu’une session charge',
    projects: 'Projets — claude-context',
    project: 'Projet — claude-context',
    session: 'Couches de la session — claude-context',
  },

  header: {
    project: 'projet',
    changeFolder: 'changer de dossier',
  },

  footer: {
    license: 'licence MIT',
    author: 'par Vincent Caudron',
    language: 'Langue',
    localOnly: 'lit vos transcriptions en local, n’écrit rien',
  },

  viewer: { label: 'Affichage', rendered: 'Rendu', source: 'Source' },

  link: {
    title: 'Fichier lié',
    open: 'Suivre les liens vers les fichiers du disque',
    back: 'Retour',
    at: 'dans',
    anchor: (fragment: string) => `le lien visait #${fragment} ; le fichier entier est affiché`,
    missing: 'Rien sur le disque à ce chemin. Le lien est périmé, ou le fichier a été renommé.',
    binary: 'Ce n’est pas du texte — rien d’utile à montrer ici.',
    'too-large': 'Plus de 256 ko, le fichier n’est donc pas lu.',
    unreadable: 'Ce chemin n’a pas pu être lu.',
    directory: (n: number) => `Un dossier — ${n} entrées. Choisissez-en une pour la lire.`,
    empty: 'Un dossier vide.',
    external: 'ouvre un nouvel onglet',
  },

  ui: {
    reading: (what: string) => `Lecture ${what}…`,
    couldNotRead: 'Impossible de lire cela.',
    worktree: 'worktree',
    backToProjects: 'Tous les projets de ce dossier',
    backToProject: 'Retour à ce projet',
    backToPicker: 'Choisir un autre dossier Claude',
  },

  format: { daysAgo: (n: number) => `il y a ${n} j` },

  groups: {
    system: {
      title: 'System prompt',
      short: 'System prompt',
      hint: 'Qui Claude est censé être. Identique pour chaque session sur ce client et ce modèle.',
    },
    instructions: {
      title: 'Vos instructions',
      short: 'Vos instructions',
      hint: 'Les fichiers CLAUDE.md et l’index de la mémoire automatique — la partie que vous contrôlez.',
    },
    capabilities: {
      title: 'Ce qu’il peut utiliser',
      short: 'Capacités',
      hint: 'Noms des outils, skills, serveurs MCP et sous-agents. Souvent la couche la plus lourde.',
    },
    session: {
      title: 'Cette session',
      short: 'Cette session',
      hint: 'Modèle, environnement, style de sortie et rappels à chaque tour.',
    },
    runtime: {
      title: 'Ajouté pendant le travail',
      short: 'Pendant le travail',
      hint: 'Fichiers lus et modifiés, listes de dossiers, plans, prompts en attente. Là où part le contexte.',
    },
  },

  welcome: {
    tagline:
      'Chaque session Claude Code s’ouvre sur une pile de contexte que vous ne voyez jamais : un system prompt, les fichiers CLAUDE.md trouvés, l’index de votre mémoire automatique, les outils et skills disponibles. Cet outil lit les transcriptions sur le disque et étale cette pile — par projet, par session, couche par couche, jusqu’au texte exact.',
    chooseFolder: 'choisir un dossier Claude',
    loadingHomes: 'des dossiers Claude de cette machine',
    default: 'par défaut',
    projectFolders: 'dossiers projet',
    withMemory: (n: number, when: string) => `${n} avec mémoire · dernière activité ${when}`,
    orName: 'Ou indiquer un autre dossier',
    placeholder: '~/.claude-travail',
    checking: 'Vérification…',
    open: 'Ouvrir',
    refused: 'ce dossier a été refusé',
    privacy:
      'Tout reste sur cette machine : le serveur n’écoute que sur localhost, n’écrit rien et refuse les requêtes venant d’autres pages.',
    threeThings: 'trois choses à savoir',
    threeThingsIntro:
      'Les chiffres des pages suivantes prennent leur sens avec une image de ce qu’ils mesurent : comment le prompt est assemblé, ce qu’une conversation lui fait, et ce qu’est un token.',
    lesson1: {
      title: 'Le system prompt est une pile, envoyée une fois',
      p1: 'Avant que votre premier message ne parte, Claude Code assemble un long texte et le place devant : qui est le modèle et comment il doit se comporter, puis les instructions trouvées sur le disque, puis les noms de tout ce qu’il peut utiliser, puis les faits de cette session.',
      p2a: 'Vous écrivez l’une de ces couches — ',
      p2b: ' et l’index de la mémoire. Le reste est fixé par le client, le modèle et les outils que vous avez connectés, et c’est en général la partie la plus lourde.',
    },
    lesson2: {
      title: 'Une conversation est une boîte qui se remplit',
      p1: 'Le modèle n’a aucune mémoire entre deux tours. À chaque message envoyé, toute la conversation repart : la pile de départ, tout ce que vous avez dit, tout ce que Claude a répondu, chaque fichier lu en chemin. C’est la fenêtre de contexte, et elle est finie.',
      p2: 'À mesure qu’elle se remplit, la place restante pour répondre diminue. Quand cela devient serré, Claude Code replie les tours les plus anciens en un résumé et continue à partir de là. La pile de départ ne part jamais : elle est payée à chaque tour, d’où l’intérêt d’en connaître la taille.',
    },
    lesson3: {
      title: 'Un token est un morceau de texte, pas un mot',
      p1: 'Les modèles lisent et écrivent en tokens — des fragments de quelques caractères que le tokenizer a appris par fréquence. Les mots courants font un token ; les mots rares, les noms et le code se cassent en plusieurs. Tout ce qu’une fenêtre contient, et tout ce que vous payez, se compte en tokens.',
    },
  },

  stack: {
    eyebrow: 'ce qu’une session porte, de haut en bas',
    hints: {
      system: 'fixé par le client et le modèle',
      instructions: 'CLAUDE.md + index mémoire',
      capabilities: 'outils, skills, MCP, sous-agents',
      session: 'modèle, dossier, style de sortie',
      runtime: 'fichiers lus et modifiés, grandit',
    },
    caption1: 'assemblé une fois, envoyé en un seul texte',
    caption2: 'devant votre premier message — avant le moindre mot',
    aria: 'Cinq couches lues de haut en bas : le system prompt, puis vos instructions, puis les capacités disponibles, puis les réglages de cette session — ces quatre-là sont assemblées une fois et envoyées en un seul texte devant votre premier message — et en dessous le contexte ajouté pendant le travail, qui ne cesse de grandir.',
  },

  assembly: {
    eyebrow: 'une requête, de haut en bas',
    toModel: '→ le modèle',
    firstMessage: 'Votre premier message',
    example: 'Où en est-on sur ce projet ?',
  },

  context: {
    eyebrow: 'une fenêtre, quatre moments',
    moments: [
      {
        label: 'la session s’ouvre',
        note: 'la pile de départ est déjà là — rien n’a encore été tapé',
      },
      {
        label: 'quelques tours plus tard',
        note: 'chaque tour ajoute votre message, la réponse et chaque fichier lu',
      },
      {
        label: 'près de la limite',
        note: 'tout repart à chaque tour — ce qui reste est la place pour répondre',
      },
      {
        label: 'après compaction',
        note: 'les vieux tours deviennent un résumé ; la pile reste, le travail continue',
      },
    ],
    compaction: '↓ compaction',
    legend: {
      startup: 'la pile de départ',
      you: 'ce que vous avez tapé',
      claude: 'ce que Claude a répondu',
      files: 'fichiers et résultats d’outils',
      summary: 'résumé des anciens tours',
      free: 'place restante pour la réponse',
    },
    aria: 'La même boîte de taille fixe quatre fois : à l’ouverture de la session, seule la pile de départ s’y trouve ; quelques tours plus tard, messages, réponses et fichiers lus la remplissent vers la droite ; près de la limite il reste peu de place ; après compaction, les anciens tours sont remplacés par un court résumé et de la place est libérée.',
  },

  token: {
    eyebrowSentence: 'une phrase, telle qu’un modèle la voit',
    pieces: [
      'Chaque',
      ' CLA',
      'UDE',
      '.md',
      ' est',
      ' token',
      'isé',
      ' avant',
      ' que',
      ' Claude',
      ' le',
      ' lise',
      '.',
    ],
    piecesFor: (pieces: number, chars: number) => [
      `${pieces} morceaux`,
      ` pour ${chars} caractères.`,
    ],
    explain:
      'Un mot fréquent fait un morceau ; un mot rare, un nom, une extension de fichier se découpent en plusieurs. Les coupes dessinées ici sont illustratives — un vrai tokenizer choisit les siennes, et le code ou une autre langue coûtent plus de morceaux par mot.',
    eyebrowCount: 'comment cette page compte',
    characters: (n: number) => `${n} caractères`,
    tokens: (n: number) => `≈ ${n} tokens`,
    ruleTitle: 'Caractères ÷ 4.',
    ruleExplain:
      'Chaque ≈ de ce site suit cette règle — les transcriptions contiennent du texte, pas des tokens, et quatre caractères par token est une bonne moyenne pour de la prose anglaise. C’est un peu généreux pour du code et un peu court pour d’autres langues, dont le français.',
  },

  projects: {
    loading: 'des dossiers projet',
    diagram: {
      eyebrow: 'comment le dossier Claude est organisé',
      root: 'le dossier que vous avez choisi',
      folder:
        'un dossier par répertoire de travail — son chemin, chaque séparateur devenu un tiret',
      transcript: 'une transcription par session ; c’est ce que l’outil lit',
      memoryDir: 'la mémoire automatique de ce projet',
      index: 'l’index, chargé en entier au début de chaque session',
      memoryFile: 'une mémoire par fichier, rappelée quand elle semble pertinente',
      worktree: 'un worktree git : ses propres transcriptions, mais la mémoire du dépôt d’origine',
      temporary:
        'une exécution sans interface : un répertoire jetable par appel, masqué par défaut',
    },
    title: 'Projets',
    intro:
      'Un dossier par répertoire de travail dans lequel Claude Code a tourné. Un worktree git a ses propres transcriptions mais lit la mémoire du dépôt dont il vient — ouvrez-le pour voir lequel.',
    count: (shown: number, total: number) => `${shown} dossiers projet sur ${total}`,
    filterPlaceholder: 'Filtrer par nom ou chemin',
    filterAria: 'Filtrer les projets par nom ou chemin',
    includeTemporary: (n: number) => `inclure les ${n} temporaires`,
    columns: {
      project: 'Projet',
      sessions: 'Sessions',
      memory: 'Mémoire',
      transcripts: 'Transcriptions',
      lastActive: 'Dernière activité',
    },
    temporary: 'temporaire',
    update: 'Mettre à jour',
    upToDate: 'À jour',
    upToDateHint: 'Rien n’a changé sur le disque depuis la lecture.',
    watchOff: 'Ne suit pas ce dossier',
    watchOffHint:
      'Ce dossier ne peut pas être surveillé, donc un changement sur le disque passe inaperçu. Rechargez la page pour le relire.',
    updateHint: (n: number) =>
      `${n === 1 ? '1 dossier projet a changé' : `${n} dossiers projet ont changé`} sur le disque. Le tableau ${n === 1 ? 'le' : 'les'} prend en compte au bout de la barre, ou tout de suite si vous cliquez.`,
    nothingMatches: (query: string | null) =>
      query ? `Rien ne correspond à « ${query} ».` : 'Rien ne correspond.',
    hiddenNote: (n: number) =>
      `${n} dossiers situés dans le répertoire temporaire du système sont masqués. Ils viennent d’outils qui pilotent le CLI sans interface — chaque exécution reçoit un répertoire jetable, donc un dossier projet reste derrière à chaque appel.`,
  },

  remove: {
    button: 'Supprimer ce dossier',
    title: 'Supprimer ce dossier projet',
    intro:
      'Cette page n’écrit rien et ne supprime rien. Voici un prompt : collez-le dans Claude Code, il vérifiera le dossier puis le supprimera — vous voyez le contenu avant que quoi que ce soit ne parte.',
    what: 'ce qu’est ce dossier',
    whatText:
      'Un dossier projet ne contient que ce que Claude Code a enregistré de son passage dans un répertoire : les transcriptions, et la mémoire automatique écrite pour ce projet. Ce n’est pas le dépôt. Le supprimer laisse le répertoire de travail et ses CLAUDE.md exactement en place, et Claude Code recrée un dossier neuf la prochaine fois qu’il y tourne.',
    goes: 'ce qui partirait',
    transcripts: (n: number, size: string) =>
      n === 1 ? `1 transcription, ${size}.` : `${n} transcriptions, ${size}.`,
    noTranscripts: 'Aucune transcription. Rien n’a jamais été enregistré ici.',
    memoryWarning: (n: number) =>
      `${n} fichiers de mémoire, plus l’index. La mémoire automatique s’écrit un fait à la fois sur des semaines et n’existe nulle part ailleurs : lisez-la avant d’accepter.`,
    memoryNone:
      'Aucun fichier de mémoire qui lui appartienne, donc rien de ce qui est rappelé dans une session n’est en jeu.',
    memoryElsewhere: (root: string) =>
      `La mémoire que lisent ces sessions se trouve dans ${root}, qui appartient à un autre projet et n’est pas touchée.`,
    cwdGone:
      'Le répertoire dans lequel ces sessions ont tourné n’est plus sur le disque : ce dossier garde donc la trace d’un travail sur quelque chose qui a déjà disparu.',
    cwdHere: (cwd: string) =>
      `Le répertoire dans lequel ces sessions ont tourné, ${cwd}, reste intact.`,
    promptLabel: 'le prompt',
    copy: 'Copier le prompt',
    copied: 'Copié',
    steps: 'Ouvrez un terminal, lancez Claude Code, collez le prompt :',
    prompt: (p: DeleteContext) => {
      const lines = [
        'Supprime ce dossier projet de Claude Code :',
        p.folder,
        '',
        'Commence par lister ce qu’il contient et montre-le-moi, parce que le seul vrai risque ici est de supprimer le mauvais dossier. Il devrait contenir :',
        p.sessions === 0
          ? '- aucune transcription'
          : p.sessions === 1
            ? `- 1 transcription (.jsonl), ${p.size} au total`
            : `- ${p.sessions} transcriptions (.jsonl), ${p.size} au total`,
        p.memoryFiles > 0
          ? `- un dossier memory/ avec ${p.memoryFiles} fichiers de mémoire et un index`
          : '- un dossier memory/ sans aucun fichier de mémoire, ou pas de dossier memory/ du tout',
        '- éventuellement un sous-dossier par session, contenant des transcriptions de sous-agents, des résultats d’outils écrits sur le disque, des exécutions de workflow ou des artefacts publiés',
        '',
        p.sessions === 0 && p.memoryFiles === 0
          ? 'Le dossier est vide : sa suppression ne détruit la trace d’aucune session. C’est le dossier résiduel lui-même, et rien de plus.'
          : 'Ce que la suppression détruit sans retour : la trace de ce qui a été dit dans ces sessions, et de quels CLAUDE.md et quelles couches de contexte y ont été chargés.',
      ]
      if (p.memoryFiles > 0)
        lines.push(
          `Elle détruit aussi ${p.memoryFiles} fichiers de mémoire automatique. Ils ont été écrits un fait à la fois et n’existent nulle part ailleurs : lis-les-moi d’abord et arrête-toi, que je décide si j’en garde.`,
        )
      if (p.memoryElsewhere)
        lines.push(
          `Elle ne touche pas la mémoire que ces sessions lisent réellement, qui est dans ${p.memoryElsewhere} et appartient à un autre projet.`,
        )
      lines.push(
        '',
        p.cwd && p.cwdExists
          ? `Ce qu’elle ne doit pas toucher : ${p.cwd}. C’est le répertoire de travail lui-même, avec ses propres CLAUDE.md. Ne t’en approche pas.`
          : p.cwd
            ? `Le répertoire de travail qu’il a enregistré, ${p.cwd}, n’est plus sur le disque : rien en dehors du dossier ci-dessus n’est concerné.`
            : 'Aucune transcription ici n’enregistre de répertoire de travail : rien en dehors du dossier ci-dessus n’est concerné.',
        '',
        'Ne le supprime que si le contenu correspond à ce que je viens de décrire. S’il contient autre chose, arrête-toi et dis-le-moi. Quand c’est fait, dis ce qui a été supprimé.',
      )
      return lines.join('\n')
    },
  },
  extras: {
    loading: 'du reste du dossier projet',
    how: 'ce qu’il y a d’autre dans ce dossier',
    howText:
      'L’onglet Sessions liste les transcriptions et l’onglet Mémoire les mémoires. Voici tout ce que ces deux-là laissent de côté : une session qui a lancé des sous-agents garde leurs transcriptions dans un sous-dossier à elle, un résultat d’outil trop volumineux pour tenir dans la conversation est écrit dans un fichier à côté, et les exécutions de workflow, les artefacts publiés, les sorties de hooks et les marqueurs de l’app bureau atterrissent ici aussi.',
    subagentNote:
      'Un sous-agent tourne dans sa propre fenêtre de contexte, et seule sa réponse finale revient à la session qui l’a lancé : rien de ce qu’il a lu n’est donc compté dans les chiffres de cette session. Sa transcription est le seul endroit où ce travail est enregistré.',
    total: (files: number, size: string) => `${files} fichiers, ${size} au total.`,
    empty: 'Rien d’autre dans ce dossier.',
    emptyHint:
      'Seulement les transcriptions et le dossier de mémoire, tous deux listés dans les autres onglets. Aucun sous-agent n’a tourné ici, et aucun résultat d’outil n’a été assez gros pour être écrit sur le disque.',
    kinds: {
      subagent: 'Transcriptions de sous-agents',
      'tool-result': 'Résultats d’outils débordés',
      workflow: 'Exécutions de workflow',
      artifact: 'Artefacts publiés',
      hook: 'Sorties de hooks',
      index: 'Index des sessions',
      released: 'Marqueurs de l’app bureau',
      other: 'Tout le reste',
    },
    hints: {
      subagent: 'un par agent lancé, avec le type sous lequel il a tourné et sa mission',
      'tool-result': 'écrit sur le disque au lieu d’entrer dans la conversation, qui y renvoie',
      workflow: 'le script d’une exécution de workflow et ce que chacun de ses agents a renvoyé',
      artifact: 'une page publiée depuis une session, gardée à côté de sa transcription',
      hook: 'du contexte ajouté par un hook, enregistré à côté du tour concerné',
      index: 'une liste des sessions de ce dossier, écrite par le client',
      released: 'une note disant que l’app bureau a relâché une session, et pourquoi',
      other: 'rien que cette page reconnaisse — à regarder',
    },
    truncated:
      'Le parcours s’est arrêté à son plafond de fichiers — il peut y en avoir d’autres plus bas.',
  },
  project: {
    loading: 'du projet',
    sessionsRecorded: 'sessions enregistrées',
    memoryFiles: 'fichiers de mémoire',
    linesInIndex: 'lignes dans MEMORY.md',
    thingToFix: 'chose à corriger',
    thingsToFix: 'choses à corriger',
    tabs: {
      instructions: 'Instructions',
      memory: 'Mémoire',
      sessions: 'Sessions',
      files: 'Autres fichiers',
    },
    sessionsHow: 'ce qu’est une session',
    sessionsWhat:
      'Une exécution de Claude Code dans ce répertoire, enregistrée dans un seul fichier nommé par son identifiant. Il contient tout ce qui a été dit et tout ce qui a été injecté : les couches du prompt, les fichiers lus, les résultats d’outils. Ouvrez-en une pour voir ces couches pesées.',
    sessionsSpan:
      'Une session n’est pas une journée de travail. La reprendre écrit à la suite du même fichier, donc elle peut s’étaler sur plusieurs jours, passer d’une branche git à une autre et traverser une mise à jour du CLI en chemin. La branche et la version ci-dessous sont celles de son début.',
    columns: {
      session: 'Session',
      branch: 'Branche',
      cli: 'CLI',
      size: 'Taille',
      lastActive: 'Dernière activité',
    },
  },

  memory: {
    issues: {
      'broken-link': 'pointe vers une mémoire qui n’existe pas',
      orphan: 'absent de MEMORY.md — rappelé seulement par chance',
      'dead-index': 'listé dans MEMORY.md mais absent du disque',
      'no-frontmatter': 'aucun frontmatter — ni nom, ni description, ni type',
      'no-name': 'pas de name: — aucun [[lien]] ne peut l’atteindre',
      'name-not-slug': 'son name: est une phrase, pas un slug',
      'name-off-filename': 'son name: et son nom de fichier divergent',
      'no-description': 'pas de description: — rien pour juger sa pertinence au rappel',
      'type-at-root': 'type: à la racine du frontmatter au lieu d’être sous metadata:',
      'no-type': 'pas de type sous metadata:',
      'unknown-type': 'type inconnu — attendu : user, feedback, project ou reference',
    },
    details: { 'no line in MEMORY.md': 'aucune ligne dans MEMORY.md' },
    noFolder: 'Aucun dossier de mémoire pour ce projet.',
    noFolderHint:
      'Rien n’a encore été écrit, ou les sessions d’ici chargent la mémoire d’un autre projet sans qu’aucune ne dise lequel.',
    folder: 'dossier de mémoire',
    summary: (files: number, tokens: number) => `${files} fichiers, ≈${tokens} tokens au total`,
    indexCost: (tokens: number, lines: number, each: number) =>
      `MEMORY.md pèse ≈${tokens} de ces tokens, chargés en entier à chaque session : ${lines} lignes, environ ${each} tokens par ligne.`,
    sharedBefore: 'Partagée : ces sessions lisent la mémoire appartenant à ',
    sharedAfter: ', et non un dossier à elles.',
    indexExplain:
      'MEMORY.md est chargé en entier au début de chaque session — sa taille est un coût fixe à chaque fois, contrairement aux fichiers individuels, qui ne sont chargés que lorsqu’ils semblent pertinents.',
    doNotAddUp: (n: number) => `${n} incohérences`,
  },

  instructions: {
    loading: 'des fichiers d’instructions sur le disque',
    kinds: {
      user: 'vous, partout',
      managed: 'organisation',
      project: 'ce dépôt',
      local: 'vous, ce dépôt',
      nested: 'sous-dossier',
      import: '@import',
      'memory-index': 'mémoire auto',
    },
    statuses: {
      start: 'chargé au départ',
      'on-demand': 'chargé à la demande',
      empty: 'vide',
      absent: 'absent du disque',
    },
    tok: 'tok',
    seenIn: (seen: number, recorded: number) => `vu dans ${seen}/${recorded}`,
    neverSeen: 'jamais vu',
    howToRead: 'comment lire ceci',
    howToReadText:
      'Les pages de session montrent ce qui a réellement été injecté, relu depuis la transcription. Voici l’autre moitié : tout ce qui, sur le disque, peut être injecté ici, et si une session l’a effectivement porté. Un fichier qui existe mais n’est jamais vu est un problème différent d’un fichier manquant.',
    recorded: (recorded: number, sessions: number) =>
      `${recorded} des ${sessions} transcriptions de ce projet ont enregistré une pile d’instructions — une courte exécution SDK, ou une session d’un CLI trop ancien pour les écrire, n’en porte aucune. Les compteurs de droite sont rapportés à ces ${recorded}.`,
    cwdGone:
      'Le répertoire de travail a disparu du disque, seuls les fichiers globaux de la machine ont pu être vérifiés.',
    loadedEvery: 'chargé avec chaque session',
    nestedEyebrow: (found: number, loaded: number) =>
      `CLAUDE.md de sous-dossiers — ${found} trouvés, ${loaded} déjà chargés`,
    nestedSummary:
      'Chargés la première fois que Claude touche un fichier en dessous — jamais tous d’un coup.',
    nestedTotal: (tokens: number) => `≈${tokens} tok au total`,
    truncated:
      'Le parcours s’est arrêté à son plafond de fichiers — il peut y en avoir d’autres plus bas.',
    labels: {
      'managed settings': 'réglages gérés',
      'auto-memory index (MEMORY.md)': 'index de la mémoire auto (MEMORY.md)',
    },
    notes: {
      'exists but is empty, so nothing is injected from it':
        'existe mais est vide, donc rien n’en est injecté',
      'your own instructions for every project would go here':
        'vos instructions pour tous les projets iraient ici',
      'pushed by your organisation — read it to see what it enforces':
        'poussé par votre organisation — lisez-le pour voir ce qu’il impose',
      'nothing pushed by an organisation on this machine':
        'rien de poussé par une organisation sur cette machine',
      'loaded whole on every session; the individual memories are recalled as needed':
        'chargé en entier à chaque session ; les mémoires individuelles sont rappelées au besoin',
      'the repository’s own instructions': 'les instructions propres au dépôt',
      'yours, not committed': 'les vôtres, non commitées',
      'pulled in by an @import': 'chargé via un @import',
    },
  },

  fix: {
    button: 'Corriger',
    title: 'Corriger la mémoire avec Claude Code',
    intro:
      'Cette page n’écrit rien. La correction est un prompt : collez-le dans Claude Code ouvert sur ce projet et il modifiera les fichiers de mémoire pour vous — vous relisez les changements comme n’importe quels autres.',
    how: 'ce que signifie chaque problème',
    kinds: {
      'broken-link':
        'Un [[lien]] nomme une mémoire qui n’existe pas sous ce slug exact — le plus souvent le même nom avec des tirets à la place des underscores. Faites-le pointer vers le bon slug existant, ou retirez-le.',
      orphan:
        'Un fichier n’a aucune ligne dans MEMORY.md, il n’est donc rappelé que par chance. Ajoutez une ligne à l’index.',
      'dead-index':
        'Une ligne de MEMORY.md pointe vers un fichier disparu. Retirez la ligne, ou faites-la pointer vers le fichier renommé.',
      'no-frontmatter':
        'Un fichier commence sans bloc `---` : il n’a donc ni nom pour être lié, ni description pour être rappelé, ni type. Ajoutez-en un.',
      'no-name':
        'Pas de `name:`, donc aucun [[lien]] ne peut atteindre le fichier. Ajoutez-en un, identique au nom de fichier sans son extension.',
      'name-not-slug':
        'Le `name:` est une phrase et non un slug. Un lien s’écrit `[[le-nom]]`, donc un nom avec des espaces ne peut jamais être lié ; déplacez la phrase dans `description:` si c’est sa place.',
      'name-off-filename':
        'Le `name:` et le nom de fichier divergent, en général tirets contre underscores. Le rappel se fait sur le nom exact, c’est donc ce qui casse les liens écrits d’après le nom de fichier. Tranchez pour une seule orthographe.',
      'no-description':
        'Pas de `description:`, donc rien ne décrit le fichier au moment où sa pertinence est jugée pour un rappel. Ajoutez un résumé d’une ligne.',
      'type-at-root':
        'Le `type:` est à la racine du frontmatter au lieu d’être sous `metadata:`, où il est lu comme une absence de type. Imbriquez-le.',
      'no-type': 'Pas de type sous `metadata:`. Ajoutez `metadata:` avec un `type:` en dessous.',
      'unknown-type':
        'Le type n’est pas l’un des quatre attendus. Utilisez user, feedback, project ou reference.',
    },
    steps: 'Ouvrez un terminal dans le projet, lancez Claude Code, collez le prompt :',
    promptLabel: 'le prompt',
    copy: 'Copier le prompt',
    copied: 'Copié',
    close: 'Fermer',
    prompt: (p: FixContext) => {
      const lines = [
        'Corrige la mémoire automatique de ce projet. Le dossier de mémoire est :',
        p.root,
        '',
        'Fonctionnement de ce dossier : chaque mémoire est un fichier Markdown avec un frontmatter YAML (name, description, metadata.type). Un [[lien]] dans un corps pointe vers le slug `name:` d’une autre mémoire, exactement — tirets et underscores ne sont pas interchangeables. MEMORY.md est l’index : une ligne par mémoire, de la forme `- [Titre](fichier.md) — accroche`, et rien d’autre.',
        '',
        `Une vérification a trouvé ${p.broken.length + p.orphans.length + p.dead.length + p.shape.length} problèmes, listés ci-dessous. Corrige chacun. N’invente aucun fait : n’écris jamais une nouvelle mémoire dont tu ne connais pas le contenu, et ne change pas le sens d’une mémoire existante.`,
      ]
      if (p.broken.length) {
        lines.push('', '## Liens cassés')
        for (const item of p.broken)
          lines.push(
            item.candidates.length
              ? `- Dans \`${item.file}\` : [[${item.link}]] — visait probablement \`${item.candidates.join('` ou `')}\`. Fais pointer le lien vers ce slug exact.`
              : `- Dans \`${item.file}\` : [[${item.link}]] — aucune mémoire existante n’est proche. Retire le lien, ou fais-le pointer vers le bon slug existant si tu le connais.`,
          )
      }
      if (p.orphans.length) {
        lines.push('', '## Fichiers absents de MEMORY.md')
        for (const item of p.orphans)
          lines.push(
            `- \`${item.file}\`${item.name ? ` (name : ${item.name}` : ''}${item.description ? `${item.name ? ' — ' : ' ('}${item.description}` : ''}${item.name || item.description ? ')' : ''} : ajoute une ligne à MEMORY.md, \`- [Titre](${item.file}) — accroche\`, avec un titre et une accroche tirés du fichier.`,
          )
      }
      if (p.shape.length) {
        lines.push('', '## Frontmatter mal formé')
        const say: Record<string, (one: (typeof p.shape)[number]) => string> = {
          'no-frontmatter': (one) =>
            `- \`${one.file}\` : aucun bloc \`---\`. Ajoute-en un avec \`name:\` (le nom de fichier sans son extension), une \`description:\` d’une ligne, et \`metadata:\` contenant un \`type:\`.`,
          'no-name': (one) =>
            `- \`${one.file}\` : pas de \`name:\`. Ajoute \`name: ${one.file.replace(/\.md$/, '')}\`.`,
          'name-not-slug': (one) =>
            `- \`${one.file}\` : le \`name:\` est une phrase — ${JSON.stringify(one.detail)}. Remplace-le par \`${one.file.replace(/\.md$/, '')}\`, et garde la phrase comme \`description:\` si le fichier n’en a pas.`,
          'name-off-filename': (one) =>
            `- \`${one.file}\` : \`name: ${one.detail}\` ne correspond pas au nom de fichier. Tranche pour l’orthographe du nom de fichier et mets à jour les \`[[liens]]\` qui le visent.`,
          'no-description': (one) =>
            `- \`${one.file}\` : pas de \`description:\`. Écris un résumé d’une ligne à partir de ce que dit le fichier — n’invente rien qu’il ne dise pas.`,
          'type-at-root': (one) =>
            `- \`${one.file}\` : \`type: ${one.detail}\` est à la racine du frontmatter. Déplace-le sous \`metadata:\`.`,
          'no-type': (one) =>
            `- \`${one.file}\` : pas de type. Ajoute \`metadata:\` avec un \`type:\` en dessous, choisi parmi user, feedback, project ou reference selon le contenu.`,
          'unknown-type': (one) =>
            `- \`${one.file}\` : le type ${JSON.stringify(one.detail)} n’est pas l’un de user, feedback, project ou reference. Prends le plus proche selon le contenu.`,
        }
        for (const one of p.shape)
          lines.push(say[one.kind]?.(one) ?? `- \`${one.file}\` : ${one.kind}`)
      }
      if (p.dead.length) {
        lines.push('', '## Lignes de l’index vers des fichiers disparus')
        for (const target of p.dead)
          lines.push(
            `- \`${target}\` : retire la ligne de MEMORY.md, sauf si le fichier a été renommé — alors fais pointer la ligne vers le nouveau nom.`,
          )
      }
      lines.push(
        '',
        'Quand tu as fini, liste ce qui a changé, fichier par fichier. Ne touche à rien d’autre dans le dossier.',
      )
      return lines.join('\n')
    },
  },

  session: {
    loading: 'de la session',
    statStack: 'tokens dans la pile du prompt',
    statRuntime: 'ajoutés pendant le travail',
    statLayers: 'couches distinctes',
    statMessages: 'prompts / réponses',
    lowerBound:
      'Une borne basse : la transcription enregistre ces couches, pas les schémas des outils toujours chargés. Les comptes sont des caractères divisés par quatre. Une partie de la pile arrive en cours de session — un CLAUDE.md imbriqué se charge la première fois que Claude touche un fichier en dessous.',
    memoryFrom: 'Mémoire lue depuis ',
    worktreeShared: ' — un worktree, donc ce dossier est partagé avec son dépôt d’origine.',
    sessionId: (id: string) => `session ${id}`,
    allSessions: '← toutes les sessions de ce projet',
    layers: {
      prompt_snapshot: 'System prompt',
      output_style_instructions: 'Style de sortie',
      instructions: 'CLAUDE.md et index mémoire',
      nested_memory: 'CLAUDE.md imbriqué',
      hook_additional_context: 'Contexte injecté par hook',
      deferred_tools_delta: 'Outils différés (MCP)',
      deferred_tools_record: 'Outils chargés à la demande',
      skill_listing: 'Skills',
      mcp_instructions_delta: 'Instructions des serveurs MCP',
      agent_listing_delta: 'Sous-agents',
      command_permissions: 'Permissions de commandes',
      session_context: 'Contexte de session',
      environment: 'Environnement',
      model: 'Modèle',
      output_style: 'Rappel du style de sortie',
      auto_mode: 'Mode auto',
      language: 'Langue',
      date: 'Date',
      date_change: 'Changement de date',
      total_tokens_reminder: 'Rappel du budget de tokens',
      thinking_stripped: 'Réflexion retirée',
      file: 'Fichiers lus',
      edited_text_file: 'Fichiers modifiés',
      directory: 'Listes de dossiers',
      todo_reminder: 'Rappel de todo',
      task_reminder: 'Rappel de tâche',
      queued_command: 'Prompts en attente',
      compact_file_reference: 'Résultats d’outils compactés',
      plan_mode: 'Mode plan',
      plan_mode_exit: 'Sortie du mode plan',
      plan_file_reference: 'Fichier de plan',
    },
  },
}
