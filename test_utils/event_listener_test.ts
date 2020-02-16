// 日付関係の関数

export class EventListener {
  events = {};
  // イベントを捕捉
  eventListenerOn(eventName: string, func: any) :void{
    if (this.events[eventName]) {
      this.events[eventName].push(func);
    } else {
      this.events[eventName] = [func];
    }
  }

  // イベント発行
  eventListenerFireEvent(eventName: string, eventCategory: string) {
    const funcs = this.events[eventName];
    if (!funcs) return false;
    for (let i = 0; i < funcs.length; ++i) {
      funcs[i].apply(this, Array.prototype.slice.call(arguments, 1));
    }
  }
}
