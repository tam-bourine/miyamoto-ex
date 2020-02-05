// scripts/date_util.js begin
// 日付関係の関数
// DateUtils = loadDateUtils();
// Log用GoogleSpreadsheetID
try {
  var globalSettings = PropertiesService.getScriptProperties()
  Logger = BetterLog.useSpreadsheet(globalSettings.getProperty('GS_SHEET_ID'));
} catch(e) {
  // ローカルにてQunit用にLoggerを無害化
  console.log(e)
  var Logger = { log: function() {}}
}
// try {
//   Moment.moment(new date());
// } catch(e) {
//   var Moment = {
//     moment: function() {
//       return moment = require('moment');
//     }
//   }
// }

loadDateUtils = function () {
  var DateUtils = {};

  // 今を返す
  var _now = new Date();
  var now = function(datetime) {
    if(typeof datetime != 'undefined') {
      _now = datetime;
    }
    return _now;
  };
  DateUtils.now = now;

  // テキストから時間を抽出
  DateUtils.parseTime = function(str) {
    str = String(str || "").toLowerCase().replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
    var reg = /((\d{1,2})\s*[:時]{1}\s*(\d{1,2})\s*(pm|)|(am|pm|午前|午後)\s*(\d{1,2})(\s*[:時]\s*(\d{1,2})|)|(\d{1,2})(\s*[:時]{1}\s*(\d{1,2})|)(am|pm)|(\d{1,2})\s*時)/;
    var matches = str.match(reg);
    if(matches) {
      var hour, min;

      // 1時20, 2:30, 3:00pm
      if(matches[2] != null) {
        hour = parseInt(matches[2], 10);
        min = parseInt((matches[3] ? matches[3] : '0'), 10);
        if(_.contains(['pm'], matches[4])) {
          hour += 12;
        }
      }

      // 午後1 午後2時30 pm3
      if(matches[5] != null) {
        hour = parseInt(matches[6], 10);
        min = parseInt((matches[8] ? matches[8] : '0'), 10);
        if(_.contains(['pm', '午後'], matches[5])) {
          hour += 12;
        }
      }

      // 1am 2:30pm
      if(matches[9] != null) {
        hour = parseInt(matches[9], 10);
        min = parseInt((matches[11] ? matches[11] : '0'), 10);
        if(_.contains(['pm'], matches[12])) {
          hour += 12;
        }
      }

      // 14時
      if(matches[13] != null) {
        hour = parseInt(matches[13], 10);
        min = 0;
      }

      return [hour, min];
    }
    return null;
  };

  // テキストから日付を抽出
  DateUtils.parseDate = function(str) {
    str = String(str || "").toLowerCase().replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });

    if(str.match(/(明日|tomorrow)/)) {
      var tomorrow = new Date(now().getFullYear(), now().getMonth(), now().getDate()+1);
      return [tomorrow.getFullYear(), tomorrow.getMonth()+1, tomorrow.getDate()]
    }

    if(str.match(/(今日|today)/)) {
      return [now().getFullYear(), now().getMonth()+1, now().getDate()]
    }

    if(str.match(/(昨日|yesterday)/)) {
      var yesterday = new Date(now().getFullYear(), now().getMonth(), now().getDate()-1);
      return [yesterday.getFullYear(), yesterday.getMonth()+1, yesterday.getDate()]
    }

    var reg = /((\d{4})[-\/年]{1}|)(\d{1,2})[-\/月]{1}(\d{1,2})/;
    var matches = str.match(reg);
    if(matches) {
      var year = parseInt(matches[2], 10);
      var month = parseInt(matches[3], 10);
      var day = parseInt(matches[4], 10);
      if(_.isNaN(year) || year < 1970) {
        //
        if((now().getMonth() + 1) >= 11 && month <= 2) {
          year = now().getFullYear() + 1;
        }
        else if((now().getMonth() + 1) <= 2 && month >= 11) {
          year = now().getFullYear() - 1;
        }
        else {
          year = now().getFullYear();
        }
      }

      return [year, month, day];
    }

    return null;
  };

  // 日付と時間の配列から、Dateオブジェクトを生成
  DateUtils.normalizeDateTime = function(date, time) {
    // 時間だけの場合は日付を補完する
    if(date) {
      if(!time) date = null;
    }
    else {
      date = [now().getFullYear(), now().getMonth()+1, now().getDate()];
      if(!time) {
        time = [now().getHours(), now().getMinutes()];
      }
    }

    // 日付を指定したけど、時間を書いてない場合は扱わない
    if(date && time) {
      return(new Date(date[0], date[1]-1, date[2], time[0], time[1], 0));
    }
    else {
      return null;
    }
  };

  // 日時をいれてparseする
  DateUtils.parseDateTime = function(str) {
    var date = DateUtils.parseDate(str);
    var time = DateUtils.parseTime(str);
    if(!date) return null;
    if(time) {
      return(new Date(date[0], date[1]-1, date[2], time[0], time[1], 0));
    }
    else {
      return(new Date(date[0], date[1]-1, date[2], 0, 0, 0));
    }
  };

  // Dateから日付部分だけを取り出す
  DateUtils.toDate = function(date) {
    return(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0));
  };

  // 曜日を解析
  DateUtils.parseWday = function(str) {
    str = String(str).replace(/曜日/g, '');
    var result = [];
    var wdays = [/(sun|日)/i, /(mon|月)/i, /(tue|火)/i, /(wed|水)/i, /(thu|木)/i, /(fri|金)/i, /(sat|土)/i];
    for(var i=0; i<wdays.length; ++i) {
      if(str.match(wdays[i])) result.push(i);
    }
    return result;
  }

  var replaceChars = {
    Y: function() { return this.getFullYear(); },
    y: function() { return String(this.getFullYear()).substr(-2, 2); },
    m: function() { return ("0"+(this.getMonth()+1)).substr(-2, 2); },
    d: function() { return ("0"+(this.getDate())).substr(-2, 2); },

    H: function() { return ("0"+(this.getHours())).substr(-2, 2); },
    M: function() { return ("0"+(this.getMinutes())).substr(-2, 2); },
    s: function() { return ("0"+(this.getSeconds())).substr(-2, 2); },
  };

  DateUtils.format = function(format, date) {
    var result = '';
    for (var i = 0; i < format.length; i++) {
      var curChar = format.charAt(i);
      if (replaceChars[curChar]) {
        result += replaceChars[curChar].call(date);
      }
      else {
        result += curChar;
      }
    }
    return result;
  };

  // 出勤退に応じて時間調整
  DateUtils.cutFixTime = function(datetime) {
    var parseDateTime;
    // MM: 分数の１桁を切り出し
    var dtMinute = DateUtils.format("M", datetime).substr(1, 2);
    // MM: 0ならそのままフォーマット修正し返す
    if (dtMinute === '0') {
      return DateUtils.format("Y/m/d H:M", datetime);
    }
    // 10分切り上げ
    parseDateTime = Moment.moment(datetime).add(10, 'minute').format('YYYY/MM/DD HH:mm');
    return parseDateTime.slice(0, -1) + "0";
  };

  // 時間計算(HH)
  DateUtils.calcHours = function(signIn, signOut) {
    var output = (Moment.moment(signOut).hour() - Moment.moment(signIn).hour()) * 60;
    return output;
  };

  // 分数計算(MM)
  DateUtils.calcMinutes = function(signIn, signOut) {
    var output = (-(Moment.moment(signIn).minute()) + Moment.moment(signOut).minute());
    return output;
  };

  // 合計労働時間を分換算に
  DateUtils.calcTotalMinutes = function(signIn, signOut) {
    var total = this.calcHours(signIn, signOut) + this.calcMinutes(signIn, signOut);
    return total;
  };

  // 出退勤時間から自動休憩時間を考慮したトータル時間(HH:MM)を返す
  DateUtils.calcTotalDate = function(signIn, signOut) {

    var hh, mm, total;

    total = this.calcTotalMinutes(signIn, signOut);
    hh = Math.floor(total / 60);
    mm = Math.floor(total % 60);
    if (total >= 360) {
      hh -= 1;
    }
    if (mm === 0) {
      mm = "00";
    }
    return hh + ":" + mm;
  };

  // その週の月曜の日付を取得
  DateUtils.getThisWeekMonday = function (date) {
    const toDay = Moment.moment(date);
    toDay.startOf('week');
    toDay.add(1, 'days');

    return toDay.toDate();
  }

  return DateUtils;
};

if(typeof exports !== 'undefined') {
  exports.DateUtils = loadDateUtils();
}
// scripts/date_util.js end
// scripts/event_listener.js begin
// 日付関係の関数
// EventListener = loadEventListener();

loadEventListener = function () {
  var EventListener = function() {
    this._events = {};
  }

  // イベントを捕捉
  EventListener.prototype.on = function(eventName, func) {
    if(this._events[eventName]) {
      this._events[eventName].push(func);
    }
    else {
      this._events[eventName] = [func];
    }
  };

  // イベント発行
  EventListener.prototype.fireEvent = function(eventName) {
    var funcs = this._events[eventName];
    if(funcs) {
      for(var i = 0; i < funcs.length; ++i) {
        funcs[i].apply(this, Array.prototype.slice.call(arguments, 1));
      }
    }
  };

  return EventListener;
};

if(typeof exports !== 'undefined') {
  exports.EventListener = loadEventListener();
}
// scripts/event_listener.js end
// scripts/gas_propeties.js begin
// KVS

loadGASProperties = function (exports) {
  var GASProperties = function() {
     this.properties = PropertiesService.getScriptProperties();
  };

  GASProperties.prototype.get = function(key) {
    return this.properties.getProperty(key);
  };

  GASProperties.prototype.set = function(key, val) {
    this.properties.setProperty(key, val);
    return val;
  };

  GASProperties.prototype.remove = function(key) {
    var isSuccess = false;
    try {
      this.properties.deleteProperty(key);
      Logger.log('>>>>>>> ScriptPropertyの削除に成功');
      isSuccess = true;
    } catch (e) {
      Logger.log('>>>>>>> ScriptPropertyの削除に失敗: %s', e);
    }
    return isSuccess;
  };

  return GASProperties;
};

if(typeof exports !== 'undefined') {
  exports.GASProperties = loadGASProperties();
}
// scripts/gas_propeties.js end
// scripts/gas_utils.js begin
// Google Apps Script専用ユーティリティ

// GASのログ出力をブラウザ互換にする
if(typeof(console) == 'undefined' && typeof(Logger) != 'undefined') {
  console = {};
  console.log = function() {
    Logger.log(Array.prototype.slice.call(arguments).join(', '));
  }
}

