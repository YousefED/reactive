import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import * as React from "react";
import { useRef } from "react";
// @ts-ignore
import { useReactive } from "../src/useReactive";

const Section = (props: { section: { title: string; todos: any[] }; smart: boolean }) => {
  const renderCount = useRef(0);
  renderCount.current++;

  const state = props.smart ? useReactive(props.section) : props.section;

  return (
    <>
      <div data-testid="nestedRenderCount">{renderCount.current}</div>
      {state.todos.map((t, i) => (
        <div key={i}>TODO: {t.title}</div>
      ))}
      <button data-testid="add-todo" onClick={() => state.todos.push({ title: "new todo" })} />
    </>
  );
};

function TestApp(props: { smart: boolean }) {
  const renderCount = useRef(0);
  const state = useReactive({
    sections: [
      {
        title: "section 1",
        todos: [
          {
            title: "todo 1",
          },
        ],
      },
    ],
  });

  renderCount.current++;

  return (
    <>
      <div data-testid="renderCount">{renderCount.current}</div>
      <div data-testid="inner">
        {state.sections.map((s, i) => (
          <Section section={s} key={i} smart={props.smart}></Section>
        ))}
      </div>
    </>
  );
}

it("renders smart", () => {
  render(<TestApp smart={true} />);
  // const smartInnerElement = screen.getByTestId("nestedInner");
  // expect(smartInnerElement).toHaveTextContent("5");

  const renderCountElement = screen.getByTestId("renderCount");
  expect(renderCountElement).toHaveTextContent("1");

  const smartRenderCountElement = screen.getByTestId("nestedRenderCount");
  expect(smartRenderCountElement).toHaveTextContent("1");

  const buttonElement = screen.getByTestId("add-todo");
  act(() => {
    buttonElement.click();
  });
  expect(renderCountElement).toHaveTextContent("1");
  expect(smartRenderCountElement).toHaveTextContent("2");
  // expect(smartInnerElement).toHaveTextContent("6");
});

it("renders not smart", () => {
  render(<TestApp smart={false} />);
  // const smartInnerElement = screen.getByTestId("nestedInner");
  // expect(smartInnerElement).toHaveTextContent("5");

  const renderCountElement = screen.getByTestId("renderCount");
  expect(renderCountElement).toHaveTextContent("1");

  const smartRenderCountElement = screen.getByTestId("nestedRenderCount");
  expect(smartRenderCountElement).toHaveTextContent("1");

  const buttonElement = screen.getByTestId("add-todo");
  act(() => {
    buttonElement.click();
  });
  expect(renderCountElement).toHaveTextContent("2");
  expect(smartRenderCountElement).toHaveTextContent("2");
  // expect(smartInnerElement).toHaveTextContent("6");
});
