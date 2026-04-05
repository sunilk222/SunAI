import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TextInput from "../TextInput";

describe("TextInput", () => {
  test("renders textarea with placeholder", () => {
    render(<TextInput value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText(/type or paste your text here/i)).toBeInTheDocument();
  });

  test("displays the current value", () => {
    render(<TextInput value="Hello world" onChange={() => {}} />);
    expect(screen.getByDisplayValue("Hello world")).toBeInTheDocument();
  });

  test("calls onChange when text is typed", () => {
    const handleChange = jest.fn();
    render(<TextInput value="" onChange={handleChange} />);
    fireEvent.change(screen.getByPlaceholderText(/type or paste/i), {
      target: { value: "new text" },
    });
    expect(handleChange).toHaveBeenCalledWith("new text");
  });

  test("shows character count", () => {
    render(<TextInput value="Hello" onChange={() => {}} />);
    expect(screen.getByText("5 / 5,000")).toBeInTheDocument();
  });

  test("shows 0 character count for empty input", () => {
    render(<TextInput value="" onChange={() => {}} />);
    expect(screen.getByText("0 / 5,000")).toBeInTheDocument();
  });

  test("has maxLength of 5000", () => {
    render(<TextInput value="" onChange={() => {}} />);
    const textarea = screen.getByPlaceholderText(/type or paste/i);
    expect(textarea).toHaveAttribute("maxLength", "5000");
  });

  test("has a label", () => {
    render(<TextInput value="" onChange={() => {}} />);
    expect(screen.getByLabelText(/your text/i)).toBeInTheDocument();
  });
});
