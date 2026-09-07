# 移動機能の購読・課金経路の検査

旧実装の検査対象: `72611cee` の `Overseer.subscribeToActions`、`subscribeActionRecords`、
`useActions.openSubscription/closeSubscription`。2026-09-07 に検査。

ユーザーの要求は、ガジェットの状態・接続を保った移動をデプロイする前に、
以前のDO超過課金を再発させる構成になっていないか検査すること。
本モデルはそのうち **購読参照の寿命** の検査である。
料金額、DOの休止、移動プロトコル全体の正しさの証明ではない。

## 実装との対応と次元

| Quint action / state | 実装の境界 |
| --- | --- |
| `start` | ローカル購読の取得後、異なる移動元への `Promise.all` を開始 |
| `pending` / `hostSuccess` | 個別の移動元からの応答。別の登録が失敗した後の遅着も含む |
| `hostFailure` / `disposed` | サーバーの catch と `unsubscribe`。遅着は `addChild` が解放 |
| `readySuccess` / `readyFailure` | `await subscriber.ready()` の成功・失敗 |
| `deliverResult` | ブラウザーが購読を受け取り、世代が変わっていたら解放 |
| `pageSuccess` / `pageFailure` | 購読取得後の `await overseer.listActions()` の成功・失敗 |
| `close` / `clientOpen` | 最後のフロントエンド consumer が外れ、世代を更新し購読を解放 |
| `held` / `localHeld` | 移動元・移動先の購読参照。DO稼働メトリクスとは別物 |

移動元の値域は実統合テストに対応する二つ。同一hostのガジェットは
`#movedGadgetLeases` がまとめるため、ガジェット数とhost数は区別する。
RPCが応答しないままの状態も自己遷移として残す。有限時間内に応答するという
公平性・タイムアウトの仮定は置かない。

未表現の次元:

- ローカル購読の初期replay内部、各ページ内の個別entry、RPC切断のランタイム内部処理。
- 複数タブ・二つ以上のクライアント世代が同時に動く経路。
- 移動・再移動・取り戻しのcommit/reconciliation、権限・token・Yjs・facet・hook。
- 実行中AI、alarm、利用者の操作頻度、Cloudflareの休止・料金丸め・実請求額。

移動元の失敗からサーバーcatchまでの間は終端のcleanupとしてまとめている。
この検査の `closed_releases` は **RPC応答が落ち着いた後** の安全性であり、
応答しないRPCが一定時間で解放されるという活性の証明ではない。

## 結果

| 検査 | 結果 | 証拠・解釈 |
| --- | --- | --- |
| 終端の切断後に購読が残らない (`closed_releases`) | PASS（モデル内） | Quint 20,000 traces × 最大25 steps、seed `0xf8597b2d940386ab`。Apalache 14 steps の有界検証もPASS |
| 読み込み失敗後に購読が残らない (`failed_load_releases`) | FAIL | `start → hostSuccess → hostSuccess → readySuccess → deliverResult → pageFailure`。`useActions.fail` はerrorを表示するがsubscriptionを解放しない。実障害を注入したフロントエンドの再現は未実施 |
| 読み込み終了後、待機中の移動元購読がゼロ (`idle_has_no_remote_sessions`) | FAIL | 上記の最後が `pageSuccess` でも2hostを保持。これは現行の常時通知設計がコスト条件を満たさない反例。参照保持だけから実際の課金時間は断定しない |
| 非空の正常状態・失敗状態への到達 | PASS | `ready_trace` / `failed_page_trace`、固定seed `0x1` で各1件。ランダム探索の正常状態witnessは59件、cleanup状態witnessは9,813件 |
| 実RPCで2hostとtargetの全購読参照を解放 | PASS（購読に限定） | `gadget-move-actions.test.ts`。最終参照の解放時に呼ばれるcollectorのdisposerをawaitし、通常購読・再接続後の双方で1回を確認。時間待ち・GC頼みの判定ではない |

実RPCテストは1件成功したが、別のRPC stub未解放警告もログに出た。
警告の生成箇所は未特定。**RPC全体に漏れがないという判定には使わない。**
初期ページ失敗の反例はコード上の保持経路として確認したもの。
料金の増加が実測されたという意味ではない。

## 読み込み失敗時の局所修正

`useActions.fail` に世代の更新、subscriptionのdispose、参照のクリアを追加した。
取得済みのpending/entriesは残す。この局所修正だけでは正常待機時の常時購読は解消しない。
`move-subscriptions-repaired.qnt` は現行モデルのactionを再利用し、
ページ失敗時の解放だけを置き換えた候補モデル。

- 固定した反例の修正後witness: seed `0x1`、1件PASS。
- `closed_releases` と `failed_load_releases`: seed `0x1`、20,000 traces × 最大25 stepsでPASS。
- 同じ二つの不変条件をApalacheの14 steps有界検証でPASS。
- フロントエンドのtypes:checkはPASS。
- 実フロントエンドにページ障害を起こして確認する検査は未実施。モデルのGREENを代用しない。

原ログと入力SHA-256のmanifestは `/tmp/family-os-move-formal-evidence/` に保存。
モデルと実装の対応は、この文書を含む変更履歴で追跡する。

