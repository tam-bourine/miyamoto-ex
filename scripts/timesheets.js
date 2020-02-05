// scripts/timesheets.js begin
// 入力内容を解析して、メソッドを呼び出す
// Timesheets = loadTimesheets();

loadTimesheets = function (exports) {
  var Timesheets = function (storage, settings, responder) {
    this.storage = storage;
    this.responder = responder;
    this.settings = settings;
    var self = this;
    this.responder.on('receiveMessage', function (username, message, referredUser, inOrOut, repDate) {
      self.receiveMessage(username, message, referredUser, inOrOut, repDate);
    });
  };

  // メッセージを受信する
  Timesheets.prototype.receiveMessage = function (username, message, referredUser, inOrOut, repDate) {

    if (!repDate) {
      // 日付は先に処理しておく
      this.date = DateUtils.parseDate(message[0]);
      this.time = DateUtils.parseTime(message[0]);
      this.datetime = DateUtils.normalizeDateTime(this.date, this.time);
    } else {
      this.date = DateUtils.parseDate(repDate);
      this.time = DateUtils.parseTime(repDate);
      this.time = DateUtils.parseTime(repDate);
      this.datetime = DateUtils.normalizeDateTime(this.date, this.time);
    }
    if (this.datetime !== null) {
      this.dateStr = DateUtils.format("Y/m/d", this.datetime);
      this.datetimeStr = DateUtils.format("Y/m/d H:M", this.datetime);
    }

    // TODO: リソースファイル化
    // コマンド集
    var commands = [
      ['actionSignOut', /(お先上がります|退勤です|退社です|おつまるです|おつみざわ|おつまる水産|_bye_|_farewell_)/],
      ['actionWhoIsOff', /(だれ|誰|_who\s*is_).*(休|やす(ま|み|む))/],
      ['actionWhoIsIn', /((だれ|誰).*(おる|出勤)|_who\s*is_)/],
      ['actionCancelOff', /((休暇).*(キャンセル)|_cancelRest_)/],
      ['actionOff', /(休暇|お(休|やす)み申請|_rest_)/],
      ['actionSignIn', /(おはみざわ|(出勤|出社)です|おはまる(です|水産)|_hi_|_mng_)/],
      ['actionShowWeeeklyTime', /(_time_|稼働は？|働き具合|_sheet_)/],
      ['actionCreateNextSheet', /(来月勤怠|_nextSheet_)/],
      ['actionCreateShiftSheet', /(今月勤怠|_createSheet_)/],
      ['actionShowNextSheet', /(来月参照|_showNext_)/],
      ['actionShowOldSheet', /(先月参照|_showLast_)/],
      ['confirmSignIn', /_confirmSignIn_/],
      ['confirmSignOut', /_confirmSignOut_/],
      ['confirmAuth', /_confirmAuth_/],
    ];

    if (!referredUser) {
      this.referredUser = null;
    } else {
      this.referredUser = referredUser;
      commands = [
        ['actionAuth', /(_ok_|_confirm_|_approval_|頑張ったね|ご苦労様|よろしい|(良|よ)かろう|おけまる水産|_auth_|お(k|ｋ))/],
      ]
    }
    if (inOrOut !== null) {
      this.inOrOut = inOrOut;
    }
    // メッセージを元にメソッドを探す
    var command = _.find(commands, function (ary) {
      return (ary && message[0].match(ary[1]));
    });

    // commandが見つかったらcommand名を取得
    var matchedCommand = (!_.isUndefined(command) ? String(command[0]) : null)
    // コマンドとメッセージがヒットしなかった場合は処理終了
    if (!command && !this[command[0]]) return false;
    // 出勤もしくは退勤のみ [Slackのメッセージ, タイムスタンプ]の配列を渡す
    if (matchedCommand.match(/actionSignIn|actionSignOut/)) {
      return this[command[0]](username, message);
    }

    // メッセージを実行
    return this[command[0]](username, message[0]);
  }

  // 出勤
  Timesheets.prototype.actionSignIn = function (username, message) {
    this.datetimeStr = DateUtils.cutFixTime(this.datetime);
    if (this.datetime) {
      // 宮本さんのtimestampであればtimestampだけを記録
      if (message[2] === 'bot') {
        this.storage.setNote(username, this.datetime, {
          signIn: message[1]
        })
        return null
      }
      var data = this.storage.get(username, this.datetime);
      if (!data.signIn || data.signIn === '-') {
        this.storage.set(username, this.datetime, {
          signIn: this.datetimeStr
        });
        this.responder.template("出勤", username, this.datetimeStr);
      } else {
        // 更新の場合は時間を明示する必要がある
        if (!!this.time) {
          this.storage.set(username, this.datetime, {
            signIn: this.datetimeStr,
            authSignIn: '-'
          });
          this.responder.template("出勤更新", username, this.datetimeStr);
        }
      }
    }
  };

  // 退勤
  Timesheets.prototype.actionSignOut = function (username, message) {
    this.datetimeStr = DateUtils.cutFixTime(this.datetime);
    if (this.datetime) {
      // 宮本さんのtimestampであればtimestampだけを記録
      if (message[2] === 'bot') {
        this.storage.setNote(username, this.datetime, {
          signOut: message[1]
        })
        return null
      }
      var data = this.storage.get(username, this.datetime);
      if (!data.signOut || data.signOut === '-') {
        this.storage.set(username, this.datetime, {
          signOut: this.datetimeStr
        });
        this.responder.template("退勤", username, this.datetimeStr);
      } else {
        // 更新の場合は時間を明示する必要がある
        if (!!this.time) {
          this.storage.set(username, this.datetime, {
            signOut: this.datetimeStr,
            authSignOut: '-'
          });
          this.responder.template("退勤更新", username, this.datetimeStr);
        }
      }
      // 来週のシフト予定確認
      this.confirmNextWeek(username);
    }
  };

  // 休暇申請
  Timesheets.prototype.actionOff = function (username, message) {
    if (this.date) {
      var dateObj = new Date(this.date[0], this.date[1] - 1, this.date[2]);
      var data = this.storage.get(username, dateObj);
      if (!data.signOut || data.signOut === '-') {
        this.storage.set(username, dateObj, {
          signIn: '-',
          signOut: '-',
          note: message
        });
        this.responder.template("休暇", username, DateUtils.format("Y/m/d", dateObj));
      }
    }
  };

  // 休暇取消
  Timesheets.prototype.actionCancelOff = function (username, message) {
    if (this.date) {
      var dateObj = new Date(this.date[0], this.date[1] - 1, this.date[2]);
      var data = this.storage.get(username, dateObj);
      if (!data.signOut || data.signOut === '-') {
        this.storage.set(username, dateObj, {
          signIn: null,
          signOut: null,
          note: message
        });
        this.responder.template("休暇取消", username, DateUtils.format("Y/m/d", dateObj));
      }
    }
  };

  // 出勤中
  Timesheets.prototype.actionWhoIsIn = function (username, message) {
    var dateObj = DateUtils.toDate(DateUtils.now());
    var result = _.compact(_.map(this.storage.getByDate(dateObj), function (row) {
      return _.isDate(row.signIn) && !_.isDate(row.signOut) ? row.user : undefined;
    }));

    if (_.isEmpty(result)) {
      this.responder.template("出勤なし");
    } else {
      this.responder.template("出勤中", result.sort().join(', '));
    }
  };

  // 休暇中
  Timesheets.prototype.actionWhoIsOff = function (username, message) {
    var dateObj = DateUtils.toDate(DateUtils.now());
    var dateStr = DateUtils.format("Y/m/d", dateObj);
    var result = _.compact(_.map(this.storage.getByDate(dateObj), function (row) {
      return row.signIn === '-' ? row.user : undefined;
    }));

    // 定休の処理
    var wday = dateObj.getDay();
    var self = this;
    _.each(this.storage.getUsers(), function (username) {
      if (_.contains(self.storage.getDayOff(username), wday)) {
        result.push(username);
      }
    });
    result = _.uniq(result);

    if (_.isEmpty(result)) {
      this.responder.template("休暇なし", dateStr);
    } else {
      this.responder.template("休暇中", dateStr, result.sort().join(', '));
    }
  };

  // 出勤していない人にメッセージを送る
  Timesheets.prototype.confirmSignIn = function (username, message) {
    var self = this;
    var today = DateUtils.toDate(DateUtils.now());
    var wday = DateUtils.now().getDay();
    var signedInUsers = _.compact(_.map(this.storage.getByDate(today), function (row) {
      var signedIn = _.isDate(row.willSignIn);
      var off = (row.signIn === '-') || _.contains(self.storage.getDayOff(row.user), wday);
      return (signedIn || off) ? row.user : undefined;
    }));
    // 出勤予定じゃない人を検挙
    var users = _.compact(_.map(this.storage.getByDate(today), function (row) {
      return _.isDate(row.willSignIn) && _.isDate(row.willSignOut) && !_.isDate(row.signIn) ? row.user : undefined;
    }));
    if (!_.isEmpty(users)) {
      this.responder.template("出勤確認", users.sort());
    }
  };

  // 退勤していない人にメッセージを送る
  Timesheets.prototype.confirmSignOut = function (username, message) {
    var dateObj = DateUtils.toDate(DateUtils.now());
    var users = _.compact(_.map(this.storage.getByDate(dateObj), function (row) {
      return _.isDate(row.signIn) && !_.isDate(row.signOut) ? row.user : undefined;
    }));

    if (!_.isEmpty(users)) {
      this.responder.template("退勤確認", users.sort());
    }
  };

  // 承認機能（みやもとbotの文言によって出退勤を切り替える）
  Timesheets.prototype.actionAuth = function (username, message) {
    if (!this.datetime) {
      return null;
    }
    var data = this.storage.get(this.referredUser, this.datetime);

    if (this.inOrOut) {
      if (!data.authSignIn || data.authSignIn === '-') {
        this.storage.set(this.referredUser, this.datetime, {
          authSignIn: username
        });
      }
    } else if (!this.inOrOut) {
      if (!data.authSignOut || data.authSignOut === '-') {
        this.storage.set(this.referredUser, this.datetime, {
          authSignOut: username
        });
      }
    }
    this.responder.template("承認", username, this.datetimeStr);
  }

  // 承認チェック
  Timesheets.prototype.confirmAuth = function (username, message) {
    var self = this;
    var dateObj = DateUtils.toDate(DateUtils.now());

    // 出勤承認もしくは退勤承認がされていないユーザ達
    var users = _.compact(_.map(this.storage.getByDate(dateObj), function (row) {
      var isSignInConfirmed = false
      var isSignOutConfirmed = false
      if (_.isDate(row.signIn) && (row.authSignIn && row.authSignIn !== '-')) isSignInConfirmed = true
      if (_.isDate(row.signOut) && (row.authSignOut && row.authSignOut !== '-')) isSignOutConfirmed = true
      // 出退勤どちらかが未承認のユーザを返す
      var userNotes = self.storage.getNotes(row.user, dateObj)
      var userInfo = {
        user: row.user,
        isSignInConfirmed: isSignInConfirmed,
        isSignOutConfirmed: isSignOutConfirmed,
        tsSignIn: userNotes.tsSignIn,
        tsSignOut: userNotes.tsSignOut
      }
      // Logger.log('________ userinfo %s', JSON.stringify(userInfo))

      return (!isSignInConfirmed || !isSignOutConfirmed ? userInfo : undefined);
    }));

    var tsList = []

    users.forEach(function (user) {
      // 未承認timestampが存在しない時
      if (!Object.keys(user).length) return null
      // 出勤未承認
      if (!user.isSignInConfirmed) tsList.push(user.tsSignIn)
      // 退勤未承認
      if (!user.isSignOutConfirmed) tsList.push(user.tsSignOut)
    })

    var globalSettings = new GASProperties()

    // slackのメッセージリンク化
    var outputUrl = "https://" + globalSettings.get("TEAM_NAME")
      + ".slack.com/archives/" + globalSettings.get("CHANNEL_ID") + "/p"

    var slackLink = []
    tsList.forEach(function (ts) {
      if (!_.isEmpty(ts)) {
        slackLink.push(outputUrl + ts.replace('.', ''))
      }
    })

    var msg = "ちょ、誰か承認したってくれへん？"

    slackLink.forEach(function (link) {
      msg += "\n" + link
    })

    // 未承認投稿がある時のみSlackに投げる
    if (!_.isEmpty(slackLink)) this.responder.send(msg);
  };

  // 週間出勤時間をお知らせ
  Timesheets.prototype.actionShowWeeeklyTime = function () {
    var today = new Date();
    var isSat = false;

    // 土曜日だと行のフォーマットが変わるため判別
    if (today.getDay() !== 6) isSat = true;
    var dateObj = DateUtils.toDate(DateUtils.now());

    // 退勤セルが入力されているユーザ
    var resultUser = _.compact(_.map(this.storage.getByDate(dateObj, isSat), function (row) {
      return !_.isNull(row.signOut) ? row.user : undefined;
    }));

    var resultDate = new Object();
    // 週間労働合計時間の日付（24Hを超えたものは31日の時間となる cuz GAS default Date）
    var resultDate = _.compact(_.map(this.storage.getByDate(dateObj, isSat), function (row) {
      var time = Moment.moment(row.total).format('DD');
      return !_.isNull(row.signOut) ? Number(time) : undefined;
    }));

    // 週間労働合計時間の日付からHH:MMで返す（24Hを超えたものは`24+HH:MM`となる）
    var resultHour = _.compact(_.map(this.storage.getByDate(dateObj, isSat), function (row) {
      var timeHour = Moment.moment(row.total).hour() + ':' + Moment.moment(row.total).minutes();
      return !_.isNull(row.signOut) ? timeHour : undefined;
    }));

    for (var i = 0; i < resultDate.length; i++) {

      // 週間労働合計の日付が31日だった場合、24H足して経過時間に調整
      if (resultDate[i] > 30) {
        var hour = resultHour[i].match(/(^([0-9]{1,2})\:)/)
        var minute = resultHour[i].match(/\:([0-9]{1,2})$/)
        resultHour[i] = Number(hour[2]) + 24 + minute[0]
      }

      // HH（一桁):MM（一桁）だったら調整
      resultHour[i] = resultHour[i].replace(/(^[0-9]{0,1})\:/, "0$1:")
      resultHour[i] = resultHour[i].replace(/\:([0-9]{0,1})$/, ":0$1")
      // ユーザに時間を紐付け
      resultUser[i] = resultUser[i] + ':' + resultHour[i];
    }

    // ユーザがいない場合
    if (_.isEmpty(resultUser)) {
      return this.responder.send('誰も稼働してへんで〜');
    }
    this.responder.templateWithOpt("稼働時間", resultUser.sort());
  };

  // 来月のシフト用のタブ作成
  Timesheets.prototype.actionCreateNextSheet = function (username) {

    this.datetimeStr = DateUtils.cutFixTime(this.datetime);
    var globalSettings = new GASProperties();

    var spreadsheetId = globalSettings.get('NEXT_SPREADSHEET');
    if (spreadsheetId) {
      var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      var settings = new GSProperties(spreadsheet);
      var template = new GSTemplate(spreadsheet);
      var slack = new Slack(settings.get('Slack Incoming URL'), template, settings);
      var nextStorage = new GSTimesheets(spreadsheet, settings);

      globalSettings.set('isNextSheet', 'true');
      nextStorage._getSheet(username)

      slack.template("勤怠表", username, this.datetimeStr);
      globalSettings.set('isNextSheet', 'false');
    } else {
      this.responder.send('来月のシフト作られへんかった〜、ごめんな〜 :bow:');
    }
  };

  // 今月のシフト用のタブ作成
  Timesheets.prototype.actionCreateShiftSheet = function (username) {
    this.datetimeStr = DateUtils.cutFixTime(this.datetime);
    this.storage._getSheet(username);
    this.responder.template("勤怠表", username, this.datetimeStr);
  }

  // 来月のシートURLを送る
  Timesheets.prototype.actionShowNextSheet = function () {
    var globalSettings = new GASProperties();
    var nextId = globalSettings.get('NEXT_SPREADSHEET')
    if (nextId) {
      var sheetLink = SpreadsheetApp.openById(nextId).getUrl()
      this.responder.send("これ、来月のな\n" + sheetLink)
    } else {
      this.responder.send("... 来月のスプレッドシートまだ作ってへんねん")
    }
  }

  // 先月のシートURLを送る
  Timesheets.prototype.actionShowOldSheet = function () {
    var globalSettings = new GASProperties();
    var oldId = globalSettings.get('OLD_SPREADSHEET')
    if (oldId) {
      var sheetLink = SpreadsheetApp.openById(oldId).getUrl()
      this.responder.send("これ、先月のな\n" + sheetLink)
    } else {
      this.responder.send("先月のスプレッドシート？もう消してもうたで！")
    }
  }

  // 来週の出社予定が未入力のユーザにシフト入力を促す
  Timesheets.prototype.confirmNextWeek = function (username) {
    var today = new Date();
    var lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    var nextWeekDay = DateUtils.getThisWeekMonday(Moment.moment(today).add(7, 'days').toDate());
    var lastAttendance = false;

    // 今週最後の出勤かチェック
    const thisWeekData = this.storage.getWeekDate(username, today);
    if (_.chain(thisWeekData).filter(function (data) { return ((Moment.moment(today).isBefore(Moment.moment(data.date))) && data.willSignIn && data.willSignOut) }).isEmpty().value()) {
      lastAttendance = true;
    }

    if (!lastAttendance) return null;

    // 月末までに来週に平日があるかを確認
    var restDate = lastDay.getDate() - today.getDate();

    // 8秒後にシフト入力をリマインド
    Utilities.sleep(1000 * 8);

    // e.g. 27日の金曜日に退勤→来週の月曜日30日が月末日のケース
    if (3 <= restDate) {
      // 来週のシフト予定が入っていない場合通知
      const nextWeekData = this.storage.getWeekDate(username, nextWeekDay);

      if (_.chain(nextWeekData).filter(function (data) { return (data.willSignIn && data.willSignOut) }).isEmpty().value()) {
        this.responder.template("シフト", username);
      }
    } else {
      this.responder.send('あ、ほんで来月のシフトまだやったら入れといてな〜');
    }
  }

  return Timesheets;
};

if (typeof exports !== 'undefined') {
  exports.Timesheets = loadTimesheets();
}
// scripts/timesheets.js end