// サーバに新しいバージョンが無いかチェックする
// checkUpdate = function(responder) {
//   if(typeof GASProperties === 'undefined') GASProperties = loadGASProperties();
//   var current_version = parseFloat(new GASProperties().get('version')) || 0;
//
//   var response = UrlFetchApp.fetch("https://raw.githubusercontent.com/masuidrive/miyamoto/master/VERSION", {muteHttpExceptions: true});
//
//   if(response.getResponseCode() == 200) {
//     var latest_version = parseFloat(response.getContentText());
//     if(latest_version > 0 && latest_version > current_version) {
//       responder.send("最新のみやもとさんの準備ができました！\nhttps://github.com/masuidrive/miyamoto/blob/master/UPDATE.md を読んでください。");
//
//       var response = UrlFetchApp.fetch("https://raw.githubusercontent.com/masuidrive/miyamoto/master/HISTORY.md", {muteHttpExceptions: true});
//       if(response.getResponseCode() == 200) {
//         var text = String(response.getContentText()).replace(new RegExp("## "+current_version+"[\\s\\S]*", "m"), '');
//         responder.send(text);
//       }
//     }
//   }
// };
// scripts/gas_utils.js end
// scripts/ga_properties.js begin
// KVS

loadGSProperties = function (exports) {
  var GSProperties = function (spreadsheet) {
    // 初期設定
    this.sheet = spreadsheet.getSheetByName('_設定');
    if (!this.sheet) {
      this.sheet = spreadsheet.insertSheet('_設定');
    }
  };

  GSProperties.prototype.get = function (key) {
    if (this.sheet.getLastRow() < 1) return defaultValue;
    var vals = _.find(this.sheet.getRange("A1:B" + this.sheet.getLastRow()).getValues(), function (v) {
      return (v[0] == key);
    });
    if (vals) {
      if (_.isDate(vals[1])) {
        return DateUtils.format("Y-m-d H:M:s", vals[1]);
      } else {
        return String(vals[1]);
      }
    } else {
      return null;
    }
  };

  GSProperties.prototype.set = function (key, val) {
    if (this.sheet.getLastRow() > 0) {
      var vals = this.sheet.getRange("A1:A" + this.sheet.getLastRow()).getValues();
      for (var i = 0; i < this.sheet.getLastRow(); ++i) {
        if (vals[i][0] == key) {
          this.sheet.getRange("B" + (i + 1)).setValue(String(val));
          return val;
        }
      }
    }
    this.sheet.getRange("A" + (this.sheet.getLastRow() + 1) + ":B" + (this.sheet.getLastRow() + 1)).setValues([
      [key, val]
    ]);
    return val;
  };

  GSProperties.prototype.setNote = function (key, note) {
    if (this.sheet.getLastRow() > 0) {
      var vals = this.sheet.getRange("A1:A" + this.sheet.getLastRow()).getValues();
      for (var i = 0; i < this.sheet.getLastRow(); ++i) {
        if (vals[i][0] == key) {
          this.sheet.getRange("C" + (i + 1)).setValue(note);
          return;
        }
      }
    }
    this.sheet.getRange("A" + (this.sheet.getLastRow() + 1) + ":C" + (this.sheet.getLastRow() + 1)).setValues([
      [key, '', note]
    ]); return;
  };

  return GSProperties;
};

if (typeof exports !== 'undefined') {
  exports.GSProperties = loadGSProperties();
}
// scripts/ga_properties.js end// scripts/gs_template.js begin
// メッセージテンプレート
// GSTemplate = loadGSTemplate();

loadGSTemplate = function () {
  var GSTemplate = function (spreadsheet) {
    this.spreadsheet = spreadsheet;

    // メッセージテンプレート設定
    this.sheet = this.spreadsheet.getSheetByName('_メッセージ');
    if (!this.sheet) {
      this.sheet = this.spreadsheet.insertSheet('_メッセージ');
      if (!this.sheet) {
        throw "エラー: メッセージシートを作れませんでした";
      } else {
        this.sheet.getRange("A1:Q2").setValues([
          [
            "出勤", "出勤更新", "退勤", "退勤更新", "休暇", "休暇取消",
            "出勤中", "出勤なし", "休暇中", "休暇なし", "出勤確認",
            "退勤確認", "承認", "承認確認", "稼働時間", "勤怠表", "シフト"
          ],
          [
            "<@#1> おはよ〜 `#2`", "<@#1> 出勤時間変えたで〜 `#2`",
            "<@#1> お疲れちゃん `#2`", "<@#1> 退勤時間変えたで〜 `#2`",
            "<@#1> #2 休みな〜〜", "<@#1> #2 休みやくなて出勤な〜",
            "#1 出勤してんで", "みんな帰ったわ〜",
            "#1 #2 休みやで", "#1 みんな出勤してるで〜",
            "もしかして、今日休み？ #1", "退勤押し忘れてへん？ #1",
            "<@#1> 承認したで `#2`", "承認した〜？",
            "稼働時間な、これ #1", "<@#1> シフト表作ったで〜 `#2`",
            "あ、<@#1> 来週のシフト入れとってな〜"
          ]
        ]);
      }

      // 入力可能エリアを指定
      protectSpreadsheet(this.spreadsheet, 'A:P', 'Slack / Admin でのみ入力可能');
    }
  };

  // テンプレートからメッセージを生成
  GSTemplate.prototype.template = function (label) {
    var labels = this.sheet.getRange("A1:Z1").getValues()[0];
    for (var i = 0; i < labels.length; ++i) {
      if (labels[i] == label) {
        var template = _.sample(
          _.filter(
            _.map(this.sheet.getRange(String.fromCharCode(i + 65) + '2:' + (String.fromCharCode(i + 65))).getValues(), function (v) {
              return v[0];
            }),
            function (v) {
              return !!v;
            }
          )
        );

        var message = template;
        for (var i = 1; i < arguments.length; i++) {
          var arg = arguments[i]
          // 後続のJSONがないかを確認
          if (_.isArray(arg)) {
            arg = _.map(arg, function (userContent) {
              // `HH:MM`形式のテンプレがあるかを判断
              var point = userContent.indexOf(':');
              if (point != -1) {
                var lastName = getUserProfile(userContent.substr(0, point), "last_name")
                var tabName = userContent.substr(0, point);
                // ScriptPropertyに登録済みのユーザなら本名、それ以外はタブ名で
                if (!lastName) lastName = tabName;
                return adjustLabel(lastName, userContent, point);
              } else {
                return "<@" + userContent + ">";
              }
            }).join(', ');
          }

          message = message.replace("#" + i, arg);
        }
        return message;
      }
    }
    return arguments.join(', ');
  }

  function adjustLabel(name, content, indexPoint) {

    var nameLength = 0;
    var space = ''
    var spaceNum = 0

    /**
     * ユーザネームが日本語かを判断
     * 日本語　→　lengthを２倍に（半角スペースに合わすため)
     * 英語　　→　length
     */
    if (name.match(/[^\x00-\x7F]/)) {
      nameLength = name.length * 2
    } else {
      nameLength = name.length
      // 奇数の場合は繰り上げ
      if (name.length % 2 !== 0) {
        isOddNum = true
        nameLength = (Math.round(nameLength * 1) / 1)
      }
    }

    // ユーザネームと稼働時間の間のスペース
    var nameFieldDiff = (12 - nameLength)

    while (spaceNum <= nameFieldDiff) {
      space += "  ";
      spaceNum++;
    }

    const output = "\n" + name + "さん" + space + "`" + content.substr(indexPoint + 1, content.length) + "`";

    return output
  }
  return GSTemplate;
};

if (typeof exports !== 'undefined') {
  exports.GSTemplate = loadGSTemplate();
}
// scripts/gs_template.js end
// scripts/gs_timesheets.js begin
// 入力内容を解析して、メソッドを呼び出す
// Timesheets = loadTimesheets();