## 常時購読を外す候補の棄却

変更時だけplain-dataのRPC通知を送り、再接続はsourceからreplayする候補を試作した。
最初の候補差分は `/tmp/move-action-notification-candidate.patch` に保存し、一度取り消した。
その後、以下の更新番号を持つ実装へ修正した。保存した旧候補を現在の差分に逆適用してはいけない。

反例: 同じsourceの別gadgetへの通知が返らず、通知queueが待機する。その間に対象actionが
2回更新され、再接続のreplayは新しい状態を読む。queueの待機が終わると古い通知が届き、
新しい状態を上書きする。単に「liveがreplayより優先」とするだけでは防げない。
`move-notification-candidate.qnt` の `stale_notification_trace` が固定seed `0x1` で再現する。
異なるRPCセッション間の順序を仮定せず、待機中の別targetをモデルの次元に含めた。

候補の実RPCテストは1件成功したが、この順序を試していないため採用根拠にはしない。
また、候補には `NativeRpcStub<ActionsSubscriber>` の `Stubable` 型制約違反があり、
型検査はFAILだった。未解放警告がこの1実行で出なかったことも解決の証拠とはしない。

`move-notification-versioned.qnt` は、更新番号をentryと同時に取得し、古い番号を受け付けない
設計モデル。対応する更新番号の永続化・受信側の比較は現在のworktreeに実装した。20,000 traces × 最大25 steps、入力seed `0x1` で
`no_stale_overwrite` がPASSし、固定した反例の修正後witnessもPASSした。
このモデル単体は更新番号の永続化・初回pending一覧との競合・通知欠落・プロセス再起動を
表していない。追加モデルと実RPCの証拠は次節に分ける。

```sh
pnpm dlx @informalsystems/quint@0.32.0 test docs/formal/move-notification-candidate.qnt --main move_notification_candidate --match stale_notification_trace --seed 0x1
pnpm dlx @informalsystems/quint@0.32.0 test docs/formal/move-notification-versioned.qnt --main move_notification_versioned --match stale_notification_repaired_trace --seed 0x1
pnpm dlx @informalsystems/quint@0.32.0 run docs/formal/move-notification-versioned.qnt --main move_notification_versioned --step versionedStep --invariant no_stale_overwrite --max-samples 20000 --max-steps 25 --seed 0x1 --backend rust --verbosity 1
```

## 更新番号付き通知の実装と現在の証拠

- sourceは移動済みactionの変更ごとに永続sequenceとaction別versionを更新し、
  entryとversionを同じ同期区間で取得する。通知はplain-dataだけを渡す1回のRPC。
- targetの初回登録/replayはsourceの基準versionを返して終了する。
  sourceの購読disposerはその呼出し内で解放する。targetは自身のローカル購読だけを保持する。
- 再接続replay・live通知・ページ応答は、source workspaceとaction IDごとに更新番号を比較する。
  初回ページ取得中のlive通知は、ページの範囲確定までフロントエンドに保持する。
- `gadget-move-actions.test.ts` は実際に届いた古いentryを実native RPCで再送し、
  通常購読・再接続replay後・初回登録後の三つで巻き戻らないことを検査した。
  通常と再接続と初回登録の全てで、collectorの最終disposerをawaitし1回だけの解放を確認。
  `job-1788785077673-3086-2903`: 1 test PASS、未解放警告はこの実行ではゼロ。
- `move-notification-page.qnt` は初回登録の基準番号、ページ応答より先着するlive更新、
  source再起動で通知を失っても永続番号を保持し再読で回復する経路を表す。
  `job-1788785229460-3086-2906`: 固定seed `0x1` の3 witness PASS。
  ランタイムの永続性やUI動作をこの抽象モデルだけで証明したとは扱わない。
- `job-1788784583055-3086-2901` と `job-1788785156276-3086-2904`: 全体types PASS。
  後続のhost cleanup修正は後者の開始後なので最終入力として再確認が必要。

追加の接続寿命検査で、コード画面の登録応答がアンマウントより後に返ると参照が残る
経路も見つかった。effectごとの所有と遅着時disposeへ修正した。
source workspace削除時は既存のresponse delivery解放処理とalarm再計算を再利用する。
実RPCではコード購読の最終disposerが1回だけ実行されること、source削除後に不要なalarmが消え、leased gadgetのSQLite状態が維持されることを確認した。ブラウザー上で遅着RPCやページ障害を強制する検査は未実施であり、モデルと実RPCの結果と区別する。

### 料金経路の範囲

今回外したのは「一覧にいる全ての移動元を、Activityが閉じていても購読し続ける」経路。
選択中ガジェットのコード同期・UI実行の接続は残る。コードコンポーネントはcodeタブ以外でも
マウントされるため、画面を開いたままなら選択中hostへの接続は残る。
リアルタイム編集やUI更新を無断で止める変更はしていない。

