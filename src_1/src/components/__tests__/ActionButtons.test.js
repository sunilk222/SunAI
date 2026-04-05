import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ActionButtons from "../ActionButtons";

const defaultProps = {
  onSpeak: jest.fn(),
  onStop: jest.fn(),
  onDownloadAudio: jest.fn(),
  onClear: jest.fn(),
  disabled: false,
  isSpeaking: false,
  isRecording: false,
  isGenerating: false,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ActionButtons", () => {
  test("renders Speak, Download Audio, and Clear buttons", () => {
    render(<ActionButtons {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Speak/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download Audio/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Clear/i })).toBeInTheDocument();
  });

  test("calls onSpeak when Speak is clicked", () => {
    render(<ActionButtons {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Speak/i }));
    expect(defaultProps.onSpeak).toHaveBeenCalledTimes(1);
  });

  test("calls onDownloadAudio when Download is clicked", () => {
    render(<ActionButtons {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Download Audio/i }));
    expect(defaultProps.onDownloadAudio).toHaveBeenCalledTimes(1);
  });

  test("calls onClear when Clear is clicked", () => {
    render(<ActionButtons {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Clear/i }));
    expect(defaultProps.onClear).toHaveBeenCalledTimes(1);
  });

  test("shows Stop button when isSpeaking is true", () => {
    render(<ActionButtons {...defaultProps} isSpeaking={true} />);
    expect(screen.getByRole("button", { name: /Stop/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Speak/i })).not.toBeInTheDocument();
  });

  test("calls onStop when Stop is clicked", () => {
    render(<ActionButtons {...defaultProps} isSpeaking={true} />);
    fireEvent.click(screen.getByRole("button", { name: /Stop/i }));
    expect(defaultProps.onStop).toHaveBeenCalledTimes(1);
  });

  test("disables Speak and Download when disabled is true", () => {
    render(<ActionButtons {...defaultProps} disabled={true} />);
    expect(screen.getByRole("button", { name: /Speak/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Download Audio/i })).toBeDisabled();
  });

  test("shows Generating text when isGenerating is true", () => {
    render(<ActionButtons {...defaultProps} isGenerating={true} />);
    expect(screen.getByRole("button", { name: /Generating/i })).toBeInTheDocument();
  });

  test("shows Downloading text when isRecording is true", () => {
    render(<ActionButtons {...defaultProps} isRecording={true} />);
    expect(screen.getByRole("button", { name: /Downloading/i })).toBeInTheDocument();
  });

  test("disables Speak when isGenerating is true", () => {
    render(<ActionButtons {...defaultProps} isGenerating={true} />);
    expect(screen.getByRole("button", { name: /Generating/i })).toBeDisabled();
  });

  test("disables Download when isRecording is true", () => {
    render(<ActionButtons {...defaultProps} isRecording={true} />);
    expect(screen.getByRole("button", { name: /Downloading/i })).toBeDisabled();
  });

  test("Clear button is never disabled", () => {
    render(<ActionButtons {...defaultProps} disabled={true} isRecording={true} isGenerating={true} />);
    expect(screen.getByRole("button", { name: /Clear/i })).not.toBeDisabled();
  });
});
