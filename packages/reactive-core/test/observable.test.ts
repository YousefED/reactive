import { autorun } from "../src/autorun";
import { reactive, isReactive } from "../src/observable";

describe("reactive", () => {
  it("should return a new reactive when empty object is provided", () => {
    const obs = reactive({});
    expect(isReactive(obs)).toEqual(true);
  });

  it("should return a reactive wrapping of an object argument", () => {
    const obj = { prop: "value" };
    const obs = reactive(obj);
    // Changed from NX
    expect(obs).not.toBe(obj); // should be different as one is a proxy wrapper
    expect(obs).toEqual(obj); // should be same when using deep equality check
    expect(isReactive(obs)).toEqual(true);
    expect(isReactive(obj)).toEqual(false);
  });

  it("should return the argument if it is already an reactive", () => {
    const obs1 = reactive({});
    const obs2 = reactive(obs1);
    expect(obs1).toEqual(obs2);
  });

  it("should return the same reactive wrapper when called repeatedly with the same argument", () => {
    const obj = { prop: "value" };
    const obs1 = reactive(obj);
    const obs2 = reactive(obj);
    expect(obs1).toEqual(obs2);
    expect(obs1).toBe(obs2);
  });

  it("should not throw on none writable nested objects, should simply not observe them instead", () => {
    let dummy;
    const obj: any = {};
    Object.defineProperty(obj, "prop", {
      value: { num: 12 },
      writable: false,
      configurable: false,
    });
    const obs = reactive(obj);
    expect(() => autorun(() => (dummy = obs.prop.num))).not.toThrow();
    expect(dummy).toEqual(12);
    obj.prop.num = 13;
    expect(dummy).toEqual(12);
  });

  // changed from NX, where it does NOT leak
  it("should let reactives leak into the underlying raw object", () => {
    const obj: any = {};
    const obs = reactive(obj);
    obs.nested1 = {};
    obs.nested2 = reactive({});
    expect(isReactive(obj.nested1)).toEqual(false);
    expect(isReactive(obj.nested2)).toEqual(true);
    expect(isReactive(obs.nested1)).toEqual(false);
    expect(isReactive(obs.nested2)).toEqual(true);
  });
});

describe("isReactive", () => {
  it("should return true if an reactive is passed as argument", () => {
    const obs = reactive({});
    const isObs = isReactive(obs);
    expect(isObs).toEqual(true);
  });

  it("should return false if a non reactive is passed as argument", () => {
    const obj1 = { prop: "value" };
    const obj2 = new Proxy({}, {});
    const isObs1 = isReactive(obj1);
    const isObs2 = isReactive(obj2);
    expect(isObs1).toEqual(false);
    expect(isObs2).toEqual(false);
  });

  it("should return false if a primitive is passed as argument", () => {
    expect(isReactive(12)).toEqual(false);
  });
});