loadGSTimesheets = function () {
  var GSTimesheets = function (spreadsheet, settings) {
    this.spreadsheet = spreadsheet;
    this.settings = settings;
    this._sheets = {};

    this.scheme = {
      columns: [
        { name: '日付' },
        { name: '曜日' },
        { name: '出勤予定' },
        { name: '退勤予定' },
        { name: '休憩予定' },
        { name: '合計労働時間' },
        { name: '出勤' },
        { name: '出勤承認' },
        { name: '退勤' },
        { name: '休憩' },
        { name: '合計労働時間' },
        { name: '退勤承認' },
        { name: 'ノート' },
      ],
      properties: [
        {
          name: 'DayOff',
          value: '土,日',
          comment: '← 月,火,水みたいに入力してください。アカウント停止のためには「全部」と入れてください。'
        },
        {
          name: 'Name',
          value: '',
          comment: ''
        }
      ]
    };
  };

  GSTimesheets.prototype._getSheet = function (username) {
    if (this._sheets[username]) return this._sheets[username];

    var sheet = this.spreadsheet.getSheetByName(username);
    if (!sheet) {
      sheet = this.spreadsheet.insertSheet(username);

      if (!sheet) {
        throw "エラー: " + sheetName + "のシートが作れませんでした";
      } else {
        // 中身が存在する場合はnullを返す
        if (sheet.getLastRow() !== 0) return null

        // シート対象者名を設定部に追加
        var fullName = (getUserProfile(username, "last_name") + " " + getUserProfile(username, "first_name"));
        this.scheme.properties[1].value = fullName;

        // 設定部の書き出し
        var properties = [
          ["Properties count", this.scheme.properties.length, null]
        ];
        // 設定部の行数
        var propertiesEndRow = this.scheme.properties.length + 1;

        this.scheme.properties.forEach(function (s) {
          properties.push([s.name, s.value, s.comment]);
        });

        sheet.getRange("A1:C" + (propertiesEndRow)).setValues(properties);

        // ヘッダの書き出し
        var headerRowNo = propertiesEndRow + 2;
        var cols = this.scheme.columns.map(function (c) {
          return c.name;
        });
        sheet.getRange("A" + headerRowNo + ":" + String.fromCharCode(65 + cols.length - 1) + headerRowNo)
          .setBackground("#f0fff0").setValues([cols]);
        sheet.setFrozenRows(headerRowNo);

        var date = new Date();

        var globalSettings = new GASProperties();
        var isNextSheet = globalSettings.get('IS_NEXTSHEET');
        // 来月のシートIDが設定されているのと isNextSheetフラグがtrueの時のみ来月シート作成とみなす
        if (globalSettings.get('NEXT_SPREADSHEET') && isNextSheet === 'true') date = Moment.moment().add('M', 1).toDate()
        var lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        var isLastDay = false;
        var monthFormula = "=SUM(";
        // 出勤可能日カウント
        var countWorkday = 0;
        // TODO: 当月の日曜日の数を定数化しておく？

        // 月の初頭から月末まで
        for (var i = 1; i <= lastDayOfMonth.getDate(); i++) {

          date.setDate(i);
          var dayOfWeek = date.getDay();
          var dayOfWeekStr = ["日", "月", "火", "水", "木", "金", "土"][dayOfWeek];
          var curRowNo = (headerRowNo + i);
          var lastDay = lastDayOfMonth.getDay();
          // 月末が平日のとき
          if (lastDay != 0 && lastDay != 6 && date.getDate() == lastDayOfMonth.getDate()) {
            isLastDay = true;
            countWorkday++;
          }
          // 月末でない平日
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            // 各行に日付を格納
            sheet.getRange("A" + curRowNo).setValue(DateUtils.format("Y/m/d", date));
            // 曜日を格納
            sheet.getRange("B" + curRowNo).setValue(dayOfWeekStr);
            // 予定列集計: 休憩時間
            sheet.getRange("E" + curRowNo)
              .setFormula('if(D' + curRowNo + '-C' + curRowNo + '>= 0.25, time(1, 0, 0), 0)')
              .setNumberFormat("h:mm");
            // 予定列集計: 合計労働時間
            sheet.getRange("F" + curRowNo)
              .setFormula('if(D' + curRowNo + '-C' + curRowNo + '>= 0.25,D' + curRowNo + '-C' + curRowNo + '-E' + curRowNo + ', D' + curRowNo + '-C' + curRowNo + ')')
              .setNumberFormat("h:mm");
            countWorkday++;
          }

          // 土日 もしくは平日最終日
          if (dayOfWeek == 0 || dayOfWeek == 6 || isLastDay) {

            // 平日が月末日の場合、現在行を1つ下にずらす
            if (isLastDay) curRowNo++;
            // 項目シート行を色分け
            sheet.getRange("A" + curRowNo + ":" + String.fromCharCode(65 + cols.length - 1) + curRowNo).setBackground("#f5f5f5");

            // 月の初めが土日どちらかの場合
            if (curRowNo === headerRowNo + 1 && (dayOfWeek == 0 || dayOfWeek == 6)) continue;
            // 2日が日曜日の場合
            if (curRowNo === headerRowNo + 2 && dayOfWeek == 0) continue;

            // 土曜日もしくは平日月末日
            if (dayOfWeek !== 0 || isLastDay) {
              // 平日月末日の行調整
              if (isLastDay) countWorkday--;
              sheet.getRange("E" + curRowNo).setValue('週間予定合計');
              sheet.getRange("F" + curRowNo)
                .setBackground(null)
                .setBorder(true, true, true, true, true, true)
                .setFormula("=sum(F" + (curRowNo - countWorkday) + ":F" + (curRowNo - 1) + ")")
                .setNumberFormat("[hh]:mm");
              sheet.getRange("J" + curRowNo).setValue('週間合計');
              sheet.getRange("G" + curRowNo).setBackground(null).setBorder(true, true, true, true, true, true)
                .setFormula('=if(F' + (curRowNo) + '>= 1.25,"30時間を超えています⚠️️️⚠️⚠️","自動承認可✅")');
              sheet.getRange("K" + curRowNo)
                .setBackground(null)
                .setBorder(true, true, true, true, true, true)
                .setFormula("=sum(K" + (curRowNo - countWorkday) + ":K" + (curRowNo - 1) + ")")
                .setNumberFormat("[hh]:mm");
              monthFormula += "K" + curRowNo + ",";
              // 土曜日が月末
              if (lastDay == 6 && date.getDate() == lastDayOfMonth.getDate()) {
                curRowNo++;
                this.paintAuthRow(sheet, cols, curRowNo);
              }
            }

            // 日曜もしくは平日月末日
            if (dayOfWeek != 6 || isLastDay) {
              if (isLastDay) curRowNo++;
              this.paintAuthRow(sheet, cols, curRowNo);
            }
            countWorkday = 0;
          }

          // 月末の場合
          if (date.getDate() === lastDayOfMonth.getDate()) {
            curRowNo += 2;
            monthFormula += ")";
            sheet.getRange("A" + curRowNo + ":" + String.fromCharCode(65 + cols.length - 1) + curRowNo).setBackground("#d3d3d3");
            sheet.getRange("B" + curRowNo).setValue('人事労務freee勤怠記入完了日');
            sheet.getRange("D" + curRowNo).setBackground(null).setBorder(true, true, true, true, true, true);
            sheet.getRange("F" + curRowNo).setValue('月次勤務時間合計');
            sheet.getRange("H" + curRowNo).setBackground(null).setBorder(true, true, true, true, true, true)
              .setFormula(monthFormula).setNumberFormat("[hh]:mm");
            sheet.getRange("K" + curRowNo).setValue('承認');
            sheet.getRange("L" + curRowNo).setBackground(null).setBorder(true, true, true, true, true, true);
            curRowNo++;
            sheet.getRange("A" + curRowNo + ":" + String.fromCharCode(65 + cols.length - 1) + curRowNo).setBackground("#d3d3d3");
            curRowNo++;
            sheet.getRange("A" + curRowNo + ":" + String.fromCharCode(65 + cols.length - 1) + curRowNo).setBackground("#d3d3d3");
            sheet.getRange("I" + curRowNo).setValue('コーポレート管理部記入');
            sheet.getRange("K" + curRowNo + ":L" + curRowNo).setBackground(null).setBorder(true, true, true, true, true, true);
          }
        }
      }
      // 入力可能エリアを指定
      protectSpreadsheet(sheet, 'E:L', 'Slack / Admin でのみ入力可能');
    }

    this._sheets[username] = sheet;

    return sheet;
  };

  // 開始日の設定
  GSTimesheets.prototype._getRowNo = function (username, date, isSat) {
    var lastDayAdjustment = false;
    if (!date) date = DateUtils.now();
    if (!isSat) isSat = false;
    // 週間労働時間行の特定
    if (isSat) {
      var date = new Date();
      var nextSat = Moment.moment().day(6).toDate();
      // 直近の未来の土曜日が翌月だった場合 → 最終週
      if (Moment.moment(nextSat).month() !== Moment.moment().month()) {
        // 月末日
        date = Moment.moment().endOf('month').toDate();
        lastDayAdjustment = true;
      } else {
        // 直近の未来の土曜日にセット
        date = Moment.moment(nextSat).toDate();
      }
    }
    // 引数のdateが何週目かを判断し間行分を調整
    var propertiesEndRow = this.scheme.properties.length + 1;
    var headerRowNo = propertiesEndRow + 2;
    var rowNo = headerRowNo + 1;
    var startAt = DateUtils.parseDate(this.settings.get("開始日"));
    var endOfLastMonth = new Date(startAt[0], startAt[1] - 1, startAt[2], 0, 0, 0);

    // TODO: 土日出勤可能機能追加による依存性解消
    // 引数で渡された日から先月末の経過日数を計算して、行数を取得
    rowNo += parseInt((date.getTime() - date.getTimezoneOffset() * 60 * 1000) / (1000 * 24 * 60 * 60), 10)
      - parseInt((endOfLastMonth.getTime() - endOfLastMonth.getTimezoneOffset() * 60 * 1000) / (1000 * 24 * 60 * 60), 10);
    // TODO: 最終日の場合の検証が必要
    if (lastDayAdjustment) rowNo++;
    return rowNo;
  };

  GSTimesheets.prototype.get = function (username, date, isSat) {
    if (!isSat) isSat = false;
    var sheet = this._getSheet(username);
    var rowNo = this._getRowNo(username, date, isSat);
    var row = sheet.getRange("A" + rowNo + ":" + String.fromCharCode(65 + this.scheme.columns.length - 1) + rowNo).getValues()[0].map(function (v) {
      return v === '' ? undefined : v;
    });

    return ({
      user: username,
      date: row[0],
      day: row[1],
      willSignIn: row[2],
      willSignOut: row[3],
      willRest: row[4],
      willTotalCalc: row[5],
      signIn: row[6],
      authSignIn: row[7],
      signOut: row[8],
      rest: row[9],
      total: row[10],
      authSignOut: row[11],
      note: row[12]
    });
  };

  GSTimesheets.prototype.getNotes = function (username, date, isSat) {

    if (!isSat) isSat = false;
    var sheet = this._getSheet(username);
    var rowNo = this._getRowNo(username, date, isSat);

    // 出勤←→退勤まで
    var row = sheet.getRange("G" + rowNo + ":I" + rowNo)
      .getNotes()[0].map(function (v) {
        return (v === '' || v === '-') ? undefined : v;
      });

    return ({
      tsSignIn: row[0],
      tsSignOut: row[2],
    });
  };

  GSTimesheets.prototype.setNote = function (username, date, params) {

    var sheet = this._getSheet(username);
    var rowNo = this._getRowNo(username, date);

    if (params.signIn) {
      sheet.getRange("G" + rowNo).setNote(params.signIn)
    } else if (params.signOut) {
      sheet.getRange("I" + rowNo).setNote(params.signOut)
    }
  }

  // 各列に関数割り当て
  GSTimesheets.prototype.set = function (username, date, params) {
    var row = this.get(username, date);
    var sheet = this._getSheet(username);
    var rowNo = this._getRowNo(username, date);

    _.extend(row, _.pick(params, 'day', 'willSignIn', 'willSignOut', 'willRest', 'willTotalCalc',
      'signIn', 'authSignIn', 'signOut', 'rest', 'total', 'authSignOut', 'note'));

    // 合計労働時間と休憩時間を計算
    if (row.signIn != null && row.signOut != null) {
      row.total = DateUtils.calcTotalDate(row.signIn, row.signOut);
      row.rest = (DateUtils.calcTotalMinutes(row.signIn, row.signOut) >= 360) ? '1:00' : 0;
    }

    row.willRest = sheet.getRange("E" + rowNo).getFormula();
    row.willTotalCalc = sheet.getRange("F" + rowNo).getFormula();

    var data = [
      row.date,
      row.day,
      row.willSignIn,
      row.willSignOut,
      row.willRest,
      row.willTotalCalc,
      row.signIn,
      row.authSignIn,
      row.signOut,
      row.rest,
      row.total,
      row.authSignOut,
      row.note
    ].map(function (v) {
      return v == null ? '' : v;
    });
    sheet.getRange("A" + rowNo + ":" + String.fromCharCode(65 + this.scheme.columns.length - 1) + rowNo).setValues([data]);
    // HH:MM表記
    sheet.getRange("G" + rowNo).setNumberFormat("H:mm");
    sheet.getRange("I" + rowNo).setNumberFormat("H:mm");
    return row;
  };

  GSTimesheets.prototype.getUsers = function () {
    return _.compact(_.map(this.spreadsheet.getSheets(), function (s) {
      var name = s.getName();
      return String(name).substr(0, 1) == '_' ? undefined : name;
    }));
  };

  GSTimesheets.prototype.getByDate = function (date, isSat) {
    if (!isSat) isSat = false;
    var self = this;
    return _.map(this.getUsers(), function (username) {
      return self.get(username, date, isSat);
    });
  };

  // 休みの曜日を数字で返す
  GSTimesheets.prototype.getDayOff = function (username) {
    var sheet = this._getSheet(username);
    return DateUtils.parseWday(sheet.getRange("B2").getValue());
  };

  // シートの選択範囲を色で塗りつぶす
  GSTimesheets.prototype.paintCell = function (sheet, area, rowNo, color) {
    return sheet.getRange(area + rowNo + ":" + String.fromCharCode(65 + cols.length - 1) + curRowNo).setBackground(color);
  }

  GSTimesheets.prototype.paintAuthRow = function (sheet, cols, rowNo) {
    sheet.getRange("A" + rowNo + ":" + String.fromCharCode(65 + cols.length - 1) + rowNo).setBackground("#f5f5f5");
    sheet.getRange("E" + rowNo).setValue('承認');
    sheet.getRange("F" + rowNo).setBackground(null).setBorder(true, true, true, true, true, true);
    return sheet;
  }

  GSTimesheets.prototype.setHolidays = function (sheet, cols, curRowNo) {
    curRowNo++;
    sheet.getRange("A" + curRowNo + ":" + String.fromCharCode(65 + cols.length - 1) + curRowNo).setBackground("#d3d3d3");
    curRowNo++;
    sheet.getRange("A" + curRowNo + ":" + String.fromCharCode(65 + cols.length - 1) + curRowNo).setBackground("#d3d3d3");
    return [sheet, curRowNo]
  }

  // その週のデータを一括で取得して配列で返す
  GSTimesheets.prototype.getWeekDate = function (username, date, isSat) {
    if (!isSat) isSat = false;
    var sheet = this._getSheet(username);
    var rowNo = this._getRowNo(username, DateUtils.getThisWeekMonday(date), isSat);
    var weekData = sheet.getRange("A" + rowNo + ":" + String.fromCharCode(65 + this.scheme.columns.length - 1) + (rowNo + 4)).getValues()
      .map(function (row) {
        row.map(function (value) {
          return value === '' ? undefined : value;
        })
        return ({
          user: username,
          date: row[0],
          day: row[1],
          willSignIn: row[2],
          willSignOut: row[3],
          willRest: row[4],
          willTotalCalc: row[5],
          signIn: row[6],
          authSignIn: row[7],
          signOut: row[8],
          rest: row[9],
          total: row[10],
          authSignOut: row[11],
          note: row[12]
        });
      });

    return weekData;
  };

  GSTimesheets.prototype.createWeekdaysRow = function (sheet) {
    // 各行に日付を格納
    sheet.getRange("A" + curRowNo).setValue(DateUtils.format("Y/m/d", date));
    // 曜日を格納
    sheet.getRange("B" + curRowNo).setValue(dayOfWeekStr);
    // 予定列集計: 休憩時間
    sheet.getRange("E" + curRowNo)
      .setFormula('if(D' + curRowNo + '-C' + curRowNo + '>= 0.25, time(1, 0, 0), 0)')
      .setNumberFormat("h:mm");
    // 予定列集計: 合計労働時間
    sheet.getRange("F" + curRowNo)
      .setFormula('if(D' + curRowNo + '-C' + curRowNo + '>= 0.25,D' + curRowNo + '-C' + curRowNo + '-E' + curRowNo + ', D' + curRowNo + '-C' + curRowNo + ')')
      .setNumberFormat("h:mm");
    countWorkday++;

    return {
      "sheet": sheet,
      "countWorkday": countWorkday
    }
  }

  return GSTimesheets;
};