移動済みactionの変更1回につき、sequenceとaction別versionの書き込み、およびtargetへの
1回の通知RPCが増える。移動元への通常の操作も直接DO RPCのままである。
更新も操作もない時にこの通知経路が定期通信するtimer/alarmは追加していない。
これらは静的な回数の説明であり、実請求額やDO稼働時間の測定ではない。

## 再実行

Quintは `0.32.0`（公開日2026-03-31）、ApalacheはQuint既定の `0.56.1`。
探索の数値は検証範囲であり、製品の制限や課金上限として導入していない。
次のコマンドはこのworktreeをcwdとして実行する。

```sh
pnpm dlx @informalsystems/quint@0.32.0 typecheck docs/formal/move-subscriptions-current.qnt
pnpm dlx @informalsystems/quint@0.32.0 run docs/formal/move-subscriptions-current.qnt --main move_subscriptions_current --invariant closed_releases --max-samples 20000 --max-steps 25 --seed 0xf8597b2d940386ab --backend rust --witnesses ready_witness late_disposal_witness
pnpm dlx @informalsystems/quint@0.32.0 verify docs/formal/move-subscriptions-current.qnt --main move_subscriptions_current --invariant closed_releases --max-steps 14 --apalache-version 0.56.1
pnpm dlx @informalsystems/quint@0.32.0 test docs/formal/move-subscriptions-current.qnt --main move_subscriptions_current --match '.*_trace' --seed 0x1
pnpm dlx @informalsystems/quint@0.32.0 test docs/formal/move-subscriptions-repaired.qnt --main move_subscriptions_repaired --match failed_page_repaired_trace --seed 0x1
pnpm dlx @informalsystems/quint@0.32.0 run docs/formal/move-subscriptions-repaired.qnt --main move_subscriptions_repaired --step repairedStep --invariants closed_releases failed_load_releases --max-samples 20000 --max-steps 25 --seed 0x1 --backend rust --verbosity 1
pnpm dlx @informalsystems/quint@0.32.0 verify docs/formal/move-subscriptions-repaired.qnt --main move_subscriptions_repaired --step repairedStep --invariants closed_releases failed_load_releases --max-steps 14 --apalache-version 0.56.1 --verbosity 1
pnpm --filter @gadgets/workshop-backend test:integration __integration__/gadget-move-actions.test.ts
```

Herdr原ログ: `job-1788782684356-3086-2889`（探索）、
`job-1788782708315-3086-2890` / `job-1788782708332-3086-2891`（反例）、
`job-1788782808923-3086-2893`（有界検証）、
`job-1788782808904-3086-2892`（実RPC）。
反例ITF: `/tmp/move-quint-error-retention.itf.json` と
`/tmp/move-quint-idle-retention.itf.json`。元のREDは上書きしない。

## 出荷判定

未承認の機能削減や、形式モデルだけを直したGREENは採用しない。
最終ローカル検査は以下のとおり。PRの独立レビューと本番反映確認は別の出荷手順として残る。

| 検査 | 結果・原ログ |
| --- | --- |
| 全体 `pnpm test` | PASS: `job-1788786379106-3086-2926` |
| 全体 `pnpm lint`（型検査含む） | PASS: `job-1788786572846-3086-2928` |
| 全体build | PASS: `job-1788785766878-3086-2919`。後続UIは次行、後続コードの型は上行で確認 |
| 最終移動画面build | PASS: `job-1788786472545-3086-2927` |
| ページ競合モデルの14 steps有界検証 | PASS: `job-1788785259434-3086-2907` |
| 実RPC再起動後の更新番号保持・古い通知排除 | PASS: `job-1788785566671-3086-2914` |
| 実KV障害・永続hook capability（10件） | PASS: `job-1788785934516-3086-2921`、全体テストでも再確認 |
| Chrome拡張による移動画面 | 未選択表示、未選択時実行不可、選択表示、選択時実行可能、再表示時リセットの5判定PASS |

旧action/hook単体テストを実workerd・KVエミュレーターを使う統合テストへ移した。
callback/controllerは復元可能な実capabilityとして保存し、ランタイムの保存制約を迂回していない。
全体テストで発見した通常チャットの承認待ちが消える回帰も修正した。
gadget IDを持たない操作は通常workspaceに表示し、移動hostの対象限定履歴には含めない。
移動元の通常APIからleased gadgetの承認・拒否・hook変更を行う経路も閉じた。

本番のDO稼働時間や請求額は未測定。選択中の同期接続は維持されるため、
「超過課金が絶対に起きない」「全接続の寿命を形式証明した」とは結論しない。
ブラウザーでの故障注入は未実施で、通常UI確認・実RPC解放検査・抽象モデルの検証範囲を分けて扱う。

外部仕様:

- [DO料金](https://developers.cloudflare.com/durable-objects/platform/pricing/): 直接のDO RPC呼び出しごとにリクエスト課金。休止可能でない待機時間は稼働時間課金の対象。
- [DOライフサイクル](https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/): 休止条件はランタイム側の条件を含む。
- [RPC参照の寿命](https://developers.cloudflare.com/workers/runtime-apis/rpc/lifecycle/): 参照の明示的解放が必要。WorkerEntrypointの文脈延長の説明を、そのままDOの実課金の証拠とは扱わない。
