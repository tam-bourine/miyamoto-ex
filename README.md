# みやもとEX

<div align="center">

<aj href="https://github.com/google/clasp"><img src="https://img.shields.io/badge/built%20with-clasp-4285f4.svg" alt="clasp"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://poser.pugx.org/laravel/framework/d/total.svg" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://poser.pugx.org/laravel/framework/license.svg" alt="License"></a>


</div>

## 会話例

- 出社です ← 現在時刻で出勤
- 出社です 10:00 ← 指定時刻で出勤
- 出社です 10/2 10:00 ← 過去に遡って出勤を記録する
- 12:00に出社です ← 指定時刻で出勤
- 退社です ← 現在時刻で退勤
- 退社です 19:00 ← 指定時刻で退勤
- 19時に退勤です ← 指定時刻で退勤
- 明日は休暇です ← 休暇申請
- 10/1は休暇です ← 休暇申請
- 明日の休暇をキャンセル ← 休暇申請取り消し
- 誰がいる？ ← 出勤中のリスト
- 誰がお休み？ ← 休暇中のリスト
- 9/21は誰がお休み？ ← 指定日の休暇リスト
- 今月勤怠 ← 今月の自分のシートだけを生成（打刻はしない、主にシフト入力用）
- 来月勤怠 ← 来月の自分のシートだけを生成
- 先月勤怠参照　←　先月のシートのURLを送ってくれる
- 来月勤怠参照　←　来月のシートのURLを送ってくれる
- 稼働は？ ← 今週の各ユーザの稼働時間とスプレッドシートのリンクをお知らせ

#### 承認機能

- インターンA: 出社です 10:00
  - みやもとEX: @インターンA おはようございます（10:00）
    - 管理者B: おk
