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
