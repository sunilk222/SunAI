import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import VoiceSelector from "../VoiceSelector";

const mockVoices = [
  { name: "Voice A", displayName: "Voice A", voiceURI: "uri-a", lang: "en-US", localService: true, gender: "male" },
  { name: "Voice B", displayName: "Voice B", voiceURI: "uri-b", lang: "en-US", localService: false, gender: "male" },
];

const defaultProps = {
  voiceType: "male",
  onVoiceTypeChange: jest.fn(),
  voices: mockVoices,
  selectedVoiceURI: "uri-a",
  onVoiceSelect: jest.fn(),
  onPreview: jest.fn(),
  langHasPiper: false,
  language: "hi-IN",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("VoiceSelector", () => {
  test("renders Male and Female tabs", () => {
    render(<VoiceSelector {...defaultProps} />);
    const tabs = screen.getAllByRole("button").filter((btn) => btn.classList.contains("gender-tab"));
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveTextContent("Male");
    expect(tabs[1]).toHaveTextContent("Female");
  });

  test("calls onVoiceTypeChange when Female tab is clicked", () => {
    render(<VoiceSelector {...defaultProps} />);
    const tabs = screen.getAllByRole("button").filter((btn) => btn.classList.contains("gender-tab"));
    fireEvent.click(tabs[1]);
    expect(defaultProps.onVoiceTypeChange).toHaveBeenCalledWith("female");
  });

  test("calls onVoiceTypeChange when Male tab is clicked", () => {
    render(<VoiceSelector {...defaultProps} voiceType="female" />);
    const tabs = screen.getAllByRole("button").filter((btn) => btn.classList.contains("gender-tab"));
    fireEvent.click(tabs[0]);
    expect(defaultProps.onVoiceTypeChange).toHaveBeenCalledWith("male");
  });

  test("renders voice cards when langHasPiper is false", () => {
    render(<VoiceSelector {...defaultProps} />);
    expect(screen.getByText("Voice A")).toBeInTheDocument();
    expect(screen.getByText("Voice B")).toBeInTheDocument();
  });

  test("shows HD badge for non-local voices", () => {
    render(<VoiceSelector {...defaultProps} />);
    expect(screen.getByText("HD")).toBeInTheDocument();
  });

  test("shows no voices message when voices array is empty", () => {
    render(<VoiceSelector {...defaultProps} voices={[]} />);
    expect(screen.getByText(/no male voices/i)).toBeInTheDocument();
  });

  test("calls onVoiceSelect when a voice card is clicked", () => {
    render(<VoiceSelector {...defaultProps} />);
    fireEvent.click(screen.getByText("Voice A"));
    expect(defaultProps.onVoiceSelect).toHaveBeenCalledWith("uri-a");
  });

  test("shows Piper voice badge when langHasPiper is true", () => {
    render(<VoiceSelector {...defaultProps} langHasPiper={true} language="en-US" />);
    expect(screen.getByText(/used for Speak & Download/i)).toBeInTheDocument();
  });

  test("hides browser voice cards when langHasPiper is true", () => {
    render(<VoiceSelector {...defaultProps} langHasPiper={true} language="en-US" />);
    expect(screen.queryByText("Voice A")).not.toBeInTheDocument();
  });

  test("shows Piper voice names in tabs when langHasPiper is true", () => {
    render(<VoiceSelector {...defaultProps} langHasPiper={true} language="en-US" />);
    expect(screen.getByRole("button", { name: /James/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Emily/i })).toBeInTheDocument();
  });

  test("calls onPreview when preview button is clicked", () => {
    render(<VoiceSelector {...defaultProps} />);
    const previewBtns = screen.getAllByTitle("Preview this browser voice");
    fireEvent.click(previewBtns[0]);
    expect(defaultProps.onPreview).toHaveBeenCalledWith("uri-a");
  });
});