if (typeof exports !== 'undefined') {
  exports.GSTimesheets = loadGSTimesheets();
}
// scripts/gs_timesheets.js end
// import { GASProperties } from "./gas_properties";

// scripts/main.js begin
// 各モジュールの読み込み
var initLibraries = function () {
  if (typeof EventListener === 'undefined') EventListener = loadEventListener();
  if (typeof DateUtils === 'undefined') DateUtils = loadDateUtils();
  if (typeof GASProperties === 'undefined') GASProperties = loadGASProperties();
  if (typeof GSProperties === 'undefined') GSProperties = loadGSProperties();
  if (typeof GSTemplate === 'undefined') GSTemplate = loadGSTemplate();
  if (typeof GSTimesheets === 'undefined') GSTimesheets = loadGSTimesheets();
  if (typeof Timesheets === 'undefined') Timesheets = loadTimesheets();
  if (typeof Slack === 'undefined') Slack = loadSlack();
}

var init = function () {
  initLibraries();

  var globalSettings = new GASProperties();

  var spreadsheetId = globalSettings.get('SPREADSHEET');
  if (spreadsheetId) {
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    var settings = new GSProperties(spreadsheet);
    var template = new GSTemplate(spreadsheet);
    var slack = new Slack(settings.get('Slack Incoming URL'), template, settings);
    var storage = new GSTimesheets(spreadsheet, settings);
    var timesheets = new Timesheets(storage, settings, slack);
    return ({
      receiver: slack,
      timesheets: timesheets,
      storage: storage
    });
  }
}

// SlackのOutgoingから来るメッセージ
function doPost(e) {
  var miyamoto = init();
  miyamoto.receiver.receiveMessage(e.parameters);
}

// Time-based triggerで実行
// 出勤しましたか？確認
function confirmSignIn() {
  var miyamoto = init();
  miyamoto.timesheets.confirmSignIn();
}

// Time-based triggerで実行
// 退勤しましたか？確認
function confirmSignOut() {
  var miyamoto = init();
  miyamoto.timesheets.confirmSignOut();
}

// Time-based triggerで実行
// 承認しましたか？確認
function confirmAuth() {
  var miyamoto = init();
  miyamoto.timesheets.confirmAuth();
}

function showRestTime() {
  var miyamoto = init();
  miyamoto.timesheets.actionShowWeeeklyTime();
}

/**
 * 大阪か東京のGoogleドライブに存在するフォルダーを返す
 * @param {String} locationStr
 * @return {File} mainFolder
 */
function makeDirectory(locationStr) {

  // インターン勤怠フォルダを検索
  var internFolders = DriveApp.searchFolders("title = 'インターン勤怠'");
  var internFolder

  // 検索結果を検証
  while (internFolders.hasNext()) {
    var folder = internFolders.next()
    var name = folder.getName()
    if (name === 'インターン勤怠') {
      internFolder = folder
      break
    }
  }

  // フォルダが存在しない場合作成
  if (!internFolder) {
    internFolder = DriveApp.createFolder("インターン勤怠");
  }
  // インターンフォルダ配下にファイルが存在するかFolderIteratorに変換
  var parentFolder = internFolder.getFolders()

  var isExistOsaka = false
  var isExistTokyo = false
  var osakaFolderId = ''
  var tokyoFolderId = ''
  var mainFolder
  var locationList = ["大阪", "東京"];

  // インターン勤怠フォルダを検索し大阪・東京フォルダが存在するか
  while (parentFolder.hasNext()) {
    var folder = parentFolder.next();
    var folderName = folder.getName()
    var folderId = folder.getId()

    if (folderName === locationList[0]) {
      isExistOsaka = true
      osakaFolderId = folder.getId()
      break
    }
    if (folderName === locationList[1]) {
      isExistTokyo = true
      tokyoFolderId = folder.getId()
      break
    }
  }

  // 大阪・東京が存在しない場合は作成
  if (!isExistOsaka) {
    osakaFolderId = createDriveFile(locationList[0], 'folder', internFolder.getId())
  }
  if (!isExistTokyo) {
    tokyoFolderId = createDriveFile(locationList[1], 'folder', internFolder.getId())
  }

  // 対応フォルダのフォルダオブジェクトを格納（存在しない場合は親フォルダを）
  if (locationStr === '大阪') {
    mainFolder = DriveApp.getFolderById(osakaFolderId)
  } else if (locationStr === '東京') {
    mainFolder = DriveApp.getFolderById(tokyoFolderId)
  } else {
    mainFolder = DriveApp.getFolderById(internFolder.getId())
  }
  return mainFolder
}

/**
 * フォルダの存在確認
 * @folders FolderIterator
 * @year Number
 * @return String File clsss id
 */
function getThisYearFolderId(folders, year) {
  var fileId = ''
  while (folders.hasNext()) {
    var folder = folders.next();
    if (folder.getName() === String(year)) {
      fileId = folder.getId()
      break;
    }
  }
  return fileId;
}

