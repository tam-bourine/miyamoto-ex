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
