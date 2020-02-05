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
