# Workspace Book

電気・電波・音響工学の本と同じ読書画面と、波多野澪のチャットを使う標準テンプレートです。数式・脚注・図解・読了状態・会話履歴に対応しています。

## 本を書く

createGadgetで作成後、そのガジェットのgetBookFiles()を読み、putBookFiles([{path, content}])で目次と本文を保存してください。executeCodeでは作成時のbindingNameでenvからガジェットを参照します。コードファイルとしてcontent/*.mdを書くだけでは読書画面に反映されません。

目次はcontent/toc.json、形式は{title, parts: [{title, part?, chapters: [{id, title, file, chapter?, unnumbered?}]}]}です。章のfileはcontent/からの相対パスです。本文はcontent/<file>にMarkdownで保存します。章ID・ファイル名は任意で、新しい目次から対応付けられます。既存の本文や読了状態を消さず、依頼に必要な章だけ更新してください。目次から外した章の本文など、不要になったファイルはdeleteBookFiles([path])で削除してください。

本の表示名だけを変えて完成と報告しないでください。getBookFilesで保存結果を読み返し、目次から全対象章が開けることとチューターの回答を確認します。

AI接続はAIという名前を使います。チャットから雛形を作ると、そのチャットのモデルが接続されます。未接続時はConnectionsでAIモデルを追加し接続名をAIにします。

Book MCPはbook.listで返されたworkspaceIdとgadgetIdを指定して使います。移動後は一覧を取得し直してください。同じワークスペースに複数の本があるときはgadgetIdが必須です。executeCodeからはその本のputBookFilesを直接使えます。不要になった本文ファイルはbook.delete_filesで削除できます。
