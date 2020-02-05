// scripts/gs_template.js begin
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
