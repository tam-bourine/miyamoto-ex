import { contains, isNaN } from "underscore";

export class DateUtils {
  now: Number;
  setTime(now: any) {
    return (this.now = now);
  }
  dateUtilsNow(datetime: Date) {
    let _now = new Date();
    if (typeof datetime !== "undefined") {
      _now = datetime;
    }
    return this.setTime(_now);
  }

  dateUtilsParseTime(str: string) {
    str = String(str || "")
      .toLowerCase()
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => {
        return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
      });
    const reg = /((\d{1,2})\s*[:時]{1}\s*(\d{1,2})\s*(pm|)|(am|pm|午前|午後)\s*(\d{1,2})(\s*[:時]\s*(\d{1,2})|)|(\d{1,2})(\s*[:時]{1}\s*(\d{1,2})|)(am|pm)|(\d{1,2})\s*時)/;
    const matches = str.match(reg);
    if (matches) {
      let hour, min;

      // 1時20, 2:30, 3:00pm
      if (matches[2] != null) {
        hour = parseInt(matches[2], 10);
        min = parseInt(matches[3] ? matches[3] : "0", 10);
        if (contains(["pm"], matches[4])) {
          hour += 12;
        }
      }

      // 午後1 午後2時30 pm3
      if (matches[5] != null) {
        hour = parseInt(matches[6], 10);
        min = parseInt(matches[8] ? matches[8] : "0", 10);
        if (contains(["pm", "午後"], matches[5])) {
          hour += 12;
        }
      }

      // 1am 2:30pm
      if (matches[9] != null) {
        hour = parseInt(matches[9], 10);
        min = parseInt(matches[11] ? matches[11] : "0", 10);
        if (contains(["pm"], matches[12])) {
          hour += 12;
        }
      }

      // 14時
      if (matches[13] != null) {
        hour = parseInt(matches[13], 10);
        min = 0;
      }

      return [hour, min];
    }
    return null;
  }

  // テキストから日付を抽出
  dateUtilsParseDate(str: string) {
    const now = () => {
      let _now = new Date();
      return _now;
    };
    str = String(str || "")
      .toLowerCase()
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => {
        return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
      });

    if (str.match(/(明日|tomorrow)/)) {
      const tomorrow = new Date(
        now().getFullYear(),
        now().getMonth(),
        now().getDate() + 1
      );
      return [
        tomorrow.getFullYear(),
        tomorrow.getMonth() + 1,
        tomorrow.getDate()
      ];
    }

    if (str.match(/(今日|today)/)) {
      return [now().getFullYear(), now().getMonth() + 1, now().getDate()];
    }

    if (str.match(/(昨日|yesterday)/)) {
      const yesterday = new Date(
        now().getFullYear(),
        now().getMonth(),
        now().getDate() - 1
      );
      return [
        yesterday.getFullYear(),
        yesterday.getMonth() + 1,
        yesterday.getDate()
      ];
    }

    const reg = /((\d{4})[-\/年]{1}|)(\d{1,2})[-\/月]{1}(\d{1,2})/;
    const matches = str.match(reg);
    if (matches) {
      let year = parseInt(matches[2], 10);
      let month = parseInt(matches[3], 10);
      let day = parseInt(matches[4], 10);
      if (isNaN(year) || year < 1970) {
        year = now().getFullYear();
      }
      return [year, month, day];
    }

    return null;
  }

  dateUtilsParseWday = (str: string) => {
    str = String(str).replace(/曜日/g, "");
    const result = [];
    const wdays = [
      /(sun|日)/i,
      /(mon|月)/i,
      /(tue|火)/i,
      /(wed|水)/i,
      /(thu|木)/i,
      /(fri|金)/i,
      /(sat|土)/i
    ];
    for (let i = 0; i < wdays.length; ++i) {
      if (str.match(wdays[i])) result.push(i);
    }
    return result;
  };
}
