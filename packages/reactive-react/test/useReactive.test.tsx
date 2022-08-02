import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import * as React from "react";
import { useRef } from "react";
// @ts-ignore
import { untrackedCB } from "@reactivedata/reactive";
import { useReactive } from "../src/useReactive";

function TestApp() {
  const renderCount = useRef(0);
  const state = useReactive({
    outer: {
      inner: 5,
    },
  });

  renderCount.current++;

  return (
    <>
      <div data-testid="renderCount">{renderCount.current}</div>
      <div data-testid="inner">{state.outer.inner}</div>
      <button data-testid="increase" onClick={() => state.outer.inner++} />
    </>
  );
}

it("renders learn react link", () => {
  render(<TestApp />);
  const innerElement = screen.getByTestId("inner");
  expect(innerElement).toHaveTextContent("5");

  const renderCountElement = screen.getByTestId("renderCount");
  expect(renderCountElement).toHaveTextContent("1");

  const buttonElement = screen.getByTestId("increase");
  act(() => {
    buttonElement.click();
  });

  expect(innerElement).toHaveTextContent("6");
  expect(renderCountElement).toHaveTextContent("2");
});

const NestedComponent = (props: { state: any; smart: boolean }) => {
  const renderCount = useRef(0);
  renderCount.current++;

  const state = props.smart ? useReactive(props.state) : props.state;

  return (
    <>
      <div data-testid="nestedRenderCount">{renderCount.current}</div>
      <div data-testid="nestedInner">{state.outer.inner}</div>
    </>
  );
};

function NestedApp(props: { smart: boolean }) {
  const renderCount = useRef(0);
  const state = useReactive({
    outer: {
      inner: 5,
    },
  });

  renderCount.current++;

  return (
    <>
      <div data-testid="renderCount">{renderCount.current}</div>
      <NestedComponent smart={props.smart} state={state} data-testid="component" />
      <button data-testid="increase" onClick={untrackedCB(() => state.outer.inner++)} />
    </>
  );
}

it("renders smart nested react link", () => {
  render(<NestedApp smart={true} />);
  const smartInnerElement = screen.getByTestId("nestedInner");
  expect(smartInnerElement).toHaveTextContent("5");

  const renderCountElement = screen.getByTestId("renderCount");
  expect(renderCountElement).toHaveTextContent("1");

  const smartRenderCountElement = screen.getByTestId("nestedRenderCount");
  expect(smartRenderCountElement).toHaveTextContent("1");

  const buttonElement = screen.getByTestId("increase");
  act(() => {
    buttonElement.click();
  });
  expect(renderCountElement).toHaveTextContent("1");
  expect(smartRenderCountElement).toHaveTextContent("2");
  expect(smartInnerElement).toHaveTextContent("6");
});

it("renders dumb nested react link", () => {
  render(<NestedApp smart={false} />);
  const smartInnerElement = screen.getByTestId("nestedInner");
  expect(smartInnerElement).toHaveTextContent("5");

  const renderCountElement = screen.getByTestId("renderCount");
  expect(renderCountElement).toHaveTextContent("1");

  const smartRenderCountElement = screen.getByTestId("nestedRenderCount");
  expect(smartRenderCountElement).toHaveTextContent("1");

  const buttonElement = screen.getByTestId("increase");
  act(() => {
    buttonElement.click();
  });
  expect(renderCountElement).toHaveTextContent("2");
  expect(smartRenderCountElement).toHaveTextContent("2");
  expect(smartInnerElement).toHaveTextContent("6");
});
