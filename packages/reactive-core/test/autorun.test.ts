import { autorun, autorunAsync } from "../src/autorun";
import { reactive } from "../src/observable";
import { Observer } from "../src/observer";

// TODO: make sure in all cases we spy and check toHaveBeenCalledTimes.
describe("autorun", () => {
  it("should run the passed function once (wrapped by a reaction)", () => {
    const fnSpy = jest.fn(() => {});
    autorun(fnSpy);
    expect(fnSpy).toHaveBeenCalledTimes(1);
  });

  it("should autorun basic properties", () => {
    let dummy: any;
    const counter = reactive({ num: 0 });
    autorun(() => {
      dummy = counter.num;
    });

    expect(dummy).toEqual(0);
    counter.num = 7;
    expect(dummy).toEqual(7);
  });

  it("should autorun basic properties (async)", async () => {
    let dummy: any;
    const counter = reactive({ num: 0 });

    autorunAsync(async (counter) => {
      dummy = counter.num;
    }, counter);
    // let x = counter.num;
    expect(dummy).toEqual(0);
    counter.num = 7;
    expect(dummy).toEqual(7);
  });
  it("should autorun basic properties (async/await)", async () => {
    let dummy: any;
    const counter = reactive({ num: 0 });

    autorunAsync(async (counter) => {
      await 4;
      dummy = counter.num;
    }, counter);
    // let x = counter.num;
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(dummy).toEqual(0);
    counter.num = 7;
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(dummy).toEqual(7);
  });

  it("should autorun multiple properties", () => {
    let dummy;
    const counter = reactive({ num1: 0, num2: 0 });
    autorun(() => {
      dummy = counter.num1 + counter.num1 + counter.num2;
    });

    expect(dummy).toEqual(0);
    counter.num1 = counter.num2 = 7;
    expect(dummy).toEqual(21);
  });

  it("should handle multiple reactions", () => {
    let dummy1, dummy2;
    const counter = reactive({ num: 0 });
    autorun(() => {
      dummy1 = counter.num;
    });
    autorun(() => {
      dummy2 = counter.num;
    });

    expect(dummy1).toEqual(0);
    expect(dummy2).toEqual(0);
    counter.num++;
    expect(dummy1).toEqual(1);
    expect(dummy2).toEqual(1);
  });

  it("should autorun nested properties", () => {
    let dummy;
    const counter = reactive({ nested: { num: 0 } });
    autorun(() => {
      dummy = counter.nested.num;
    });

    expect(dummy).toEqual(0);
    counter.nested.num = 8;
    expect(dummy).toEqual(8);
  });

  it("should autorun delete operations", () => {
    let dummy;
    const obj = reactive({ prop: "value" as any });
    autorun(() => {
      dummy = obj.prop;
    });

    expect(dummy).toEqual("value");
    delete obj.prop;
    expect(dummy).toEqual(undefined);
  });

  it("should autorun has operations", () => {
    let dummy;
    const obj = reactive({ prop: "value" as any });
    autorun(() => {
      dummy = "prop" in obj;
    });

    expect(dummy).toEqual(true);
    delete obj.prop;
    expect(dummy).toEqual(false);
    obj.prop = 12;
    expect(dummy).toEqual(true);
  });

  it("should autorun properties on the prototype chain", () => {
    let dummy;
    const counter = reactive({ num: 0 as any });
    const parentCounter = reactive({ num: 2 });
    Object.setPrototypeOf(counter, parentCounter);
    autorun(() => {
      dummy = counter.num;
    });

    expect(dummy).toEqual(0);
    delete counter.num;
    expect(dummy).toEqual(2);
    parentCounter.num = 4;
    expect(dummy).toEqual(4);
    counter.num = 3;
    expect(dummy).toEqual(3);
  });

  it("should autorun has operations on the prototype chain", () => {
    let dummy;
    const counter = reactive({ num: 0 as any });
    const parentCounter = reactive({ num: 2 as any });
    Object.setPrototypeOf(counter, parentCounter);
    autorun(() => {
      dummy = "num" in counter;
    });

    expect(dummy).toEqual(true);
    delete counter.num;
    expect(dummy).toEqual(true);
    delete parentCounter.num;
    expect(dummy).toEqual(false);
    counter.num = 3;
    expect(dummy).toEqual(true);
  });

  it("should autorun inherited property accessors", () => {
    let dummy, parentDummy, hiddenValue: any;
    const obj = reactive({} as any);
    const parent = reactive({
      set prop(value) {
        hiddenValue = value;
      },
      get prop() {
        return hiddenValue;
      },
    });
    Object.setPrototypeOf(obj, parent);
    autorun(() => {
      dummy = obj.prop;
    });
    autorun(() => {
      parentDummy = parent.prop;
    });

    expect(dummy).toEqual(undefined);
    expect(parentDummy).toEqual(undefined);
    obj.prop = 4;
    expect(dummy).toEqual(4);
    // this doesn't work, should it?
    // expect(parentDummy).toEqual(4)
    parent.prop = 2;
    expect(dummy).toEqual(2);
    expect(parentDummy).toEqual(2);
  });

  it("should autorun function call chains", () => {
    let dummy;
    const counter = reactive({ num: 0 });
    autorun(() => {
      dummy = getNum();
    });

    function getNum() {
      return counter.num;
    }

    expect(dummy).toEqual(0);
    counter.num = 2;
    expect(dummy).toEqual(2);
  });

  it("should autorun iteration", () => {
    let dummy;
    const list = reactive(["Hello"]);
    autorun(() => {
      dummy = list.join(" ");
    });

    expect(dummy).toEqual("Hello");
    list.push("World!");
    expect(dummy).toEqual("Hello World!");
    list.shift();
    expect(dummy).toEqual("World!");
  });

  it("should autorun explicit array length changes", () => {
    let dummy;
    const list = reactive(["Hello", "World"]);
    autorun(() => {
      dummy = list[0];
    });

    expect(dummy).toEqual("Hello");
    list.length = 0;
    expect(dummy).toEqual(undefined);
  });

  it("should autorun implicit array length changes", () => {
    let dummy;
    const list = reactive(["Hello"]);
    autorun(() => {
      dummy = list.join(" ");
    });

    expect(dummy).toEqual("Hello");
    list[1] = "World!";
    expect(dummy).toEqual("Hello World!");
    list[3] = "Hello!";
    expect(dummy).toEqual("Hello World!  Hello!");
  });

  it("should autorun explicit array assignments (uninitialized)", () => {
    let dummy;
    const list = reactive([]) as any; // TODO
    autorun(() => {
      dummy = list[0];
    });

    expect(dummy).toEqual(undefined);
    list[0] = "Hello";
    expect(dummy).toEqual("Hello");
    list.pop();
    expect(dummy).toEqual(undefined);
  });

  it("should autorun explicit array assignments (initialized)", () => {
    let dummy;
    const list = reactive([]) as any; // TODO
    autorun(() => {
      dummy = list[0];
    });

    expect(dummy).toEqual(undefined);
    list[0] = "Hello";
    expect(dummy).toEqual("Hello");
    list.pop();
    expect(dummy).toEqual(undefined);
  });

  it("should autorun sparse array mutations", () => {
    let dummy;
    const list = reactive([]) as any; // TODO
    list[1] = "World!";
    autorun(() => {
      dummy = list.join(" ");
    });

    expect(dummy).toEqual(" World!");
    list[0] = "Hello";
    expect(dummy).toEqual("Hello World!");
    list.pop();
    expect(dummy).toEqual("Hello");
  });

  it("should autorun enumeration", () => {
    let dummy = 0;
    const numbers = reactive({ num1: 3 } as any);
    autorun(() => {
      dummy = 0;
      for (let key in numbers) {
        dummy += numbers[key];
      }
    });

    expect(dummy).toEqual(3);
    numbers.num2 = 4;
    expect(dummy).toEqual(7);
    delete numbers.num1;
    expect(dummy).toEqual(4);
  });

  // decided to not support Symbols
  it.skip("should autorun symbol keyed properties", () => {
    const key = Symbol("symbol keyed prop");
    let dummy, hasDummy;
    const obj = reactive({ [key]: "value" as any });
    autorun(() => {
      dummy = obj[key];
    });
    autorun(() => {
      hasDummy = key in obj;
    });

    expect(dummy).toEqual("value");
    expect(hasDummy).toEqual(true);
    obj[key] = "newValue";
    expect(dummy).toEqual("newValue");
    delete obj[key];
    expect(dummy).toEqual(undefined);
    expect(hasDummy).toEqual(false);
  });

  it("should not autorun well-known symbol keyed properties", () => {
    const key = Symbol.isConcatSpreadable;
    let dummy;
    const array = reactive([]) as any; // TODO
    autorun(() => (dummy = array[key]));

    expect(array[key]).toEqual(undefined);
    expect(dummy).toEqual(undefined);
    array[key] = true;
    expect(array[key]).toEqual(true);
    expect(dummy).toEqual(undefined);
  });

  it("should autorun function valued properties", () => {
    const oldFunc = () => {};
    const newFunc = () => {};

    let dummy;
    const obj = reactive({ func: oldFunc });
    autorun(() => {
      dummy = obj.func;
    });

    expect(dummy).toEqual(oldFunc);
    obj.func = newFunc;
    expect(dummy).toEqual(newFunc);
  });

  it("should not autorun set operations without a value change", () => {
    let hasDummy, getDummy;
    const obj = reactive({ prop: "value" });

    const getSpy = jest.fn(() => (getDummy = obj.prop));
    const hasSpy = jest.fn(() => (hasDummy = "prop" in obj));
    autorun(() => {
      getSpy();
    });
    autorun(() => {
      hasSpy();
    });

    expect(getDummy).toEqual("value");
    expect(hasDummy).toEqual(true);
    obj.prop = "value";
    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(hasSpy).toHaveBeenCalledTimes(1);
    expect(getDummy).toEqual("value");
    expect(hasDummy).toEqual(true);
  });

  /*
  it("should not autorun raw mutations", () => {
    let dummy;
    const obj = reactive({});
    autorun(() => (dummy = raw(obj).prop));

    expect(dummy).toEqual(undefined);
    obj.prop = "value";
    expect(dummy).toEqual(undefined);
  });

  it("should not be triggered by raw mutations", () => {
    let dummy;
    const obj = reactive({});
    autorun(() => (dummy = obj.prop));

    expect(dummy).toEqual(undefined);
    raw(obj).prop = "value";
    expect(dummy).toEqual(undefined);
  });

  it("should not be triggered by inherited raw setters", () => {
    let dummy, parentDummy, hiddenValue;
    const obj = reactive({});
    const parent = reactive({
      set prop(value) {
        hiddenValue = value;
      },
      get prop() {
        return hiddenValue;
      },
    });
    Object.setPrototypeOf(obj, parent);
    autorun(() => (dummy = obj.prop));
    autorun(() => (parentDummy = parent.prop));

    expect(dummy).toEqual(undefined);
    expect(parentDummy).toEqual(undefined);
    raw(obj).prop = 4;
    expect(dummy).toEqual(undefined);
    expect(parentDummy).toEqual(undefined);
  });*/

  it("should avoid implicit infinite recursive loops with itself", () => {
    const counter = reactive({ num: 0 });

    const counterSpy = jest.fn(() => counter.num++);

    const run = jest.fn(() =>
      autorun(() => {
        counterSpy();
      })
    );
    expect(run).toThrowError();
    expect(counterSpy).toHaveBeenCalledTimes(1);

    const update = jest.fn(() => (counter.num = 4));
    expect(update).toThrowError();
    expect(counterSpy).toHaveBeenCalledTimes(2);
  });

  it.skip("should allow explicitly recursive raw function loops", () => {
    const counter = reactive({ num: 0 });

    // TODO: this should be changed to reaction loops, can it be done?
    const numSpy = jest.fn(() => {
      counter.num++;
      if (counter.num < 10) {
        numSpy();
      }
    });
    autorun(numSpy);

    expect(counter.num).toEqual(10);
    expect(numSpy).toHaveBeenCalledTimes(10);
  });

  it("should avoid infinite loops with other reactions", () => {
    const nums = reactive({ num1: 0, num2: 1 });

    const spy1 = jest.fn(() => (nums.num1 = nums.num2));
    const spy2 = jest.fn(() => (nums.num2 = nums.num1));
    autorun(() => {
      spy1();
    });
    autorun(() => {
      spy2();
    });
    expect(nums.num1).toEqual(1);
    expect(nums.num2).toEqual(1);
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
    nums.num2 = 4;
    expect(nums.num1).toEqual(4);
    expect(nums.num2).toEqual(4);
    expect(spy1).toHaveBeenCalledTimes(2);
    expect(spy2).toHaveBeenCalledTimes(2);
    nums.num1 = 10;
    expect(nums.num1).toEqual(10);
    expect(nums.num2).toEqual(10);
    expect(spy1).toHaveBeenCalledTimes(3);
    expect(spy2).toHaveBeenCalledTimes(3);
  });

  it("should discover new branches while running automatically", () => {
    let dummy;
    const obj = reactive({ prop: "value", run: false });

    const conditionalSpy = jest.fn(() => {
      dummy = obj.run ? obj.prop : "other";
    });
    autorun(conditionalSpy);

    expect(dummy).toEqual("other");
    expect(conditionalSpy).toHaveBeenCalledTimes(1);
    obj.prop = "Hi";
    expect(dummy).toEqual("other");
    expect(conditionalSpy).toHaveBeenCalledTimes(1);
    obj.run = true;
    expect(dummy).toEqual("Hi");
    expect(conditionalSpy).toHaveBeenCalledTimes(2);
    obj.prop = "World";
    expect(dummy).toEqual("World");
    expect(conditionalSpy).toHaveBeenCalledTimes(3);
  });

  it("should discover new branches when running manually", () => {
    let dummy;
    let run = false;
    const obj = reactive({ prop: "value" });
    const reaction = autorun(() => {
      dummy = run ? obj.prop : "other";
    });

    expect(dummy).toEqual("other");
    reaction.trigger();
    expect(dummy).toEqual("other");
    run = true;
    reaction.trigger();
    expect(dummy).toEqual("value");
    obj.prop = "World";
    expect(dummy).toEqual("World");
  });

  it("should not be triggered by mutating a property, which is used in an inactive branch", () => {
    let dummy;
    const obj = reactive({ prop: "value", run: true });

    const conditionalSpy = jest.fn(() => {
      dummy = obj.run ? obj.prop : "other";
    });
    autorun(() => {
      conditionalSpy();
    });

    expect(dummy).toEqual("value");
    expect(conditionalSpy).toHaveBeenCalledTimes(1);
    obj.run = false;
    expect(dummy).toEqual("other");
    expect(conditionalSpy).toHaveBeenCalledTimes(2);
    obj.prop = "value2";
    expect(dummy).toEqual("other");
    expect(conditionalSpy).toHaveBeenCalledTimes(2);
  });

  it("should not run multiple times for a single mutation", () => {
    let dummy;
    const obj = reactive({} as any);
    const fnSpy = jest.fn(() => {
      for (const key in obj) {
        dummy = obj[key];
      }
      dummy = obj.prop;
    });
    autorun(fnSpy);

    expect(fnSpy).toHaveBeenCalledTimes(1);
    obj.prop = 16;
    expect(dummy).toEqual(16);
    expect(fnSpy).toHaveBeenCalledTimes(2);
  });

  it("should allow nested reactions", () => {
    const nums = reactive({ num1: 0, num2: 1, num3: 2 });
    const dummy = {} as any;

    const childSpy = jest.fn(() => {
      dummy.num1 = nums.num1;
    });
    const childReaction = autorun(childSpy);
    const parentSpy = jest.fn(() => {
      dummy.num2 = nums.num2;
      childReaction.trigger();
      dummy.num3 = nums.num3;
    });
    autorun(parentSpy);

    expect(dummy).toEqual({ num1: 0, num2: 1, num3: 2 });
    expect(parentSpy).toHaveBeenCalledTimes(1);
    expect(childSpy).toHaveBeenCalledTimes(2);
    // this should only call the childReaction
    nums.num1 = 4;
    expect(dummy).toEqual({ num1: 4, num2: 1, num3: 2 });
    expect(parentSpy).toHaveBeenCalledTimes(1);
    expect(childSpy).toHaveBeenCalledTimes(3);
    // this calls the parentReaction, which calls the childReaction once
    nums.num2 = 10;
    expect(dummy).toEqual({ num1: 4, num2: 10, num3: 2 });
    expect(parentSpy).toHaveBeenCalledTimes(2);
    expect(childSpy).toHaveBeenCalledTimes(4);
    // this calls the parentReaction, which calls the childReaction once
    nums.num3 = 7;
    expect(dummy).toEqual({ num1: 4, num2: 10, num3: 7 });
    expect(parentSpy).toHaveBeenCalledTimes(3);
    expect(childSpy).toHaveBeenCalledTimes(5);
  });
});

