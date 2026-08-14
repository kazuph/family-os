/**
 * Japanese first-party copy for Family mode (Access deployments). Upstream English labels remain
 * for non-Access local password mode; Family mode must never surface them to users.
 */
import { CF_ACCESS_MODE } from './useAuth'
import { DEFAULT_CHAT_TITLE, FAMILY_ADULT_PASSCODE_LENGTH } from '@gadgets/workshop-shared/api'

/** True when this build is the household Family OS Access deployment. */
export const isFamilyMode = CF_ACCESS_MODE

/** Picks the Japanese Family-mode string, otherwise the upstream English one. */
export function familyLabel(english: string, japanese: string): string {
  return isFamilyMode ? japanese : english
}

/** Visible Family OS chrome and profile-flow strings. */
export const familyUi = {
  chooseProfile: 'プロフィールを選ぶ',
  continueAsAdult: '大人として続ける',
  adultPasscode: '大人用パスコード（6桁）',
  setPasscodePlaceholder: `共有パスコード（${FAMILY_ADULT_PASSCODE_LENGTH}桁）を設定`,
  setPasscode: 'パスコードを設定',
  passcodeMustBeDigits: `パスコードは${FAMILY_ADULT_PASSCODE_LENGTH}桁の数字にしてください。`,
  childNamePlaceholder: '子どもの名前',
  addChild: '子どもプロフィールを追加',
  loadingProfiles: 'プロフィールを読み込み中…',
  restoringProfile: 'プロフィールを復元中…',
  unableToRestore: 'このプロフィールを復元できませんでした。',
  unableToLoad: 'プロフィールを読み込めませんでした。',
  unableToSelect: 'このプロフィールを選択できませんでした。',
  home: 'ホーム',
  workspaces: 'ワークスペース',
  blueprints: 'ブループリント',
  outputs: 'アウトプット',
  explore: '探索',
  gatekeepers: 'コネクタ',
  profile: 'プロフィール',
  providers: 'モデル',
  admin: '管理',
  signOut: 'サインアウト',
  adultProfile: '大人プロフィール',
  childProfile: (name: string) => `子ども: ${name}`,
  useChildProfile: (name: string) => `${name}の子どもプロフィールを使う`,
  switchToAdult: '大人プロフィールに切り替え',
  setHouseholdPasscode: '共有パスコードを設定',
  reauthAccess: 'Accessで再認証する',
  openProfileMenu: 'プロフィールメニューを開く',
  chooseMonster: 'モンスターアバターを選ぶ',
  useMonster: (id: string) => `モンスター ${id} を使う`,
  favorites: 'お気に入り',
  recentWorkspaces: '最近のワークスペース',
  favoriteHint: 'ワークスペースをお気に入りに追加するとここに表示されます。',
  createWorkspace: 'ワークスペースを作成',
  searchWorkspaces: 'ワークスペースを検索…',
  workspacesDesc: '各ワークスペースは会話・コネクタ・アウトプットを持つ独立した環境です。',
  startConversation: '新しい会話を始める…',
  askFollowUp: '続きを聞く…',
  share: '共有',
  search: '検索',
  collapseSidebar: 'サイドバーを閉じる',
  expandSidebar: 'サイドバーを開く',
  showAll: 'すべて表示',
  letsSetUp: 'はじめの設定',
  fewThings: '始める前にいくつか設定しましょう',
  createYourProfile: 'プロフィールを作成',
  howYouAppear: '会話での表示名とアバターを決めます',
  next: '次へ',
  letsBuild: 'はじめる',
  onboardingFailed: '初期設定を完了できませんでした。もう一度お試しください。',
  profilePageTitle: 'プロフィール',
  profilePageDesc: '表示名・アバター・セキュリティを管理します。',
  account: 'アカウント',
  monsterHint: 'プロフィールメニューから承認済みのモンスターアバターを選べます。',
  failedSetMonster: 'モンスターアバターを設定できませんでした',
  homeHeading: '何をしますか？',
  homeSubheading: '質問する、アウトプットを作る、ツールと連携するアプリを作る、から始められます。',
  addResource: 'リソースを追加',
  getStarted: 'はじめる',
  suggestMeetingDeck: 'チーム会議の資料を作る',
  suggestMeetingDeckDesc: '進捗・リスク・決めることをまとめたスライド',
  suggestDataInsights: 'データから洞察を見つける',
  suggestDataInsightsDesc: '表計算やCSVから傾向と提案をまとめる',
  suggestQuickTool: '小さなツールを作る',
  suggestQuickToolDesc: '電卓・ダッシュボードなどの小さなアプリ',
  themeSystem: (resolved: string) => `テーマ: システム（${resolved === 'dark' ? 'ダーク' : 'ライト'}）`,
  themeLight: 'テーマ: ライト',
  themeDark: 'テーマ: ダーク',
  switchTheme: (next: string) => {
    const label = next === 'system' ? 'システム' : next === 'dark' ? 'ダーク' : 'ライト'
    return `${label}に切り替え`
  },
  displayName: '表示名',
  displayNamePlaceholder: '呼び名を入力',
  displayNameEmpty: '表示名を入力してください',
  displayNameUpdated: '表示名を更新しました',
  displayNameFailed: '表示名を更新できませんでした',
  editDisplayName: '表示名を編集',
  saveDisplayName: '表示名を保存',
  save: '保存',
  cancel: 'キャンセル',
  userId: 'ユーザーID',
  copyUserId: 'ユーザーIDをコピー',
  userIdCopied: 'ユーザーIDをコピーしました',
  copyFailed: 'コピーできませんでした',
  untitledWorkspace: '無題のワークスペース',
  newChat: '新しいチャット',
  chat: 'チャット',
  renamedChat: 'チャット名を変更',
  renamingChat: 'チャット名を変更中',
  untitled: '無題',
  sharedBy: (name: string) => `${name}さんが共有`,
  workspaceActions: 'ワークスペースの操作',
  rename: '名前変更',
  favorite: 'お気に入り',
  unfavorite: 'お気に入り解除',
  dismiss: 'リストから外す',
  delete: '削除',
  removeWorkspace: 'ワークスペースを外す',
  deleteWorkspace: 'ワークスペースを削除',
  removeWorkspaceBody: (title: string) =>
    `「${title}」をリストから外しますか？リンクからは引き続き開けます。`,
  deleteWorkspaceBody: (title: string) =>
    `「${title}」を削除しますか？この操作は取り消せません。`,
  remove: '外す',
  chooseModel: 'モデルを選ぶ',
  chooseModelDesc: '既定で使うAIモデルを選びます',
  howYouAppearOnboarding: '会話での表示名を決めます',
  defaultAdultDisplayName: '保護者',
  aiProviders: 'AIモデル',
  aiProvidersDesc: 'チャットで使うモデルを追加・管理します。',
  addModel: 'モデルを追加',
  noProvidersYet: 'まだAIモデルがありません',
  noProvidersYetDesc: '利用するモデルを追加してください。',
  builtIn: '標準',
  quickModel: 'クイック',
  noWorkspacesYet: 'まだワークスペースがありません。',
  noWorkspacesYetHint: '上から最初のワークスペースを作成できます。',
  noWorkspacesYetShort: 'まだワークスペースがありません。',
  noWorkspacesYetCreate: 'まだワークスペースがありません。上から最初のワークスペースを作成できます。',
  noMatches: '一致するものがありません。',
  recentWorkspacesTitle: '最近のワークスペース',
  viewAll: 'すべて見る',
  yourWorkspaces: 'あなたのワークスペース',
  noWorkspacesCreated: 'まだワークスペースを作成していません',
  noWorkspacesFound: 'ワークスペースが見つかりません',
  unableToLoadWorkspaces:
    'ワークスペースを読み込めませんでした。接続を確認して再読み込みしてください。',
  somethingWrongWorkspaces: 'ワークスペースの読み込みに失敗しました。',
  quickModelLabel: 'クイックモデル:',
  quickModelNone: '未設定。',
  quickModelHint: 'チャットタイトル生成などの軽い作業に使います。モデルをクリックして設定できます。',
  quickModelTitleSet: 'クイックモデル。クリックで解除',
  quickModelTitleUnset: 'クリックしてクイックモデルに設定',
  clearQuickModel: 'クイックモデルを解除',
  setAsQuickModel: 'クイックモデルに設定',
  deleteProvider: 'モデルを削除',
  deleteProviderConfirm: (name: string) => `「${name}」を削除しますか？この操作は取り消せません。`,
  failedDeleteProvider: 'モデルを削除できませんでした',
  aiGatewayMode: 'AI Gatewayモード:',
  aiGatewayHint:
    '標準モデルはデプロイ側で管理されます。独自APIトークンでカスタムモデルも追加できます。',
  providersLoadError: 'モデルの読み込みに失敗しました。',
  tryAgain: '再試行',
  relativeJustNow: 'たった今',
  relativeMinutes: (n: number) => `${n}分前`,
  relativeHours: (n: number) => `${n}時間前`,
  relativeDays: (n: number) => `${n}日前`,
  failedUpdateDefaultModel: '既定モデルを更新できませんでした',
  // Command palette
  commandPalette: 'コマンドパレット',
  searchWorkspacesAndActions: 'ワークスペースや操作を検索…',
  noResults: '結果がありません。',
  actions: '操作',
  newWorkspace: '新しいワークスペース',
  formatHint: 'フォーマット',
  workspaceHint: 'ワークスペース',
  blueprintHint: 'ブループリント',
  untitledBlueprint: '無題のブループリント',
  navigate: '移動',
  open: '開く',
  close: '閉じる',
  // Featured / empty gallery
  startFromFeatured: 'おすすめのブループリントから始める。',
  browseAllBlueprints: 'すべてのブループリントを見る',
  noDescription: '説明なし',
  openBlueprint: (title: string) => `ブループリント「${title}」を開く`,
  // Toasts / workspace CRUD
  workspaceRemovedFromList: 'リストから外しました',
  workspaceDeleted: 'ワークスペースを削除しました',
  workspaceRemoved: 'ワークスペースを外しました',
  failedDeleteWorkspace: 'ワークスペースを削除できませんでした',
  failedOpenShare: '共有設定を開けませんでした',
  failedUpdateFavorite: 'お気に入りを更新できませんでした',
  failedRenameWorkspace: '名前を変更できませんでした',
  failedCreateWorkspace: 'ワークスペースを作成できませんでした',
  removing: '外しています…',
  deleting: '削除しています…',
  // Add model modal
  addAiModel: 'AIモデルを追加',
  selectProvider: 'プロバイダーを選択',
  selectModel: 'モデルを選択',
  chooseProvider: 'プロバイダーを選ぶ…',
  chooseAiModel: 'AIモデルを選ぶ…',
  otherProvider: (name: string) => `その他の${name}…`,
  modelIdLabel: 'モデルID',
  modelIdDesc: (id: string) => `プロバイダー指定のモデル識別子（例: '${id}'）`,
  displayNameLabel: '表示名',
  displayNameDesc: '画面に表示される名前',
  cloudflareAccountId: 'CloudflareアカウントID',
  cloudflareAccountIdDesc: 'Workers AIの課金先Cloudflareアカウント',
  apiToken: 'APIトークン',
  apiTokenManaged: 'デプロイ側で管理',
  apiTokenOptionalOllama: 'ローカルOllamaでは任意',
  apiTokenWorkersAi:
    'Workers AIの Read + Edit 権限があるAPIトークン（ダッシュボード: Workers AI > Use REST API > Create a Workers AI API Token）',
  apiTokenFor: (name: string) => `課金用の${name} APIトークン`,
  apiUrl: 'API URL',
  apiUrlOllamaDesc: 'OllamaサーバーのURL',
  apiUrlOverrideDesc: '既定のAPIエンドポイントを上書き（Cloudflare AI Gatewayなどのプロキシ向け）',
  advancedSettings: '詳細設定',
  addModelBtn: 'モデルを追加',
  pleaseSelectProvider: 'プロバイダーを選択してください',
  pleaseSelectModel: 'モデルを選択してください',
  pleaseEnterModelId: 'モデルIDを入力してください',
  pleaseEnterDisplayName: '表示名を入力してください',
  pleaseEnterApiToken: 'APIトークンを入力してください',
  pleaseEnterAccountId: 'CloudflareアカウントIDを入力してください',
  pleaseEnterApiUrl: 'OllamaのAPI URLを入力してください',
  failedAddModel: 'モデルを追加できませんでした',
  addModelSuccess: 'AIモデルを追加しました',
  optionalShort: '（任意）',
  failedLoadModels: 'AIモデルを読み込めませんでした',
  // Home suggestions prompts (composer fill)
  suggestOneOnOne: '個別面談の事前メモを書く',
  suggestOneOnOneDesc: '現状・確認点・お願いをまとめた文書',
  suggestOneOnOnePrompt:
    '直属のメンバーとの次の1on1に向けた文書を作って。現状のスナップショット、確認したいこと、前回の持ち越し、明確なお願いを含めて。',
  suggestMeetingDeckPrompt:
    '次のチーム会議用のスライドを作って。進捗、出荷したもの、リスクとブロッカー、決めてほしいことをまとめて。まずチームの状況を聞いて。',
  suggestDataInsightsPrompt:
    'これから共有するデータ（表計算・CSV・貼り付け表）から傾向・異常・意味・具体的な提案をまとめた分析にして。',
  suggestWorkflow: '作業を自動化する',
  suggestWorkflowDesc: '新しいメールが届いたらエージェントを起動',
  suggestWorkflowPrompt:
    '新しいメールが届いたら自動で動くエージェントを作って。内容を読み、判断し、対応するか下書きを作る。どの受信箱を見て何を扱うか聞いて。',
  suggestQuickToolPrompt:
    'ここで使える小さなインタラクティブなツール（電卓・ダッシュボード・探索UIなど）を作って。何をしたいか聞いてから作って。',
  // Blueprints / explore / outputs / gatekeepers
  blueprintsDesc: '公開・保存した再利用可能な出発点。どれからでもワークスペースを作れます。',
  exploreTitle: '探索',
  exploreDesc:
    'おすすめのブループリントを探して出発点にできます。開くとワークスペースが作られ、あとで使うために保存もできます。',
  featured: 'おすすめ',
  screenshotOf: (title: string) => `${title}のスクリーンショット`,
  openFeaturedBlueprint: (title: string) => `おすすめブループリント「${title}」を開く`,
  searchBlueprints: 'ブループリントを検索…',
  noBlueprintsMatch: '一致するブループリントがありません',
  noFeaturedBlueprintsYet: 'まだおすすめブループリントがありません',
  tryDifferentSearch: '別の検索語を試してください。',
  featuredBlueprintsEmptyHint:
    '公開されるとここに表示されます。自分のワークスペースからブループリントを作ることもできます。',
  failedLoadFeatured: 'おすすめブループリントを読み込めませんでした',
  noBlueprintsFound: 'ブループリントが見つかりません',
  noBlueprintsYet: 'まだブループリントがありません',
  noBlueprintsYetHint: 'ワークスペースをブループリントとして公開するか、探索から追加してください。',
  exploreBlueprints: 'ブループリントを探索',
  upload: 'アップロード',
  uploading: 'アップロード中…',
  uploadGadget: '.gadgetをアップロード',
  uploadGadgetTitle: '.gadgetアーカイブをアップロード',
  blueprintUploaded: 'ブループリントをアップロードしました',
  failedUploadBlueprint: 'ブループリントのアップロードに失敗しました',
  removedFromLibrary: 'ライブラリから外しました',
  failedRemoveBlueprint: 'ブループリントを外せませんでした',
  removeFromLibrary: 'ライブラリから外す',
  somethingWrongBlueprints: 'ブループリントの読み込みに失敗しました。',
  outputsDesc: 'ワークスペースが作ったものがここに集まります。',
  searchOutputs: 'アウトプットを検索…',
  noOutputsMatch: '一致するアウトプットがありません',
  noOutputsYet: 'まだアウトプットがありません',
  tryDifferentFilter: '別のフィルタや検索語を試してください。',
  outputsEmptyHint: 'ワークスペースが作ったものはここに表示されます。',
  startWith: 'はじめる',
  all: 'すべて',
  yoursAndShared: '自分と共有',
  createdByYou: '自分が作成',
  sharedWithYou: '自分に共有',
  inWorkspaceYouCreated: '自分が作ったワークスペース内',
  inWorkspaceSharedBy: (name: string) => `${name}さんが共有したワークスペース内`,
  createdByYouShort: '自分が作成',
  outputActions: 'アウトプットの操作',
  openWorkspace: 'ワークスペースを開く',
  workspaceActive: (relative: string) => `最終利用 ${relative}`,
  renameOutput: 'アウトプットの名前変更',
  renameOutputDesc: (ws: string) => `「${ws}」にアクセスできる全員に対して名前を変更します。`,
  name: '名前',
  saving: '保存しています…',
  failedRefreshOutputs: 'アウトプットを更新できませんでした',
  failedRenameOutput: 'このアウトプットの名前を変更できませんでした',
  failedRemoveOutput: 'このアウトプットを外せませんでした',
  somethingWrongOutputs: 'アウトプットの読み込みに失敗しました。',
  removeOutputConfirm: (title: string) => `「${title}」を外しますか？`,
  removeOutputBodyOwn: (ws: string) =>
    `「${ws}」からこのアウトプットを完全に外します。同じワークスペースの他のアウトプットはそのままです。この操作は取り消せません。`,
  removeOutputBodyShared: (ws: string) =>
    `「${ws}」にアクセスできる全員からこのアウトプットを完全に外します。同じワークスペースの他のアウトプットはそのままです。この操作は取り消せません。`,
  // Gatekeepers
  gatekeepersTitle: 'コネクタ',
  gatekeepersDesc: 'ワークスペースで使うアプリとアカウントを追加します。一度つなぐと、作るものにそのまま使えます。',
  searchGatekeepers: 'コネクタを検索…',
  noGatekeepersMatch: '一致するコネクタがありません',
  noGatekeepersYet: 'まだコネクタがありません',
  noGatekeepersMatchHint: '検索に一致するものが見つかりませんでした。',
  noGatekeepersYetHint: '利用可能になるとここに表示されます。',
  credentialsExpired: '認証情報が期限切れです',
  failedStartConnection: '接続を開始できませんでした',
  failedRequestAccess: '追加のアクセスを要求できませんでした',
  failedDisconnect: '切断できませんでした',
  failedReconnect: '再接続できませんでした',
  reconnect: '再接続',
  opening: '開いています…',
  connected: '接続済み',
  available: '利用可能',
  loadingGatekeepers: 'コネクタを読み込み中…',
  somethingWrongGatekeepers: 'コネクタの読み込みに失敗しました。',
  checkConnectionRefresh: '接続を確認して、ページを再読み込みしてください。',
  someServicesUnavailable: (ids: string) => `一部のサービスが一時的に利用できません: ${ids}`,
  gatekeeperAria: 'コネクタは、接続したリソースだけにワークスペースのアクセスを制限します',
  gatekeeperTooltip:
    '各ワークスペースを接続したリソースだけに制限し、使う前に必要な権限があることを確認します。',
  connectVendor: (name: string) => `${name}を接続`,
  credentialsExpiredReconnect:
    '認証情報が期限切れです。コネクタページから再接続してください',
  resources: 'リソース',
  resourcesToEnable: '有効にするリソース',
  whatThisGatekeeperCanDo: 'このコネクタでできること',
  grantResource: (title: string) => `${title}を許可`,
  enableResource: (title: string) => `${title}を有効にする`,
  gatekeeperSitsBetween: (name: string) =>
    `コネクタは${name}とワークスペースの間に入ります。`,
  gatekeeperConnectHint:
    '各ワークスペースは接続したリソースだけを見ます。共有されている場合、コネクタは他のユーザーが必要な権限を持っていることを確認してからアクセスを許可します。',
  manageAccountHint:
    'このアカウントは、接続したワークスペースから使えます。共有ユーザーは、必要な権限がある場合にだけ接続リソースにアクセスできます。',
  disconnectConfirm: (name: string) =>
    `${name}を切断しますか？これを使っているワークスペースはアクセスできなくなります。`,
  resourcesToAdd: (n: number) => `${n}件のリソースを追加`,
  selectAtLeastOneResource: '続けるには、少なくとも1つのリソースを選んでください。',
  disconnecting: '切断しています…',
  yesDisconnect: 'はい、切断する',
  continueTo: (name: string) => `${name}へ進む`,
  disconnect: '切断',
  adding: '追加しています…',
  addVendor: (name: string) => `${name}を追加`,
  formatNounDoc: '文書',
  formatNounSheet: '表',
  formatNounSlides: 'スライド',
  uploadFile: 'ファイルをアップロード',
  creatingEllipsis: '作成中…',
  startWithFormat: 'はじめる',
} as const