// 初期化する
function setUp() {
  initLibraries();
  // spreadsheetが無かったら初期化
  var globalSettings = new GASProperties();

  var date = new Date();
  // 21日以降でScriptPropertyにspreadsheetが登録済みであった場合は翌月分とみなす
  var isNextSetup = (date.getDate() >= 21 && globalSettings.get('SPREADSHEET') ? true : false);
  if (isNextSetup) {
    date = Moment.moment().add('M', 1).toDate()
  }
  date.setDate(1);
  var month = date.getMonth() + 1;

  var location = globalSettings.get('INTERN_LOCATION');
  var pref = "";
  if (location) {
    pref = location.match(/大阪|東京/)[0];
  }

  var fileTitle = month + "月: " + pref + "インターン勤怠表";
  // 大阪・東京どちらかのフォルダIDを取得する
  var mainFolderId = globalSettings.get("MAIN_FOLDER_ID")
  var mainFolder = null

  // 存在しない場合はフォルダ作成/取得しScriptPropertyに登録
  if (!mainFolderId) {
    mainFolder = makeDirectory(pref)
    globalSettings.set("MAIN_FOLDER_ID", mainFolder.getId());
    mainFolderId = mainFolder.getId()
  }
  mainFolder = DriveApp.getFolderById(mainFolderId)
  var targetYear = date.getFullYear()
  // 1月のシート作成の場合は来年度のフォルダにする
  if (month === 1) targetYear + 1
  // 対象年度のフォルダが存在するか検証、存在しない際はフォルダ新規作成
  var yearFolderId = getThisYearFolderId(mainFolder.getFolders(), targetYear)
  if (!yearFolderId) {
    yearFolderId = createDriveFile(targetYear, 'folder', mainFolder.getId())
  }

  // スプレッドシートを任意の場所に新規作成
  var sheetId = createDriveFile(fileTitle, 'sheet', yearFolderId)
  var spreadsheet = SpreadsheetApp.openById(sheetId)
  // ファイル自体の共有設定 ※ シートの保護エリアではない
  var file = DriveApp.getFileById(spreadsheet.getId());
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
  var sheets = spreadsheet.getSheets();

  if (sheets.length == 1 && sheets[0].getLastRow() == 0) {
    sheets[0].setName('_設定');
    protectSpreadsheet(sheets[0], 'A:G', '設定ファイルのため保護化')
  }

  globalSettings.set((isNextSetup ? 'NEXT_SPREADSHEET' : 'SPREADSHEET'), spreadsheet.getId());

  var settings = new GSProperties(spreadsheet);
  settings.set('Slack Incoming URL', globalSettings.get('SLACK_INCOMING_URL'));
  settings.setNote('Slack Incoming URL', 'Slackのincoming URLを入力してください');
  settings.set('開始日', DateUtils.format("Y-m-d", DateUtils.toDate(date)));
  settings.setNote('開始日', '変更はしないでください');
  settings.set('無視するユーザ', 'miyamoto,hubot,slackbot,incoming-webhook, GitHub');
  settings.setNote('無視するユーザ', '反応をしないユーザを,区切りで設定する。botは必ず指定してください。');

  // 休日を設定 (iCal)
  var calendarId = 'ja.japanese#holiday@group.v.calendar.google.com';
  var calendar = CalendarApp.getCalendarById(calendarId);
  var startDate = date;
  var endDate = new Date(startDate.getFullYear(), startDate.getMonth());
  endDate.setMonth(endDate.getMonth() + 1);
  var holidays = _.map(calendar.getEvents(startDate, endDate), function (ev) {
    return DateUtils.format("Y-m-d", ev.getAllDayStartDate());
  });
  settings.set('休日', holidays.join(', '));
  settings.setNote('休日', '日付を,区切りで。月末までは自動設定されているので、以後は適当に更新してください');

  var miyamoto = init();
  miyamoto.receiver.send(month + "月の勤怠表できたで〜:100_2:\n" + spreadsheet.getUrl());

  // メッセージ用のシートを作成
  new GSTemplate(spreadsheet);

  ScriptApp.newTrigger("onChange")
    .forSpreadsheet(spreadsheet.getId())
    .onChange()
    .create();

  // 初回setUpのみ
  if (!isNextSetup) {
    // Slackで使用する確認系トリガー群
    setSlackConfirmTriggers();
    // 毎月のシート自動作成
    ScriptApp.newTrigger('setUp')
      .timeBased()
      .onMonthDay(30)
      .atHour(3)
      .create();
    ScriptApp.newTrigger("switchSpreadsheetId")
      .timeBased()
      .onMonthDay(1)
      .create();
  }
};

// Slackコマンドで起動する確認系トリガー群
function setSlackConfirmTriggers() {
  // 毎日12時頃に出勤してるかチェックする
  ScriptApp.newTrigger('confirmSignIn')
    .timeBased()
    .everyDays(1)
    .atHour(12)
    .create();
  // 毎日20時頃に退勤してるかチェックする
  ScriptApp.newTrigger('confirmSignOut')
    .timeBased()
    .everyDays(1)
    .atHour(20)
    .create();
  // 毎日13時に未承認の人がいたら承認リマインド
  ScriptApp.newTrigger('confirmAuth')
    .timeBased()
    .everyDays(1)
    .atHour(13)
    .create();
  // 毎日21時に未承認の人がいたら承認リマインド
  ScriptApp.newTrigger('confirmAuth')
    .timeBased()
    .everyDays(1)
    .atHour(21)
    .create();
  ScriptApp.newTrigger('showRestTime')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.THURSDAY)
    .atHour(10)
    .nearMinute(30)
    .create();
}

/* バージョンアップ処理を行う */
function migrate() {
  if (typeof GASProperties === 'undefined') GASProperties = loadGASProperties();

  var globalSettings = new GASProperties();
  globalSettings.set('version', "::VERSION::");
  var msg = "バージョンアップが完了しました。";
  console.log(msg);
}

function test1(e) {
  var miyamoto = init();
  miyamoto.receiver.receiveMessage({
    "user_name": ["nago"],
    "text": [
      "_bye_" + Moment.moment().hour() + ":" + Moment.moment().minute()
    ],
    timestamp: Moment.moment().valueOf().toString() + "." + "000075"
  });
}

function test2(e) {
  var miyamoto = init();
  var date = new Date();
  miyamoto.receiver.receiveMessage({
    user_name: "nago",
    text: Utilities.formatString("time %s", DateUtils.format("Y/m/d", date)),
  });
}

function testMonth(e) {
  var miyamoto = init();
  var date = new Date();
  var lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  for (var i = 1; i <= lastDayOfMonth.getDate(); i++) {
    date.setDate(i);
    var dayOfWeek = date.getDay();
    if (dayOfWeek == 0 || dayOfWeek == 6) continue;
    miyamoto.receiver.receiveMessage({
      user_name: "suzuuuki",
      text: Utilities.formatString("hi %s 10:00", DateUtils.format("Y/m/d", date))
    });
    miyamoto.receiver.receiveMessage({
      user_name: "suzuuuki",
      text: Utilities.formatString("bye %s 19:00", DateUtils.format("Y/m/d", date))
    });
  }
}

// スプレッドシートIDの参照を切り替える
function switchSpreadsheetId() {
  initLibraries();
  var globalSettings = new GASProperties();

  var oldSheet = globalSettings.get('SPREADSHEET');
  var newSheet = globalSettings.get('NEXT_SPREADSHEET');

  var setOutput = globalSettings.set('SPREADSHEET', newSheet);

  if (!globalSettings.set('OLD_SPREADSHEET', oldSheet)) Logger.log('セット失敗')

  if (oldSheet === setOutput) {
    Logger.log('シートの置き換えに失敗しました')
    return false;
  };

  var miyamoto = init();
  var message;

  if (globalSettings.remove('NEXT_SPREADSHEET')) {

    Logger.log('>>>>>>>>>>>> 翌月のシートIDをScriptPropertyから削除しました')

    // 先月から作成していたトリガーを全削除し、今月に必要なトリガーのみ再定義
    delAllTrigger()

    // Slackで使う確認系のトリガー群
    setSlackConfirmTriggers();

    ScriptApp.newTrigger("onChange")
      .forSpreadsheet(setOutput)
      .onChange()
      .create();

    message = '今月のスプレッドシートに切り替えました';

  } else {
    Logger.log('>>>>>>>>>>>> 翌月のシートIDをScriptPropertyから削除出来ません')
    message = '削除出来てません';
  }
  miyamoto.receiver.send(message);
}

// 一番最初の親スレッドを辿り、ユーザーIDを返す
function findThread(message) {
  var globalSettings = new GASProperties();
  var token = globalSettings.get('SLACK_TOKEN');
  var apiUrl = 'https://slack.com/api/channels.replies?token=' + token;
  apiUrl += '&channel=' + message.channel_id + '&thread_ts=' + message.thread_ts + '&pretty=1';
  var response = UrlFetchApp.fetch(apiUrl);
  var content = JSON.parse(response.getContentText());
  var miyamotoText = content.messages[0].text;
  var textComponent = miyamotoText.split(' ');
  var text1 = textComponent[0];
  var userId = text1.substring((text1.indexOf('<') + 2), text1.indexOf('>'));
  var repliedDate = miyamotoText.substring((miyamotoText.indexOf('(') + 1), miyamotoText.indexOf(')'));
  var text2 = textComponent[1];
  var text2prefix = text2.substring(0, 2);
  var flg = jadgeInOrOut(text2prefix);
  var ary = [userId, flg, repliedDate];

  return ary;
}

// 正規表現でみやもとbotが返信した先頭文字を判断し出退勤をフラグ表示
function jadgeInOrOut(text2prefix) {
  var isSignIn;
  var regex = new RegExp(text2prefix);
  if (regex.test("おは") || regex.test("出勤")) {
    isSignIn = true;
  } else if (regex.test("お疲") || regex.test("退勤")) {
    isSignIn = false;
  }
  return isSignIn;
}

/**
 * @userId:    SlackユーザーID
 * @stringKey: SlackAPIの中から取得したい値をキーで指定
 * @isProf: SlackAPIにてどこの箇所の項目かを示す 詳細は slack api users.infoにて
 */
function getUserInfo(userId, stringKey, isProf) {
  if (typeof isProf === 'undefined') isProf = false;
  var globalSettings = new GASProperties();
  var token = globalSettings.get('SLACK_TOKEN');
  var apiUrl = 'https://slack.com/api/users.info?token=' + token + '&user=' + userId + '&pretty=1';
  var response = UrlFetchApp.fetch(apiUrl);
  var content = JSON.parse(response.getContentText());
  var output;

  if (!isProf) {
    Object.keys(content.user).forEach(function (key) {
      if (stringKey === key) {
        output = content.user[key];
      }
    });
  } else {
    Object.keys(content.user.profile).forEach(function (key) {
      if (stringKey === key) {
        output = content.user.profile[key];
      }
    });
  }
  return output;
}

// 毎月月末の１週間前に翌月分のシートを生成、トリガーは毎月1日に張り直し
// トリガーの全削除
function delAllTrigger() {
  var triggers = ScriptApp.getProjectTriggers();

  // トリガーが設定済みかを判断　→ 有効なトリガーを再設定
  if (triggers.indexOf("setUp") === -1 && triggers.indexOf("switchSpreadsheetId") === -1) {

    // 月末から7日前の日付
    var sevenDaysDatePreviously = Moment.moment().endOf('month').add(-7, 'days').toDate().getDate();

    // 毎月のシート自動作成
    ScriptApp.newTrigger('setUp')
      .timeBased()
      .onMonthDay(sevenDaysDatePreviously)
      .create();

    // 毎月1日に先月のシートから当月のシートへと切り替え
    ScriptApp.newTrigger("switchSpreadsheetId")
      .timeBased()
      .onMonthDay(1)
      .create();
  }

  // 翌月のシート生成＆シート切り替えトリガー以外の不要なトリガーを全削除
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i] !== 'setUp' && triggers[i] !== 'switchSpreadsheetId') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

/**
 * シート変更を検知しインターンカレンダーに予定を同期
 * 変更行が明日以降の日付行なら登録・更新・削除に対応
 */