describe("options", () => {
  describe("fireImmediately", () => {
    it("should not run the passed function, if set to true", () => {
      const fnSpy = jest.fn(() => {});
      autorun(fnSpy, { fireImmediately: false });
      expect(fnSpy).toBeCalledTimes(0);
    });

    it("should default to true", () => {
      const fnSpy = jest.fn(() => {});
      autorun(fnSpy);
      expect(fnSpy).toHaveBeenCalledTimes(1);
    });
  });

  /*
  describe("scheduler", () => {
    it("should call the scheduler function with the reaction instead of running it sync", () => {
      const counter = reactive({ num: 0 });
      const fn = spy(() => counter.num);
      const scheduler = spy(() => {});
      const reaction = autorun(fn, { scheduler });

      expect(fn).toHaveBeenCalledTimes(1);
      expect(scheduler).toHaveBeenCalledTimes(0);
      counter.num++;
      expect(fn).toHaveBeenCalledTimes(1);
      expect(scheduler).toHaveBeenCalledTimes(1);
      expect(scheduler.lastArgs).toEqual([reaction]);
    });

    it("should call scheduler.add with the reaction instead of running it sync", () => {
      const counter = reactive({ num: 0 });
      const fn = spy(() => counter.num);
      const scheduler = { add: spy(() => {}), delete: () => {} };
      const reaction = autorun(fn, { scheduler });

      expect(fn).toHaveBeenCalledTimes(1);
      expect(scheduler.add).toHaveBeenCalledTimes(0);
      counter.num++;
      expect(fn).toHaveBeenCalledTimes(1);
      expect(scheduler.add).toHaveBeenCalledTimes(1);
      expect(scheduler.add.lastArgs).toEqual([reaction]);
    });
  });
  */
  it("should not error when a DOM element is added", async () => {
    let dummy: any = null;
    const observed = reactive({ obj: null as any });
    autorun(() => {
      dummy = observed.obj && observed.obj.nodeType;
    });

    expect(dummy).toEqual(null);
    observed.obj = document;
    expect(dummy).toEqual(9);
  });

  describe("implicitReaction", () => {
    it("should run implicitReaction", () => {
      const fnSpy = jest.fn(() => {});
      const reaction = new Observer(fnSpy);

      const observed = reactive(
        {
          hello: "test",
          outer: {
            nested: 5,
          },
        },
        reaction
      );
      let access = observed.hello;
      observed.hello = "hi";
      expect(fnSpy).toBeCalledTimes(1);

      let access2 = observed.outer.nested;
      observed.outer.nested = 9;
      expect(fnSpy).toBeCalledTimes(2);

      observed.outer = { nested: 9 };
      expect(fnSpy).toBeCalledTimes(3);
    });

    it("should work for has", () => {
      const fnSpy = jest.fn(() => {});
      const reaction = new Observer(fnSpy);

      const observed = reactive({}, reaction);
      let access = "bla" in observed;
      (observed as any).bla = "hi";
      expect(fnSpy).toBeCalledTimes(1);
    });

    it("nested implicits", () => {
      const fnSpy1 = jest.fn(() => {});
      const reaction1 = new Observer(fnSpy1);

      const observed = reactive(
        {
          hello: "test",
          outer: {
            nested: 5,
          },
        },
        reaction1
      );

      const fnSpy2 = jest.fn(() => {});
      const reaction2 = new Observer(fnSpy2);

      const observed2 = reactive(observed, reaction2);
      let access = observed.outer.nested;
      let access2 = observed2.outer.nested;

      observed2.outer.nested = 6;
      expect(fnSpy1).toBeCalledTimes(1);
      expect(fnSpy2).toBeCalledTimes(1);
    });
  });
});