/** Family-mode display title: maps empty/legacy English untitled defaults to Japanese. */
export function workspaceTitle(title: string | undefined): string {
  const raw = (title || '').trim()
  if (!raw || /^untitled(\s+workspace)?$/i.test(raw)) {
    return familyLabel('Untitled Workspace', familyUi.untitledWorkspace)
  }
  return raw
}

/** Family-mode chat title: maps the default English placeholder to Japanese. */
export function chatTitle(title: string | undefined): string {
  const raw = (title || '').trim()
  if (!raw || raw === DEFAULT_CHAT_TITLE) {
    return familyLabel(DEFAULT_CHAT_TITLE, familyUi.newChat)
  }
  return raw
}

/** Localize bundled output-format nouns/plurals for Family mode. */
export function formatNounLabel(noun: string): string {
  const key = noun.trim().toLowerCase()
  if (key === 'doc' || key === 'docs' || key === 'document' || key === 'documents') {
    return familyLabel(noun, familyUi.formatNounDoc)
  }
  if (key === 'sheet' || key === 'sheets' || key === 'spreadsheet' || key === 'spreadsheets') {
    return familyLabel(noun, familyUi.formatNounSheet)
  }
  if (key === 'slides' || key === 'slide') {
    return familyLabel(noun, familyUi.formatNounSlides)
  }
  if (key === 'app' || key === 'apps') {
    return familyLabel(noun, 'アプリ')
  }
  return noun
}

/** Relative time labels for Family mode lists. */
export function familyRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return familyLabel('just now', familyUi.relativeJustNow)
  if (minutes < 60) {
    return familyLabel(`${minutes}m ago`, familyUi.relativeMinutes(minutes))
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return familyLabel(`${hours}h ago`, familyUi.relativeHours(hours))
  const days = Math.floor(hours / 24)
  return familyLabel(`${days}d ago`, familyUi.relativeDays(days))
}
