import { isEqual } from "../node_modules/underscore";
import { DateUtils } from "../test_utils/date_utils_test";
import * as moment from "moment";

const dateUtils = new DateUtils();

describe("dateUtils_parseTime", () => {
  it("dateUtils_parseTime: #1", () => {
    const dateUtils_parseTime = () => {
      return isEqual([13, 1], dateUtils.dateUtilsParseTime("13:01"));
    };
    expect(dateUtils_parseTime()).toBe(true);
  });
  it("dateUtils_parseTime: #2", () => {
    const dateUtils_parseTime_test = () => {
      return isEqual([14, 2], dateUtils.dateUtilsParseTime("2:02pm"));
    };
    expect(dateUtils_parseTime_test()).toBe(true);
  });
  it("dateUtils_parseTime: #3", () => {
    const dateUtils_parseTime_test = () => {
      return isEqual([16, 3], dateUtils.dateUtilsParseTime("午後4:3"));
    };
    expect(dateUtils_parseTime_test()).toBe(true);
  });
  it("dateUtils_parseTime: #4", () => {
    const dateUtils_parseTime_test = () => {
      return isEqual([17, 0], dateUtils.dateUtilsParseTime("5pm"));
    };
    expect(dateUtils_parseTime_test()).toBe(true);
  });
  it("dateUtils_parseTime: #5", () => {
    const dateUtils_parseTime_test = () => {
      return isEqual([17, 1], dateUtils.dateUtilsParseTime("5:1pm"));
    };
    expect(dateUtils_parseTime_test()).toBe(true);
  });
  it("dateUtils_parseTime: #6", () => {
    const dateUtils_parseTime_test = () => {
      return isEqual([18, 0], dateUtils.dateUtilsParseTime("18時"));
    };
    expect(dateUtils_parseTime_test()).toBe(true);
  });
  it("dateUtils_parseTime: #7", () => {
    const dateUtils_parseTime_test = () => {
      return isEqual([19, 20], dateUtils.dateUtilsParseTime("19 : 20"));
    };
    expect(dateUtils_parseTime_test()).toBe(true);
  });
  it("dateUtils_parseTime: #8", () => {
    const dateUtils_parseTime_test = () => {
      return isEqual([20, 0], dateUtils.dateUtilsParseTime("午後８"));
    };
    expect(dateUtils_parseTime_test()).toBe(true);
  });
});

describe("dateUtils_parseDate", () => {
  it("dateUtils_parseDate: #1", () => {
    const dateUtils_parseDate = () => {
      dateUtils.dateUtilsNow(new Date(2019, 1 - 1, 1, 0, 0, 0));
      return isEqual([2019, 12, 31], dateUtils.dateUtilsParseDate("12/31"));
    };
    expect(dateUtils_parseDate()).toBe(true);
  });
  it("dateUtils_parseDate: #2", () => {
    const dateUtils_parseDate = () => {
      dateUtils.dateUtilsNow(new Date(2019, 1 - 1, 1, 0, 0, 0));
      return isEqual([2019, 1, 1], dateUtils.dateUtilsParseDate("1/1"));
    };
    expect(dateUtils_parseDate()).toBe(true);
  });
  it("dateUtils_parseDate: #3", () => {
    const dateUtils_parseDate = () => {
      dateUtils.dateUtilsNow(new Date(2019, 1 - 1, 1, 0, 0, 0));
      return isEqual([2019, 2, 3], dateUtils.dateUtilsParseDate("2月3日"));
    };
    expect(dateUtils_parseDate()).toBe(true);
  });
  it("dateUtils_parseDate: #4", () => {
    const dateUtils_parseDate = () => {
      dateUtils.dateUtilsNow(new Date(2019, 1 - 1, 1, 0, 0, 0));
      return isEqual([2020, 1, 1], dateUtils.dateUtilsParseDate("2020/1/1"));
    };
    expect(dateUtils_parseDate()).toBe(true);
  });
  it("dateUtils_parseDate: #5", () => {
    const dateUtils_parseDate = () => {
      dateUtils.dateUtilsNow(new Date(2019, 1 - 1, 1, 0, 0, 0));
      return isEqual(
        [1976, 2, 8],
        dateUtils.dateUtilsParseDate("1976年2月8日")
      );
    };
    expect(dateUtils_parseDate()).toBe(true);
  });
  it("dateUtils_parseDate: #6", () => {
    const dateUtils_parseDate = () => {
      dateUtils.dateUtilsNow(new Date(2019, 1 - 1, 1, 0, 0, 0));
      const nowYeary = Number(moment().format("YYYY"));
      const nowMonth = Number(moment().format("MM"));
      const nowDay = Number(
        moment()
          .add(-1, "days")
          .format("DD")
      );
      const yesterdayArray = new Array(nowYeary, nowMonth, nowDay);
      return isEqual(yesterdayArray, dateUtils.dateUtilsParseDate("昨日"));
    };
    expect(dateUtils_parseDate()).toBe(true);
  });
  it("dateUtils_parseDate: #7", () => {
    const dateUtils_parseDate = () => {
      dateUtils.dateUtilsNow(new Date(2019, 1 - 1, 1, 0, 0, 0));
      const nowYeary = Number(moment().format("YYYY"));
      const nowMonth = Number(moment().format("MM"));
      const nowDay = Number(moment().format("DD"));
      const todayArray = new Array(nowYeary, nowMonth, nowDay);
      return isEqual(todayArray, dateUtils.dateUtilsParseDate("今日"));
    };
    expect(dateUtils_parseDate()).toBe(true);
  });
  it("dateUtils_parseDate: #8", () => {
    const dateUtils_parseDate = () => {
      dateUtils.dateUtilsNow(new Date(2019, 1 - 1, 1, 0, 0, 0));
      const nowYeary = Number(moment().format("YYYY"));
      const nowMonth = Number(moment().format("MM"));
      const nowDay = Number(
        moment()
          .add(1, "days")
          .format("DD")
      );
      const tomorrowArray = new Array(nowYeary, nowMonth, nowDay);
      return isEqual(tomorrowArray, dateUtils.dateUtilsParseDate("明日"));
    };
    expect(dateUtils_parseDate()).toBe(true);
  });
});

describe("dateUtils_parseWday", () => {
  it("dateUtils_parseWday: #1", () => {
    const dateUtils_parseWday = () => {
      dateUtils.dateUtilsNow(new Date(2019, 1 - 1, 1, 0, 0, 0));
      return isEqual([3], dateUtils.dateUtilsParseWday("水曜日"));
    };
    expect(dateUtils_parseWday()).toBe(true);
  });

  it("dateUtils_parseWday: #2", () => {
    const dateUtils_parseWday = () => {
      dateUtils.dateUtilsNow(new Date(2019, 1 - 1, 1, 0, 0, 0));
      return isEqual([3], dateUtils.dateUtilsParseWday("Wed"));
    };
    expect(dateUtils_parseWday()).toBe(true);
  });

  it("dateUtils_parseWday: #3", () => {
    const dateUtils_parseWday = () => {
      dateUtils.dateUtilsNow(new Date(2019, 1 - 1, 1, 0, 0, 0));
      return isEqual([], dateUtils.dateUtilsParseWday("あ"));
    };
    expect(dateUtils_parseWday()).toBe(true);
  });

  it("dateUtils_parseWday: #4", () => {
    const dateUtils_parseWday = () => {
      dateUtils.dateUtilsNow(new Date(2019, 1 - 1, 1, 0, 0, 0));
      return isEqual([0, 1], dateUtils.dateUtilsParseWday("月日"));
    };
    expect(dateUtils_parseWday()).toBe(true);
  });
});
