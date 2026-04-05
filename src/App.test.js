import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";

beforeAll(() => {
  const mockVoices = [
    { name: "Test Voice Male", lang: "en-US", voiceURI: "test-male", localService: true },
    { name: "Test Voice Female", lang: "en-US", voiceURI: "test-female", localService: true },
  ];
  Object.defineProperty(window, "speechSynthesis", {
    value: {
      getVoices: () => mockVoices,
      speak: () => {},
      cancel: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    },
    writable: true,
  });
});

test("renders the app title", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /^Voice App$/ })).toBeInTheDocument();
});

test("renders voice type tabs", () => {
  render(<App />);
  const maleButtons = screen.getAllByRole("button", { name: /Male/ });
  const femaleButtons = screen.getAllByRole("button", { name: /Female/ });
  expect(maleButtons.length).toBeGreaterThan(0);
  expect(femaleButtons.length).toBeGreaterThan(0);
});

test("renders captcha verification", () => {
  render(<App />);
  expect(screen.getByText(/verify you're human/i)).toBeInTheDocument();
});

test("renders action buttons - Speak, Download Audio, Clear", () => {
  render(<App />);
  expect(screen.getByRole("button", { name: /Speak/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Download Audio/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Clear/ })).toBeInTheDocument();
});

test("no login form visible", () => {
  render(<App />);
  expect(screen.queryByPlaceholderText(/enter your full name/i)).not.toBeInTheDocument();
});

test("header shows Voice App and subtitle", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /Voice App/i })).toBeInTheDocument();
  expect(screen.getByText(/100% Free Text to Speech/i)).toBeInTheDocument();
});

test("theme toggle button exists", () => {
  render(<App />);
  const toggle = screen.getByTitle(/switch to light mode/i);
  expect(toggle).toBeInTheDocument();
});

test("FAQ link toggles FAQ section", () => {
  render(<App />);
  const faqBtn = screen.getByRole("button", { name: /FAQ/i });
  expect(faqBtn).toBeInTheDocument();
  fireEvent.click(faqBtn);
  expect(screen.getByText(/Can I use audio for commercial purposes?/i)).toBeInTheDocument();
});

test("text input accepts text", () => {
  render(<App />);
  const textarea = screen.getByPlaceholderText(/type or paste your text here/i);
  fireEvent.change(textarea, { target: { value: "Hello world test" } });
  expect(textarea).toHaveValue("Hello world test");
});

test("download note is visible", () => {
  render(<App />);
  expect(screen.getByText(/same AI voice/i)).toBeInTheDocument();
});
