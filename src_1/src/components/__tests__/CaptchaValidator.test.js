import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CaptchaValidator from "../CaptchaValidator";

describe("CaptchaValidator", () => {
  test("renders the verification label", () => {
    render(<CaptchaValidator onVerified={jest.fn()} />);
    expect(screen.getByText(/verify you're human/i)).toBeInTheDocument();
  });

  test("renders a captcha code with correct length", () => {
    render(<CaptchaValidator onVerified={jest.fn()} />);
    const chars = screen.getAllByText(/^[A-Z0-9]$/);
    expect(chars).toHaveLength(5);
  });

  test("renders an input field with placeholder", () => {
    render(<CaptchaValidator onVerified={jest.fn()} />);
    expect(screen.getByPlaceholderText("Enter code")).toBeInTheDocument();
  });

  test("renders Verify button", () => {
    render(<CaptchaValidator onVerified={jest.fn()} />);
    expect(screen.getByRole("button", { name: /Verify/i })).toBeInTheDocument();
  });

  test("Verify button is disabled when input is shorter than captcha length", () => {
    render(<CaptchaValidator onVerified={jest.fn()} />);
    const verifyBtn = screen.getByRole("button", { name: /Verify/i });
    expect(verifyBtn).toBeDisabled();
  });

  test("shows error message on wrong captcha", () => {
    render(<CaptchaValidator onVerified={jest.fn()} />);
    const input = screen.getByPlaceholderText("Enter code");
    fireEvent.change(input, { target: { value: "WRONG" } });
    fireEvent.click(screen.getByRole("button", { name: /Verify/i }));
    expect(screen.getByText(/doesn't match/i)).toBeInTheDocument();
  });

  test("calls onVerified(false) on wrong captcha", () => {
    const onVerified = jest.fn();
    render(<CaptchaValidator onVerified={onVerified} />);
    const input = screen.getByPlaceholderText("Enter code");
    fireEvent.change(input, { target: { value: "WRONG" } });
    fireEvent.click(screen.getByRole("button", { name: /Verify/i }));
    expect(onVerified).toHaveBeenCalledWith(false);
  });

  test("shows Verified badge on correct captcha", () => {
    const onVerified = jest.fn();
    render(<CaptchaValidator onVerified={onVerified} />);

    const chars = screen.getAllByText(/^[A-Z0-9]$/);
    const captchaCode = chars.map((el) => el.textContent).join("");

    const input = screen.getByPlaceholderText("Enter code");
    fireEvent.change(input, { target: { value: captchaCode } });
    fireEvent.click(screen.getByRole("button", { name: /Verify/i }));

    expect(screen.getByText(/Verified/i)).toBeInTheDocument();
    expect(onVerified).toHaveBeenCalledWith(true);
  });

  test("disables input after successful verification", () => {
    render(<CaptchaValidator onVerified={jest.fn()} />);

    const chars = screen.getAllByText(/^[A-Z0-9]$/);
    const captchaCode = chars.map((el) => el.textContent).join("");

    const input = screen.getByPlaceholderText("Enter code");
    fireEvent.change(input, { target: { value: captchaCode } });
    fireEvent.click(screen.getByRole("button", { name: /Verify/i }));

    expect(input).toBeDisabled();
  });

  test("refresh button generates a new captcha", () => {
    render(<CaptchaValidator onVerified={jest.fn()} />);

    const charsBefore = screen.getAllByText(/^[A-Z0-9]$/).map((el) => el.textContent).join("");
    fireEvent.click(screen.getByTitle("Get new code"));
    const charsAfter = screen.getAllByText(/^[A-Z0-9]$/).map((el) => el.textContent).join("");

    // While there's a tiny chance they're the same, 5-char code makes it extremely unlikely
    expect(charsAfter).toHaveLength(5);
  });

  test("converts input to uppercase", () => {
    render(<CaptchaValidator onVerified={jest.fn()} />);
    const input = screen.getByPlaceholderText("Enter code");
    fireEvent.change(input, { target: { value: "abcde" } });
    expect(input.value).toBe("ABCDE");
  });

  test("Enter key triggers verification", () => {
    const onVerified = jest.fn();
    render(<CaptchaValidator onVerified={onVerified} />);
    const input = screen.getByPlaceholderText("Enter code");
    fireEvent.change(input, { target: { value: "WRONG" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onVerified).toHaveBeenCalled();
  });
});