- これで出勤の承認ができる（退勤も同じ）
- ![image](https://user-images.githubusercontent.com/35181442/73817236-cab7e900-482d-11ea-874e-efc24dd215f2.png)


# 設置方法

みやもとさんEXは、プログラム本体をGoogle Driveに保存して実行します。データはGoogle Spreadsheetに保存されます。
一部GASの拡張版APIを利用するためGCPとの連携が必要となります

インストールは下記の手順に従ってください。

## Google Apps Scriptへ設置

### プログラム本体を設置

- https://drive.google.com/ を開いて画面左にある、「新規」ボタンを押す
- 最下部の「アプリを追加」を押してダイアログを開く
- ダイアログの検索ボックスに「script」と入力
- リストに出てきた「Google Apps Script」の「＋接続」ボタンを押す
- もう一度「作成」ボタンを押して「スクリプト」選択
- 「スクリプトを作成」の下にある「空のプロジェクト」を選択
- 新しいスクリプトを作る画面へ遷移
- 左上の「無題のプロジェクト」をクリックして、お好きなプロジェクト名前に変更
- ![drive](https://user-images.githubusercontent.com/35181442/62426765-348ef300-b724-11e9-9925-8cbfb71e85a4.png)
- メニューから「ファイル」→「保存」を選択して保存

### プロジェクトのプロパティ

以下の定数をファイル→プロジェクトのプロパティ→スクリプトプロパティより登録してください

- INTERN_CALENDAR
  - インターン生カレンダー
- SLACK_INCOMING_URL
  - 後に出てくるslackのインカミングURLを記載
- CHANNEL_ID
  - 上記のWebhookを設定したSlackのチャンネルID
- TEAM_NAME
  - Slackのワークスペース名
- SLACK_TOKEN
  - APIを使う為特定のチャネルでトークンを発行
- GS_SHEET_ID (開発用)
  - ログを記録したいスプレッドシートのIDを記入
- INTERN_LOCATION
  - インターンの実際の勤務地住所
- ADMIN_ML
  - 管理者のMLを登録
  - デフォルトではタンバリン社員ML
- IS_NEXTSHEET
  - `false` と入れて下さい
  - 翌月のスプレッドシート作成に使用

## ライブラリの有効化

- 外部ライブラリの追加を行います
  - BetterLog
    - 任意のスプレッドシートにLogを記録する
    - `1DSyxam1ceq72bMHsE6aOVeOl94X78WCwiYPytKi7chlg4x5GqiNXSw0l`
  - MomentJS
    - JSの時間を容易に扱えるライブラリのGAS版
    - `15hgNOjKHUG4UtyZl9clqBbl23sDvWMS8pfDJOyIapZk5RBqwL3i-rlCo`
  - ![library](https://user-images.githubusercontent.com/35181442/62426773-59836600-b724-11e9-8117-d5fbb0b3bcb2.png)
- Googleの拡張サービス
  - CalendarAPI
    - 共有カレンダーの同期操作で使用
  - Drive API
    - スプレッドシート作成時にフォルダ指定で使用予定
  - ![gcpLibrary](https://user-images.githubusercontent.com/35181442/62426778-6dc76300-b724-11e9-924e-109a6c999772.png)
- Googleの拡張サービスはGCPに新規プロジェクトを生成し、GCPとGASを紐付ける必要があります
  - 新規プロジェクト作成
    - [GCP](https://console.cloud.google.com/?hl=ja)へログイン
    - ↓ 画面右上の新しいプロジェクトより適当にプロジェクト作成
      - ![image](https://user-images.githubusercontent.com/35181442/63565030-58668b80-c5a2-11e9-9d11-0be66a90350e.png)
  - また紐づいたGCPプロジェクトでも先ほどのCalendarAPIとDriveAPIを有効化する必要があります
    - サイドバーのMarketPlaceよりソリューション検索(calenar, drive)
      - ![image](https://user-images.githubusercontent.com/35181442/64225242-7a9ec880-cf15-11e9-8c01-5927c20579cf.png)
      - ![gcpApi](https://user-images.githubusercontent.com/35181442/62426784-80da3300-b724-11e9-8255-0907d0a5b885.png)
  - 認証情報の作成
    - ユーザ認証確認画面での表示名を決める必要があります
    - OAuth2.0のクライアントも発行する必要があります
      - ![image](https://user-images.githubusercontent.com/35181442/63565114-a1b6db00-c5a2-11e9-9add-8bba3a1cfe68.png)

### 初期化

- 最初の1回のみツールバーの「関数を選択」から「setUp」を選び、左の再生ボタンを押します。

- ![setUp](https://user-images.githubusercontent.com/35181442/62426788-95b6c680-b724-11e9-9568-9c6b31aa217a.png)

- 権限の承認画面が出たら「承認する」を押してください。
- Google Drive上に「`MM`月インターン勤怠表」というSpreadsheetが生成されます。
- 一度作成した場合毎月月末まで残り1週間ごとに自動生成されます。
  - 月ごとに運用を想定し、毎月1日に前月の分はSlackチャネルとの同期が解除されます(閲覧編集は可能)

### APIの公開

- メニューから「公開」→「ウェブアプリケーションとして導入...」を選びます。
- 先に「新しいバージョンを保存」ボタンを押した後、「アプリケーションにアクセスできるユーザ」から「全員（匿名ユーザを含む）」を選択します。
- 同時に「次のユーザーとしてアプリケーションを実行」を「自分」に変更します。
- 登録完了後に出るウインドーの「現在のウェブアプリケーションのURL」をどこかにメモしておいてください。

- ![publish](https://user-images.githubusercontent.com/35181442/62426793-a6673c80-b724-11e9-8070-b34623bfdb77.png)

- 「全員（匿名ユーザを含む）」が見つからない場合は、https://admin.google.com/ から「Google Apps」→「ドライブ」を選択して、「共有設定」の「ユーザは組織外のユーザとファイルを共有できる」を選択します。

- ![shareOption](https://user-images.githubusercontent.com/35181442/62426800-b717b280-b724-11e9-88a2-40be1047fdfd.png)

## Slackへの設定

### Slack Outgoingの設定

- SlackAppsのページに移動します
  - [SlackApps](https://slack.com/apps)
- 検索窓から `outgoing`と入力します
  - ![outgoing](https://user-images.githubusercontent.com/35181442/62426812-cd257300-b724-11e9-84c3-66320ce4bb0a.png)

- 「Outgoing WebHooks」を選びます。
- 緑の「Add Outgoing Webhook」を押します。
- 「Integration Settings」の「Channel」を「#任意のチャネル名」を選択し、「URL(s)」には「APIの公開」でメモをした「現在のウェブアプリケーションのURL」を入力し、「Save Integration」を押します。
  - ![incomingUrl](https://user-images.githubusercontent.com/35181442/62426825-ed553200-b724-11e9-8427-df038f7201bc.png)

### Slack Incomingの設定

- 左のサイドバーの「Add New Integration」から「Incoming WebHooks」を選びます。
- ページ最下部の「Choose a channel...」から「#timesheets」を選択して、「Add Incoming WebHook」を選択します。
- 遷移したページの「Your Unique Webhook URL」の下に書かれているURLをどこかにメモしておきます。
  - これをGASのファイル→プロジェクトのプロパティ→スクリプトプロパティよりSLACK_INCOMING_URLの値として登録
  - ![image](https://user-images.githubusercontent.com/35181442/73815236-b58c8b80-4828-11ea-9159-b90f9e60e76d.png)
- 「Integration Settings」の「編集」を押して、「botの名前を変える」をクリックし好きな名前を指定します。
  - ![incoming2](https://user-images.githubusercontent.com/35181442/62426845-30170a00-b725-11e9-950c-df92338d7a2e.png)
- ***「miyamoto」以外の名前を指定する場合は、Spreadsheetの「_設定」の「無視するユーザ」にその名前を加えてください。***

## みやもとさんの設定

- [Googleドライブ](https://drive.google.com/) から「MM月インターン勤怠表」を選びます。
- このbotの名前を変更した場合は、「無視するユーザ」にその名前を加えてください。
  - ![ignore](https://user-images.githubusercontent.com/35181442/62426853-4c1aab80-b725-11e9-82c4-a2ba645b8701.png)
- 週の休日は「Day Off」の欄に,(カンマ)区切りで入力します。
- これで設置が終わりました。どんなメッセージに反応するかは、[timesheets.js](https://github.com/tam-bourine/miyamoto-ex/blob/master/scripts/timesheets.js)の正規表現を読み解いてください。
  - TODO: リソースファイル化予定

## メッセージの変更

Spreadsheetの「_メッセージ」シートに各メッセージのテンプレートが書かれています。縦に複数設定すると、ランダムで選択されます。

ココを変更するとみやもとさんのキャラが変わります。ぜひ面白い設定をしてください。

## 開発

- [miyamoto-ex](https://github.com/tam-bourine/miyamoto-ex)
- ローカルで開発環境と構築するために `clasp`を導入する
  - [GAS のGoogle謹製CLIツール clasp](https://qiita.com/HeRo/items/4e65dcc82783b2766c03)
- ↑のプログラム本体のIDをclaspで同期させたら色々コマンドでできる
- GitHubよりプロジェクトをローカルにクローンし、claspでスクリプトIDを指定します
  - `clasp clone GASのスクリプトID`
- Git管理しているので基本的に `clasp`はプッシュのみでプルはしない 　
- `make upload`を使い分散させた各ソースコードを`main.gs`にまとめプッシュ
- コードを変更したときには、メニューの「ファイル」→「版の管理...」で「新しいバージョンを保存」してから、「公開」→「ウェブアプリケーションとして導入...」の「プロジェクトバージョン」を最新にする必要があります。

# 動かす

Slackの対象チャンネルで「出勤です」と発言すると、先の「MM月インターン勤怠表」にユーザ名のタブが作られて、日付の初期化がされ出勤した日付と時間が記録されます。

## 仕様

- Private Groupに設置することはできません
- ユーザは一部屋90人ぐらいまでです。それ以上でお使いの場合は部単位などで部屋を分けて下さい。
- 弊社の勤怠管理ルールである10分刻みの切り上げ時給計算に合わしています
  - e.g. 出勤  `10:13` →  `10:20`、 退勤  `19:32` → `19:40`

# 運用

- ![spreadsheet2](https://user-images.githubusercontent.com/35181442/62426863-79675980-b725-11e9-99f5-a137ab3e00b2.png)
- ***Slackユーザー→アカウント設定よりユーザー名を名字等にする必要があります***
  - slackユーザ名は適当なチャネルで自分のプロフィール写真を選択/サイドバーよりプロフィール・アカウント設定を選択
  - アカウント設定を開く
    - ![image](https://user-images.githubusercontent.com/35181442/64140367-21fcfc00-ce3f-11e9-9388-829965becf97.png)
    - ![image](https://user-images.githubusercontent.com/35181442/64140252-caf72700-ce3e-11e9-970c-b64e6488d841.png)
    - ![image](https://user-images.githubusercontent.com/35181442/64140315-fc6ff280-ce3e-11e9-84a2-a0e9239957f1.png)
    - ![image](https://user-images.githubusercontent.com/35181442/64140650-24ac2100-ce40-11e9-9d6c-49704b811be2.png)
    - ![image](https://user-images.githubusercontent.com/35181442/64140622-047c6200-ce40-11e9-8367-64ee69b7a97f.png)
  - 最下部にユーザー名という項目が閉じているので開いて名前記入
  - ポピュラーネームの方は `taro.suzuki` や `taro-suzuki`などと変更して下さい
- 最初の起動時に1度だけGASのsetup関数を起動する
- スプレッドシートファイルはデフォルトで誰でも編集可能な状態
- しかし実働時間の計算セルなどは管理者のみ記入可能であり、インターン生は不可
  - インターン生はSlackを通じてのみ実働時間は記録・修正可能
  - 出勤と退勤の時間差を計算し6Hルールが自動で適用される
    - `出: 10:00 -- 退: 19:00` →　総労働: 9:00 → 1Hの休憩適用
    - `出: 10:00 -- 退: 15:50` →　総労働: 5:50 → 休憩なし
    - `出: 10:00 -- 退: 16:00` →　総労働: 6:00 → 1Hの休憩適用(実働5H)
  - 出退勤1回ごとに1回の承認（社員）が必要
  - 出退勤を修正すると承認もリセットされる
- インターン生は ***明日以降の*** 出退勤予定を記入するとインターンカレンダーに予定が同期される
  - 一度作成した予定の時間変更・削除も前日までなら可能
    - 過去の予定・当日の予定は編集できるがインターンカレンダーには反映されない。
    - 毎朝10:00にカレンダーのIncoming Webhookで周知されるのでそれまでに変更する必要がある
    - ![image](https://user-images.githubusercontent.com/35181442/63498061-171d9f80-c500-11e9-9629-4c0788e8d379.png)
    - *当日の場合はSlackで連絡*
- 習慣予定合計セルにて30Hルールが適用され、オーバーした際はセルに警告が出る
- 管理者はその下の承認に手動で名前を記入
- 実働時間の週間合計、月次合計は自動でカウント

## テストの実行

- みやもとさんEXもロジックの検証をNodeを使って行う事ができます。
- Nodeの実行環境を整えたら下記のコマンドを実行してください。
- テストは一部ロジックのみTypeScriptとJestで書いてます

```
yarn
yarn test
```

## ソースコード

- main.js
  - HTTPを受け取る
  - 便利関数群
- 入力内容を解析して、メソッドを呼び出す
  - Slackへの入出力
- gs_template.js
  - Google Spreadsheetを使ったメッセージテンプレート
- gs_properties.js
  - Google Spreadsheetを使った設定key-value store
- gs_timesheets.js
  - timesheetsをGoogle Spreadsheetに保存する処理
- gas_properties.js
  - Google Apps Scriptを使った設定key-value store
- gas_utils.js
  - Google Apps Script用のユーティリティ
- utils.js
  - globalで使うユーティリティ
- date_utils.js
  - 日付関係のユーティリティ
- underscore.js
  - _.で始まるユーティリティ集
  - http://underscorejs.org

# License

- [MIT License](http://opensource.org/licenses/MIT)
- origin & special thanks
  - `https://github.com/masuidrive/miyamoto`
  - Copyright 2014- Yuichiro MASUI <masui@masuidrive.jp>
- updated by tambourine inc.
  - `https://github.com/tam-bourine/miyamoto-ex`
