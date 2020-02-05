// scripts/slack.js begin
// Slackのインタフェース
// Slack = loadSlack();

loadSlack = function () {
  var Slack = function (incomingURL, template, settings) {
    EventListener.apply(this);
    this.incomingURL = incomingURL;
    this._template = template;
    this.settings = settings;
  };

  if (typeof EventListener === 'undefined') EventListener = loadEventListener();
  _.extend(Slack.prototype, EventListener.prototype);

  // 受信したメッセージをtimesheetsに投げる
  Slack.prototype.receiveMessage = function (message) {
    Logger.log('Slack.receiveMessage=> message: \n%s', message);
    var username = String(message.user_name);
    var referredUser;
    // var body = String(message['text']);
    // timestampを追加
    var body = []
    var mText = String(message['text'])
    var mTimestamp = String(message['timestamp'])
    body.push(mText, mTimestamp);

    var usernameGotByText = getUserNameByMessage(mText)

    // 宮本さんの出勤返事の場合はtimestampを更新する
    if (usernameGotByText) {
      username = usernameGotByText[0]
      body[0] = usernameGotByText[1] + usernameGotByText[2]
      body[1] = mTimestamp
      body.push('bot')
    }

    var ignoreSetUsers = this.settings.get('無視するユーザ');
    // 特定のアカウントには反応しない
    var ignore_users = (ignoreSetUsers || '')
      .toLowerCase()
      .replace(/^\s*(.*?)\s*$/, '$1')
      .split(/\s*,\s*/);

    // ScriptPropertyに同期
    var globalSettings = new GASProperties();
    if (ignoreSetUsers) globalSettings.set('IGNORE_USERS', ignoreSetUsers);

    if (_.contains(ignore_users, username.toLowerCase())) return;

    // -で始まるメッセージも無視
    if (body[0].match(/^-/)) return;

    // ユーザID項目が存在すればSlackユーザ情報を登録
    if (message.user_id && !usernameGotByText) registerUsersInfo(message);

    // スレッドがある場合は大親スレッドで言及されたユーザー名を取得
    if (message.thread_ts) {
      // スレッド検索API
      var msgAry = findThread(message);
      var referredUserId = msgAry[0];
      var inOrOut = msgAry[1];
      var repDate = msgAry[2];
      // Slackユーザー検索API
      referredUser = getUserInfo(referredUserId, "name");
      this.fireEvent('receiveMessage', username, body, referredUser, inOrOut, repDate);
    } else {
      this.fireEvent('receiveMessage', username, body);
    }
  };

  // メッセージ送信
  Slack.prototype.send = function (message, options) {
    options = _.clone(options || {});

    // アタッチのオプションがあるか（Slack Attachment Option)
    if (Object.keys(options).length) {
      options = this.adjsutTimeAttach(message, options);
    } else {
      options['text'] = message;
      options['unfurl_links'] = true;
    }

    var send_options = {
      method: 'post',
      contentType: 'application/json',
      muteHttpExceptions: true,
      payload: JSON.stringify(options)
    };

    if (this.incomingURL) {
      var output = requestUrl(this.incomingURL, send_options);
    }

    return message;
  };

  // テンプレート付きでメッセージ送信
  Slack.prototype.template = function () {
    this.send(this._template.template.apply(this._template, arguments));
  };

  // アタッチメントとテンプレート付きでメッセージ送信
  Slack.prototype.templateWithOpt = function () {
    var globalSettings = new GASProperties();
    var opt = {};
    var spreadsheetId = globalSettings.get('SPREADSHEET');
    var sheet = SpreadsheetApp.openById(spreadsheetId);

    opt['attachments'] = [{
      "fallback": "インターン生稼働状況attachments",
      "text": "*稼働状況*",
      "mrkdwn_in": ["text"],
      "title": sheet.getName(),
      "title_link": sheet.getUrl()
    }];

    this.send(this._template.template.apply(this._template, arguments), opt);
  };

  Slack.prototype.adjsutTimeAttach = function (message, data) {

    var splitMessage = message.split('\n');

    for (var i = 1; i < splitMessage.length; i++) {

      var text = splitMessage[i].replace(',', '');

      var separatedText = splitMessage[i].split(':');

      var hourBeginPoint = separatedText[0].indexOf('`');

      var hour = Number(separatedText[0].substr(hourBeginPoint + 1, separatedText.length + 1));

      var color;

      if (16 <= hour && hour <= 22) {
        color = "#FFC0CB";
        text += "\nおや、なかなか働いてますね:misawa:";
      } else if (23 <= hour && hour <= 29) {
        color = "#ffa500";
        text += "\n*めちゃめちゃ働いてんな!!*\n*時間だけ気をつけや〜*";
      } else if (0 <= hour && hour <= 15) {
        color = "#87cefa";
        text += "\nぼちぼち働いてんな〜:zoi2:"
      } else if (30 <= hour) {
        color = "#ff6347";
        text += "\n*働きすぎや!!*\n*30時間超えたらあかんゆうたやろ!!*";
      }
      var obj = {
        "color": color,
        "mrkdwn_in": ["text"],
        "text": text
      };

      data['attachments'].push(obj);
    }

    var finalOpt = {
      "footer": '_Miyamoto_ _EX_',
      "text": " ",
      "mrkdwn_in": ["footer", "text"]
    };

    // 最終アタッチメント
    data['attachments'].push(finalOpt);

    return data
  }

  return Slack;
};

if (typeof exports !== 'undefined') {
  exports.Slack = loadSlack();
}
// scripts/slack.js end
