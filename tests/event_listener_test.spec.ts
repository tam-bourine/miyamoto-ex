import { EventListener } from "../test_utils/event_listener_test";

const eventListener = new EventListener();
let results: any[];

describe("eventListener_eventListener", () => {
  it("eventListener_eventListenerOn: #1", () => {
    expect(
      eventListener.eventListenerOn("test1", e => {
        results.push("TEST1:" + e);
        expect(eventListener.eventListenerFireEvent("test1", "A")).toBe(
          results.length === 1 && results[0] === "TEST1:A"
        );
      })
    );
  });

  it("eventListener_eventListenerOn: #2", () => {
    expect(
      eventListener.eventListenerOn("test2", e => {
        results.push("TEST2:" + e);
        expect(eventListener.eventListenerFireEvent("test2", "B")).toBe(
          results.length === 2 &&
            results[0] === "TEST1:A" &&
            results[1] === "TEST2:B"
        );
      })
    );
  });

  it("eventListener_eventListenerOn: #3", () => {
    expect(
      eventListener.eventListenerOn("test1", e => {
        results.push("TEST2:" + e);
        expect(eventListener.eventListenerFireEvent("test1", "C")).toBe(
          results.length === 3 &&
            results[0] === "TEST1:A" &&
            results[1] === "TEST2:B" &&
            results[2] === "TEST1:C"
        );
      })
    );
  });
});