function onChange() {

  // 独自クラスを使えるようにセットアップ
  initLibraries();

  var sheet = SpreadsheetApp.getActiveSheet();
  var spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
  var globalSettings = new GASProperties();

  if ('_設定' === sheet.getName()) return null

  // TODO: リソースファイル化し同期
  if ('_メッセージ' === sheet.getName()) return null

  // セルの編集終了を待つ
  Utilities.sleep(3000);

  var cell = sheet.getActiveCell();
  var activeRow = cell.getRow();

  // 予定行(C:D)以外を編集していた場合は処理終了
  if (cell.getColumn() !== 3 && cell.getColumn() !== 4) return null
  var dateCell = new Date(sheet.getRange("A" + activeRow).getValue());
  var today = new Date();

  // 変更行が明日以降かを判断 →　当日や過去の予定行の変更はカレンダーに同期しない為
  var isAfterTomorrow = (today < dateCell);

  if (!isAfterTomorrow) {
    Browser.msgBox("当日、または過去の勤怠予定はインターンカレンダーに同期されません。\n 変更がある際は連絡して下さい。");
    return null;
  }

  var changedSignOutCell = sheet.getRange("D" + activeRow).getValue();
  var changedSignInCell = sheet.getRange("C" + activeRow).getValue();

  var isDeleted = false;

  Utilities.sleep(1000);

  if (changedSignInCell !== '' && changedSignOutCell !== '') {

    try {
      var willSignOutCell = DateUtils.format("H:M:s", changedSignOutCell);
      var willSignInCell = DateUtils.format("H:M:s", changedSignInCell);
    } catch (e) {
      Logger.log('Fetch threw an exception: ' + e);
    }
  } else {
    isDeleted = true;
  }

  // 範囲内のセルか
  var scheduledDate = DateUtils.format("Y/m/d", sheet.getRange("A" + activeRow).getValue());

  var calendarId, calendar;

  // 本番用のカレンダーIDを取得、ない場合はGASオーナーのデフォルトカレンダーID
  var registeredCalendarId = globalSettings.get('INTERN_CALENDAR');

  if (registeredCalendarId) {
    calendarId = registeredCalendarId;
    calendar = CalendarApp.getCalendarById(calendarId);
  } else {
    calendar = CalendarApp.getDefaultCalendar();
    calendarId = calendar.getId();
  }

  var user = getUserProfile(sheet.getName(), "last_name");
  var title = (user === null ? sheet.getName() : user) + "さん";
  var email = getUserProfile(sheet.getName(), "email")
  console.log('onChange: %s, %s', title, email)

  var startTime = new Date(sheet.getRange("A" + activeRow).getValue());
  var endTime;

  if (!isDeleted) {
    startTime = new Date(scheduledDate + ' ' + willSignInCell);
    endTime = new Date(scheduledDate + ' ' + willSignOutCell);
  }

  // 変更行の日付で同じタイトルのイベントを検索
  var events = calendar.getEventsForDay(new Date(startTime), {
    search: title
  });
  var hitEvents = Object.keys(events).length;
  // 検索結果のイベントIDを取得
  if (hitEvents != 0) var gotId = events[0].getId().split('@')[0];
  var internLocation = globalSettings.get('INTERN_LOCATION');

  var event = {
    summary: title,
    description: 'tambourine インターン',
    location: (internLocation !== null ? internLocation : null),
    attendees: [{
      email: (email !== null ? email : null)
    }],
    color: 11
  };

  if (!isDeleted) {
    event.start = {
      dateTime: startTime.toISOString()
    };
    event.end = {
      dateTime: endTime.toISOString()
    };
  }

  if (hitEvents == 0) {
    // イベントがない場合は新規作成
    event = Calendar.Events.insert(event, calendarId);
    spreadSheet.toast(scheduledDate + "の勤怠予定を登録しました。", '登録完了', 3);

  } else if (hitEvents != 0) {
    // 既存イベント更新
    try {
      if (!isDeleted) {
        event = Calendar.Events.update(
          event,
          calendarId,
          gotId
        );
        spreadSheet.toast(scheduledDate + "の勤怠予定を更新しました。", '更新完了', 3);
      } else {
        events[0].deleteEvent();
        spreadSheet.toast(scheduledDate + "の勤怠予定を削除しました。", '削除完了', 3);
      }
    } catch (e) {
      Logger.log('Fetch threw an exception: ' + e);
    }
  }
}

function requestUrl(url, urlFetchOptions) {
  var response = UrlFetchApp.fetch(url, urlFetchOptions);
  try {
    return {
      responseCode: response.getResponseCode(),
      rateLimit: {
        limit: response.getHeaders()['X-RateLimit-Limit'],
        remaining: response.getHeaders()['X-RateLimit-Remaining'],
      },
      parseError: false,
      body: JSON.parse(response.getContentText()),
      bodyText: response.getContentText()
    };
  } catch (e) {
    return {
      responseCode: response.getResponseCode(),
      rateLimit: {
        limit: response.getHeaders()['X-RateLimit-Limit'],
        remaining: response.getHeaders()['X-RateLimit-Remaining'],
      },
      // 何らかのエラーが発生した場合、parseError=trueにする
      parseError: true,
      // JSON.parse(response.getContent())で落ちる時があるので、そん時はbody=null返す
      // TODO:ただ、今は呼出元でnull返しの対処はしてない。。。
      body: null,
      bodyText: response.getContentText()
    };
  }
}

// messageからSlack本名をGASに登録
function registerUsersInfo(message) {
  var userName = String(message.user_name);
  var globalSettings = new GASProperties();
  var userId = String(message.user_id);

  try {
    var userRealName = getUserInfo(userId, "real_name");
    var email = getUserInfo(userId, "email", true)
    var fullName = userRealName.split('/')
    var fullNameRegex = fullName[1].trim().split(/\s+/g)
    var resultLastName = fullNameRegex[0]
    var resultFirstName = fullNameRegex[1]
    var user = {
      last_name: resultLastName,
      first_name: resultFirstName,
      id: message.user_id,
      email: email
    }
    globalSettings.set(userName, JSON.stringify(user));
    Logger.log('>>>>>>> %s \'s name set done: %s', userName, fullNameRegex);
  } catch (e) {
    Logger.log('>>>>>>> error: %s', e);
  }
}

// ScriptPropertyに登録されているユーザ情報から指定キーの値を返す
function getUserProfile(user_name, key) {
  initLibraries();
  var globalSettings = new GASProperties();
  var registeredName = globalSettings.get(user_name)
  if (registeredName === null) return null
  var user = JSON.parse(registeredName);
  var output = user[key]
  Logger.log('getUserProfile >>>> output: %s', output)
  return output
}

// シートの保護
function protectSpreadsheet(spreadsheet, area, message) {
  var protectedRange = spreadsheet.getRange(area).protect().setDescription(message);
  protectedRange.removeEditors(protectedRange.getEditors());
  var globalSettings = new GASProperties();
  var adminMl = globalSettings.get('ADMIN_ML');
  if (!adminMl) return null;
  var adminArray = GroupsApp.getGroupByEmail(adminMl).getUsers();
  if (adminArray) protectedRange.addEditors(adminArray);
}

function setOnChange() {

  initLibraries();
  var globalSettings = new GASProperties();
  var spreadsheetId = globalSettings.get('SPREADSHEET');

  ScriptApp.newTrigger("onChange")
    .forSpreadsheet(spreadsheetId)
    .onChange()
    .create();
}

function deleteOldSpreadsheetId() {

  initLibraries()
  var globalSettings = new GASProperties();

  var oldId = globalSettings.get('OLD_SPREADSHEET');

  var msg = '先月のスプレッドシートとの連携を解除しました'

  if (!oldId) {
    Logger.log('XXXXXXXXX 先月のシートIDが取得できてません')
    return false
  }

  if (globalSettings.remove('OLD_SPREADSHEET')) {
    Logger.log('>>>>>>>>>>>>>> %s', msg)
  } else {
    msg = '先月のシートIDをScriptPropertyから削除できませんでした'
  }
  var miyamoto = init();

  miyamoto.receiver.send(msg);
}

function setRestTime() {
  // 木曜10:30
  ScriptApp.newTrigger('showRestTime')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.THURSDAY)
    .atHour(10)
    .nearMinute(30)
    .create();

  // 金曜19:20
  ScriptApp.newTrigger('showRestTime')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.FRIDAY)
    .atHour(19)
    .nearMinute(20)
    .create();
}

function setDeleteSheet() {
  // 毎月のシート自動作成
  ScriptApp.newTrigger('deleteOldSpreadsheetId')
    .timeBased()
    .onMonthDay(10)
    .atHour(3)
    .create();
}

/**
 * @param {String} title
 * @param {String} type
 * @param {String} parentId
 * @return {String} DriveId
 */
function createDriveFile(title, type, parentId) {
  var mimeTypeList = [
    "application/vnd.google-apps.folder",
    "application/vnd.google-apps.spreadsheet"
  ]
  var mimeType = ''
  if (type.match(/folder/)) mimeType = mimeTypeList[0]
  if (type.match(/sheet/)) mimeType = mimeTypeList[1]

  var file = Drive.Files.insert({
    "title": title,
    "mimeType": mimeType,
    "parents": [{ "id": parentId }]
  });
  return file.id
}

/**
 * slackのtsから元の投稿を取得
 * @param slackのts(timestamp)
 * @returns Object json
 */
function getMessageByTimestamp(timestamp) {

  var token = globalSettings.get("SLACK_TOKEN")
  var channelId = globalSettings.get("CHANNEL_ID")

  var apiUrl = "https://slack.com/api/channels.history?token=" + token
    + "&channel=" + channelId + "&count=5&inclusive=true"
    + "&oldest=" + timestamp + "&pretty=1"
  // + "&latest=" + timestamp + "&oldest=" + timestamp + "&pretty=1"

  var response = UrlFetchApp.fetch(apiUrl);
  var content = JSON.parse(response.getContentText());

  return content
}

/**
 * テキストから宮本さんがスプレッドシートに記録した内容を取得
 * @param String slack[text]
 * @returns Array [
 *   userName: slackユーザ名,
 *   transCommand: 出勤 / 退勤の宮本コマンド文字列,
 *   strTime: YYYY/MM/DD HH:mm 形式での記録時間
 * ]
 */
