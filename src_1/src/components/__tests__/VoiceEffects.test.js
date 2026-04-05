import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import VoiceEffects from "../VoiceEffects";

const defaultProps = {
  rate: 1,
  pitch: 1,
  volume: 1,
  onRateChange: jest.fn(),
  onPitchChange: jest.fn(),
  onVolumeChange: jest.fn(),
  onReset: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("VoiceEffects", () => {
  test("renders Speed, Pitch, and Volume controls", () => {
    render(<VoiceEffects {...defaultProps} />);
    expect(screen.getByText(/Speed/i)).toBeInTheDocument();
    expect(screen.getByText(/Pitch/i)).toBeInTheDocument();
    expect(screen.getByText(/Volume/i)).toBeInTheDocument();
  });

  test("displays current rate value", () => {
    render(<VoiceEffects {...defaultProps} rate={1.5} />);
    expect(screen.getByText("1.5x")).toBeInTheDocument();
  });

  test("displays current pitch value", () => {
    render(<VoiceEffects {...defaultProps} pitch={0.8} />);
    expect(screen.getByText("0.8")).toBeInTheDocument();
  });

  test("displays current volume as percentage", () => {
    render(<VoiceEffects {...defaultProps} volume={0.75} />);
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  test("calls onReset when Reset is clicked", () => {
    render(<VoiceEffects {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Reset/i }));
    expect(defaultProps.onReset).toHaveBeenCalledTimes(1);
  });

  test("renders three range inputs", () => {
    render(<VoiceEffects {...defaultProps} />);
    const sliders = screen.getAllByRole("slider");
    expect(sliders).toHaveLength(3);
  });

  test("calls onRateChange when speed slider changes", () => {
    render(<VoiceEffects {...defaultProps} />);
    const sliders = screen.getAllByRole("slider");
    fireEvent.change(sliders[0], { target: { value: "1.5" } });
    expect(defaultProps.onRateChange).toHaveBeenCalledWith(1.5);
  });

  test("calls onPitchChange when pitch slider changes", () => {
    render(<VoiceEffects {...defaultProps} />);
    const sliders = screen.getAllByRole("slider");
    fireEvent.change(sliders[1], { target: { value: "0.5" } });
    expect(defaultProps.onPitchChange).toHaveBeenCalledWith(0.5);
  });

  test("calls onVolumeChange when volume slider changes", () => {
    render(<VoiceEffects {...defaultProps} />);
    const sliders = screen.getAllByRole("slider");
    fireEvent.change(sliders[2], { target: { value: "0.8" } });
    expect(defaultProps.onVolumeChange).toHaveBeenCalledWith(0.8);
  });

  test("shows range labels", () => {
    render(<VoiceEffects {...defaultProps} />);
    expect(screen.getByText("Slow")).toBeInTheDocument();
    expect(screen.getByText("Fast")).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Quiet")).toBeInTheDocument();
    expect(screen.getByText("Loud")).toBeInTheDocument();
  });
});