function getUserNameByMessage(receivedText) {

  if (!receivedText) return null
  var regex = receivedText.match(/^<@(\w+)>\s+((出|退)+勤時間|(おは|お疲)).*\s+`+(\d+\/+\d+\/+\d+\s+\d+:\d+)`/)

  var userId = ''
  var strTime = ''
  var transCommand = ''

  if (!regex) return null

  if (regex[2].match(/出勤時間|おは/)) {
    transCommand = '_hi_ '
  } else if (regex[2].match(/退勤時間|お疲/)) {
    transCommand = '_bye_ '
  }

  userId = regex[1]
  strTime = regex[5]

  // idからnameを取得
  var userName = getUserInfo(userId, 'name')

  return [userName, transCommand, strTime]
}
// scripts/main.js end
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
//     Underscore.js 1.7.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.
(function(){var n=this,t=n._,r=Array.prototype,e=Object.prototype,u=Function.prototype,i=r.push,a=r.slice,o=r.concat,l=e.toString,c=e.hasOwnProperty,f=Array.isArray,s=Object.keys,p=u.bind,h=function(n){return n instanceof h?n:this instanceof h?void(this._wrapped=n):new h(n)};"undefined"!=typeof exports?("undefined"!=typeof module&&module.exports&&(exports=module.exports=h),exports._=h):n._=h,h.VERSION="1.7.0";var g=function(n,t,r){if(t===void 0)return n;switch(null==r?3:r){case 1:return function(r){return n.call(t,r)};case 2:return function(r,e){return n.call(t,r,e)};case 3:return function(r,e,u){return n.call(t,r,e,u)};case 4:return function(r,e,u,i){return n.call(t,r,e,u,i)}}return function(){return n.apply(t,arguments)}};h.iteratee=function(n,t,r){return null==n?h.identity:h.isFunction(n)?g(n,t,r):h.isObject(n)?h.matches(n):h.property(n)},h.each=h.forEach=function(n,t,r){if(null==n)return n;t=g(t,r);var e,u=n.length;if(u===+u)for(e=0;u>e;e++)t(n[e],e,n);else{var i=h.keys(n);for(e=0,u=i.length;u>e;e++)t(n[i[e]],i[e],n)}return n},h.map=h.collect=function(n,t,r){if(null==n)return[];t=h.iteratee(t,r);for(var e,u=n.length!==+n.length&&h.keys(n),i=(u||n).length,a=Array(i),o=0;i>o;o++)e=u?u[o]:o,a[o]=t(n[e],e,n);return a};var v="Reduce of empty array with no initial value";h.reduce=h.foldl=h.inject=function(n,t,r,e){null==n&&(n=[]),t=g(t,e,4);var u,i=n.length!==+n.length&&h.keys(n),a=(i||n).length,o=0;if(arguments.length<3){if(!a)throw new TypeError(v);r=n[i?i[o++]:o++]}for(;a>o;o++)u=i?i[o]:o,r=t(r,n[u],u,n);return r},h.reduceRight=h.foldr=function(n,t,r,e){null==n&&(n=[]),t=g(t,e,4);var u,i=n.length!==+n.length&&h.keys(n),a=(i||n).length;if(arguments.length<3){if(!a)throw new TypeError(v);r=n[i?i[--a]:--a]}for(;a--;)u=i?i[a]:a,r=t(r,n[u],u,n);return r},h.find=h.detect=function(n,t,r){var e;return t=h.iteratee(t,r),h.some(n,function(n,r,u){return t(n,r,u)?(e=n,!0):void 0}),e},h.filter=h.select=function(n,t,r){var e=[];return null==n?e:(t=h.iteratee(t,r),h.each(n,function(n,r,u){t(n,r,u)&&e.push(n)}),e)},h.reject=function(n,t,r){return h.filter(n,h.negate(h.iteratee(t)),r)},h.every=h.all=function(n,t,r){if(null==n)return!0;t=h.iteratee(t,r);var e,u,i=n.length!==+n.length&&h.keys(n),a=(i||n).length;for(e=0;a>e;e++)if(u=i?i[e]:e,!t(n[u],u,n))return!1;return!0},h.some=h.any=function(n,t,r){if(null==n)return!1;t=h.iteratee(t,r);var e,u,i=n.length!==+n.length&&h.keys(n),a=(i||n).length;for(e=0;a>e;e++)if(u=i?i[e]:e,t(n[u],u,n))return!0;return!1},h.contains=h.include=function(n,t){return null==n?!1:(n.length!==+n.length&&(n=h.values(n)),h.indexOf(n,t)>=0)},h.invoke=function(n,t){var r=a.call(arguments,2),e=h.isFunction(t);return h.map(n,function(n){return(e?t:n[t]).apply(n,r)})},h.pluck=function(n,t){return h.map(n,h.property(t))},h.where=function(n,t){return h.filter(n,h.matches(t))},h.findWhere=function(n,t){return h.find(n,h.matches(t))},h.max=function(n,t,r){var e,u,i=-1/0,a=-1/0;if(null==t&&null!=n){n=n.length===+n.length?n:h.values(n);for(var o=0,l=n.length;l>o;o++)e=n[o],e>i&&(i=e)}else t=h.iteratee(t,r),h.each(n,function(n,r,e){u=t(n,r,e),(u>a||u===-1/0&&i===-1/0)&&(i=n,a=u)});return i},h.min=function(n,t,r){var e,u,i=1/0,a=1/0;if(null==t&&null!=n){n=n.length===+n.length?n:h.values(n);for(var o=0,l=n.length;l>o;o++)e=n[o],i>e&&(i=e)}else t=h.iteratee(t,r),h.each(n,function(n,r,e){u=t(n,r,e),(a>u||1/0===u&&1/0===i)&&(i=n,a=u)});return i},h.shuffle=function(n){for(var t,r=n&&n.length===+n.length?n:h.values(n),e=r.length,u=Array(e),i=0;e>i;i++)t=h.random(0,i),t!==i&&(u[i]=u[t]),u[t]=r[i];return u},h.sample=function(n,t,r){return null==t||r?(n.length!==+n.length&&(n=h.values(n)),n[h.random(n.length-1)]):h.shuffle(n).slice(0,Math.max(0,t))},h.sortBy=function(n,t,r){return t=h.iteratee(t,r),h.pluck(h.map(n,function(n,r,e){return{value:n,index:r,criteria:t(n,r,e)}}).sort(function(n,t){var r=n.criteria,e=t.criteria;if(r!==e){if(r>e||r===void 0)return 1;if(e>r||e===void 0)return-1}return n.index-t.index}),"value")};var m=function(n){return function(t,r,e){var u={};return r=h.iteratee(r,e),h.each(t,function(e,i){var a=r(e,i,t);n(u,e,a)}),u}};h.groupBy=m(function(n,t,r){h.has(n,r)?n[r].push(t):n[r]=[t]}),h.indexBy=m(function(n,t,r){n[r]=t}),h.countBy=m(function(n,t,r){h.has(n,r)?n[r]++:n[r]=1}),h.sortedIndex=function(n,t,r,e){r=h.iteratee(r,e,1);for(var u=r(t),i=0,a=n.length;a>i;){var o=i+a>>>1;r(n[o])<u?i=o+1:a=o}return i},h.toArray=function(n){return n?h.isArray(n)?a.call(n):n.length===+n.length?h.map(n,h.identity):h.values(n):[]},h.size=function(n){return null==n?0:n.length===+n.length?n.length:h.keys(n).length},h.partition=function(n,t,r){t=h.iteratee(t,r);var e=[],u=[];return h.each(n,function(n,r,i){(t(n,r,i)?e:u).push(n)}),[e,u]},h.first=h.head=h.take=function(n,t,r){return null==n?void 0:null==t||r?n[0]:0>t?[]:a.call(n,0,t)},h.initial=function(n,t,r){return a.call(n,0,Math.max(0,n.length-(null==t||r?1:t)))},h.last=function(n,t,r){return null==n?void 0:null==t||r?n[n.length-1]:a.call(n,Math.max(n.length-t,0))},h.rest=h.tail=h.drop=function(n,t,r){return a.call(n,null==t||r?1:t)},h.compact=function(n){return h.filter(n,h.identity)};var y=function(n,t,r,e){if(t&&h.every(n,h.isArray))return o.apply(e,n);for(var u=0,a=n.length;a>u;u++){var l=n[u];h.isArray(l)||h.isArguments(l)?t?i.apply(e,l):y(l,t,r,e):r||e.push(l)}return e};h.flatten=function(n,t){return y(n,t,!1,[])},h.without=function(n){return h.difference(n,a.call(arguments,1))},h.uniq=h.unique=function(n,t,r,e){if(null==n)return[];h.isBoolean(t)||(e=r,r=t,t=!1),null!=r&&(r=h.iteratee(r,e));for(var u=[],i=[],a=0,o=n.length;o>a;a++){var l=n[a];if(t)a&&i===l||u.push(l),i=l;else if(r){var c=r(l,a,n);h.indexOf(i,c)<0&&(i.push(c),u.push(l))}else h.indexOf(u,l)<0&&u.push(l)}return u},h.union=function(){return h.uniq(y(arguments,!0,!0,[]))},h.intersection=function(n){if(null==n)return[];for(var t=[],r=arguments.length,e=0,u=n.length;u>e;e++){var i=n[e];if(!h.contains(t,i)){for(var a=1;r>a&&h.contains(arguments[a],i);a++);a===r&&t.push(i)}}return t},h.difference=function(n){var t=y(a.call(arguments,1),!0,!0,[]);return h.filter(n,function(n){return!h.contains(t,n)})},h.zip=function(n){if(null==n)return[];for(var t=h.max(arguments,"length").length,r=Array(t),e=0;t>e;e++)r[e]=h.pluck(arguments,e);return r},h.object=function(n,t){if(null==n)return{};for(var r={},e=0,u=n.length;u>e;e++)t?r[n[e]]=t[e]:r[n[e][0]]=n[e][1];return r},h.indexOf=function(n,t,r){if(null==n)return-1;var e=0,u=n.length;if(r){if("number"!=typeof r)return e=h.sortedIndex(n,t),n[e]===t?e:-1;e=0>r?Math.max(0,u+r):r}for(;u>e;e++)if(n[e]===t)return e;return-1},h.lastIndexOf=function(n,t,r){if(null==n)return-1;var e=n.length;for("number"==typeof r&&(e=0>r?e+r+1:Math.min(e,r+1));--e>=0;)if(n[e]===t)return e;return-1},h.range=function(n,t,r){arguments.length<=1&&(t=n||0,n=0),r=r||1;for(var e=Math.max(Math.ceil((t-n)/r),0),u=Array(e),i=0;e>i;i++,n+=r)u[i]=n;return u};var d=function(){};h.bind=function(n,t){var r,e;if(p&&n.bind===p)return p.apply(n,a.call(arguments,1));if(!h.isFunction(n))throw new TypeError("Bind must be called on a function");return r=a.call(arguments,2),e=function(){if(!(this instanceof e))return n.apply(t,r.concat(a.call(arguments)));d.prototype=n.prototype;var u=new d;d.prototype=null;var i=n.apply(u,r.concat(a.call(arguments)));return h.isObject(i)?i:u}},h.partial=function(n){var t=a.call(arguments,1);return function(){for(var r=0,e=t.slice(),u=0,i=e.length;i>u;u++)e[u]===h&&(e[u]=arguments[r++]);for(;r<arguments.length;)e.push(arguments[r++]);return n.apply(this,e)}},h.bindAll=function(n){var t,r,e=arguments.length;if(1>=e)throw new Error("bindAll must be passed function names");for(t=1;e>t;t++)r=arguments[t],n[r]=h.bind(n[r],n);return n},h.memoize=function(n,t){var r=function(e){var u=r.cache,i=t?t.apply(this,arguments):e;return h.has(u,i)||(u[i]=n.apply(this,arguments)),u[i]};return r.cache={},r},h.delay=function(n,t){var r=a.call(arguments,2);return setTimeout(function(){return n.apply(null,r)},t)},h.defer=function(n){return h.delay.apply(h,[n,1].concat(a.call(arguments,1)))},h.throttle=function(n,t,r){var e,u,i,a=null,o=0;r||(r={});var l=function(){o=r.leading===!1?0:h.now(),a=null,i=n.apply(e,u),a||(e=u=null)};return function(){var c=h.now();o||r.leading!==!1||(o=c);var f=t-(c-o);return e=this,u=arguments,0>=f||f>t?(clearTimeout(a),a=null,o=c,i=n.apply(e,u),a||(e=u=null)):a||r.trailing===!1||(a=setTimeout(l,f)),i}},h.debounce=function(n,t,r){var e,u,i,a,o,l=function(){var c=h.now()-a;t>c&&c>0?e=setTimeout(l,t-c):(e=null,r||(o=n.apply(i,u),e||(i=u=null)))};return function(){i=this,u=arguments,a=h.now();var c=r&&!e;return e||(e=setTimeout(l,t)),c&&(o=n.apply(i,u),i=u=null),o}},h.wrap=function(n,t){return h.partial(t,n)},h.negate=function(n){return function(){return!n.apply(this,arguments)}},h.compose=function(){var n=arguments,t=n.length-1;return function(){for(var r=t,e=n[t].apply(this,arguments);r--;)e=n[r].call(this,e);return e}},h.after=function(n,t){return function(){return--n<1?t.apply(this,arguments):void 0}},h.before=function(n,t){var r;return function(){return--n>0?r=t.apply(this,arguments):t=null,r}},h.once=h.partial(h.before,2),h.keys=function(n){if(!h.isObject(n))return[];if(s)return s(n);var t=[];for(var r in n)h.has(n,r)&&t.push(r);return t},h.values=function(n){for(var t=h.keys(n),r=t.length,e=Array(r),u=0;r>u;u++)e[u]=n[t[u]];return e},h.pairs=function(n){for(var t=h.keys(n),r=t.length,e=Array(r),u=0;r>u;u++)e[u]=[t[u],n[t[u]]];return e},h.invert=function(n){for(var t={},r=h.keys(n),e=0,u=r.length;u>e;e++)t[n[r[e]]]=r[e];return t},h.functions=h.methods=function(n){var t=[];for(var r in n)h.isFunction(n[r])&&t.push(r);return t.sort()},h.extend=function(n){if(!h.isObject(n))return n;for(var t,r,e=1,u=arguments.length;u>e;e++){t=arguments[e];for(r in t)c.call(t,r)&&(n[r]=t[r])}return n},h.pick=function(n,t,r){var e,u={};if(null==n)return u;if(h.isFunction(t)){t=g(t,r);for(e in n){var i=n[e];t(i,e,n)&&(u[e]=i)}}else{var l=o.apply([],a.call(arguments,1));n=new Object(n);for(var c=0,f=l.length;f>c;c++)e=l[c],e in n&&(u[e]=n[e])}return u},h.omit=function(n,t,r){if(h.isFunction(t))t=h.negate(t);else{var e=h.map(o.apply([],a.call(arguments,1)),String);t=function(n,t){return!h.contains(e,t)}}return h.pick(n,t,r)},h.defaults=function(n){if(!h.isObject(n))return n;for(var t=1,r=arguments.length;r>t;t++){var e=arguments[t];for(var u in e)n[u]===void 0&&(n[u]=e[u])}return n},h.clone=function(n){return h.isObject(n)?h.isArray(n)?n.slice():h.extend({},n):n},h.tap=function(n,t){return t(n),n};var b=function(n,t,r,e){if(n===t)return 0!==n||1/n===1/t;if(null==n||null==t)return n===t;n instanceof h&&(n=n._wrapped),t instanceof h&&(t=t._wrapped);var u=l.call(n);if(u!==l.call(t))return!1;switch(u){case"[object RegExp]":case"[object String]":return""+n==""+t;case"[object Number]":return+n!==+n?+t!==+t:0===+n?1/+n===1/t:+n===+t;case"[object Date]":case"[object Boolean]":return+n===+t}if("object"!=typeof n||"object"!=typeof t)return!1;for(var i=r.length;i--;)if(r[i]===n)return e[i]===t;var a=n.constructor,o=t.constructor;if(a!==o&&"constructor"in n&&"constructor"in t&&!(h.isFunction(a)&&a instanceof a&&h.isFunction(o)&&o instanceof o))return!1;r.push(n),e.push(t);var c,f;if("[object Array]"===u){if(c=n.length,f=c===t.length)for(;c--&&(f=b(n[c],t[c],r,e)););}else{var s,p=h.keys(n);if(c=p.length,f=h.keys(t).length===c)for(;c--&&(s=p[c],f=h.has(t,s)&&b(n[s],t[s],r,e)););}return r.pop(),e.pop(),f};h.isEqual=function(n,t){return b(n,t,[],[])},h.isEmpty=function(n){if(null==n)return!0;if(h.isArray(n)||h.isString(n)||h.isArguments(n))return 0===n.length;for(var t in n)if(h.has(n,t))return!1;return!0},h.isElement=function(n){return!(!n||1!==n.nodeType)},h.isArray=f||function(n){return"[object Array]"===l.call(n)},h.isObject=function(n){var t=typeof n;return"function"===t||"object"===t&&!!n},h.each(["Arguments","Function","String","Number","Date","RegExp"],function(n){h["is"+n]=function(t){return l.call(t)==="[object "+n+"]"}}),h.isArguments(arguments)||(h.isArguments=function(n){return h.has(n,"callee")}),"function"!=typeof/./&&(h.isFunction=function(n){return"function"==typeof n||!1}),h.isFinite=function(n){return isFinite(n)&&!isNaN(parseFloat(n))},h.isNaN=function(n){return h.isNumber(n)&&n!==+n},h.isBoolean=function(n){return n===!0||n===!1||"[object Boolean]"===l.call(n)},h.isNull=function(n){return null===n},h.isUndefined=function(n){return n===void 0},h.has=function(n,t){return null!=n&&c.call(n,t)},h.noConflict=function(){return n._=t,this},h.identity=function(n){return n},h.constant=function(n){return function(){return n}},h.noop=function(){},h.property=function(n){return function(t){return t[n]}},h.matches=function(n){var t=h.pairs(n),r=t.length;return function(n){if(null==n)return!r;n=new Object(n);for(var e=0;r>e;e++){var u=t[e],i=u[0];if(u[1]!==n[i]||!(i in n))return!1}return!0}},h.times=function(n,t,r){var e=Array(Math.max(0,n));t=g(t,r,1);for(var u=0;n>u;u++)e[u]=t(u);return e},h.random=function(n,t){return null==t&&(t=n,n=0),n+Math.floor(Math.random()*(t-n+1))},h.now=Date.now||function(){return(new Date).getTime()};var _={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","`":"&#x60;"},w=h.invert(_),j=function(n){var t=function(t){return n[t]},r="(?:"+h.keys(n).join("|")+")",e=RegExp(r),u=RegExp(r,"g");return function(n){return n=null==n?"":""+n,e.test(n)?n.replace(u,t):n}};h.escape=j(_),h.unescape=j(w),h.result=function(n,t){if(null==n)return void 0;var r=n[t];return h.isFunction(r)?n[t]():r};var x=0;h.uniqueId=function(n){var t=++x+"";return n?n+t:t},h.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};var A=/(.)^/,k={"'":"'","\\":"\\","\r":"r","\n":"n","\u2028":"u2028","\u2029":"u2029"},O=/\\|'|\r|\n|\u2028|\u2029/g,F=function(n){return"\\"+k[n]};h.template=function(n,t,r){!t&&r&&(t=r),t=h.defaults({},t,h.templateSettings);var e=RegExp([(t.escape||A).source,(t.interpolate||A).source,(t.evaluate||A).source].join("|")+"|$","g"),u=0,i="__p+='";n.replace(e,function(t,r,e,a,o){return i+=n.slice(u,o).replace(O,F),u=o+t.length,r?i+="'+\n((__t=("+r+"))==null?'':_.escape(__t))+\n'":e?i+="'+\n((__t=("+e+"))==null?'':__t)+\n'":a&&(i+="';\n"+a+"\n__p+='"),t}),i+="';\n",t.variable||(i="with(obj||{}){\n"+i+"}\n"),i="var __t,__p='',__j=Array.prototype.join,"+"print=function(){__p+=__j.call(arguments,'');};\n"+i+"return __p;\n";try{var a=new Function(t.variable||"obj","_",i)}catch(o){throw o.source=i,o}var l=function(n){return a.call(this,n,h)},c=t.variable||"obj";return l.source="function("+c+"){\n"+i+"}",l},h.chain=function(n){var t=h(n);return t._chain=!0,t};var E=function(n){return this._chain?h(n).chain():n};h.mixin=function(n){h.each(h.functions(n),function(t){var r=h[t]=n[t];h.prototype[t]=function(){var n=[this._wrapped];return i.apply(n,arguments),E.call(this,r.apply(h,n))}})},h.mixin(h),h.each(["pop","push","reverse","shift","sort","splice","unshift"],function(n){var t=r[n];h.prototype[n]=function(){var r=this._wrapped;return t.apply(r,arguments),"shift"!==n&&"splice"!==n||0!==r.length||delete r[0],E.call(this,r)}}),h.each(["concat","join","slice"],function(n){var t=r[n];h.prototype[n]=function(){return E.call(this,t.apply(this._wrapped,arguments))}}),h.prototype.value=function(){return this._wrapped},"function"==typeof define&&define.amd&&define("underscore",[],function(){return h})}).call(this);
//# sourceMappingURL=underscore-min.map
