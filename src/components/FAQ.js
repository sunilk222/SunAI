import React, { useState } from "react";

const FAQ_DATA = [
  {
    question: "Can I use audio for commercial purposes?",
    answer:
      "Yes! Voice App is 100% free for all purposes including commercial use. Audio playback uses your browser's built-in Web Speech API and MP3 downloads use Google's free Text-to-Speech service. There are no usage limits, no watermarks, and no restrictions on how you use the generated audio.",
  },
  {
    question: "Is it really free? Are there any hidden costs?",
    answer:
      "Absolutely! Voice App is 100% free forever — no hidden costs, no subscriptions, no premium tiers, no trials, and no ads. Every feature is fully unlocked: unlimited text-to-speech playback, unlimited MP3 downloads, all 40+ languages, all voice customization options. The app runs entirely in your browser so there are zero server costs to pass on.",
  },
  {
    question: "Do I need to create an account or sign up?",
    answer:
      "No account or sign-up is required! Voice App works instantly — just open the app, type your text, verify the CAPTCHA, and start generating speech. Your preferences are stored locally in your browser for convenience.",
  },
  {
    question: "What is the CAPTCHA and how do I use it?",
    answer:
      "The CAPTCHA is a simple verification step to prevent automated misuse of the service. You'll see a code displayed in a colored box — just type the exact characters you see into the input field and click 'Verify'. Once verified, all action buttons (Speak, Download Audio, etc.) become active. The CAPTCHA resets when you clear the form.",
  },
  {
    question: "How many voices and languages are available?",
    answer:
      "Voice App supports 40+ languages including English (US, UK, Australia, India), Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, French, German, Spanish, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Arabic, and many more. The number of available voices depends on your browser and operating system — Chrome typically offers the most voices.",
  },
  {
    question: "How can I add pauses to my generated speech?",
    answer:
      "You can add pauses by inserting punctuation marks in your text. A period (.) or comma (,) creates a short pause. An ellipsis (...) creates a longer pause. You can also insert line breaks for natural pausing. Additionally, lowering the speech rate in Voice Effects will slow down the entire speech, adding more time between words.",
  },
  {
    question: "How do I customize voice settings?",
    answer:
      "Use the Voice Effects panel to customize three settings: Rate (speed of speech from 0.5x to 2x), Pitch (how high or low the voice sounds, from 0.5 to 2), and Volume (loudness from 0 to 1). You can also select Male or Female voice types and choose from available voices for your selected language. Click 'Reset' to return to default values.",
  },
  {
    question: "What is the character limit for text input?",
    answer:
      "The text input supports up to 5,000 characters per session. For MP3 downloads, longer texts are automatically split into smaller chunks (200 characters each) and combined into a single file. For very long texts, we recommend breaking them into smaller sections for the best audio quality.",
  },
  {
    question: "How do I download my generated audio?",
    answer:
      "After entering your text and verifying the CAPTCHA, click the 'Download Audio' button. The app will generate an MP3 file using Google's Text-to-Speech service and automatically download it to your device. You can also use 'Download Text' to save your input as a .txt file. If the direct download fails, the audio will open in a new tab where you can right-click to save it.",
  },
{
  question: "How can I get support?",
  answer: "For any questions, issues, or feedback, please contact us at sunilarnav2222@gmail.com. We’ll get back to you as soon as possible."
},

  {
    question: "How are audio files stored on the platform?",
    answer:
      "Voice App does not store audio files on any server. All speech playback happens in real-time through your browser's Web Speech API. MP3 downloads are generated on-the-fly using Google TTS, delivered directly to your device, and not retained anywhere. Your text and preferences are stored only in your browser's local storage and never sent to our servers.",
  },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="faq-section">
      <h2 className="faq-title">{"\u2753"} Frequently Asked Questions</h2>
      <div className="faq-list">
        {FAQ_DATA.map((item, index) => (
          <div
            key={index}
            className={`faq-item ${openIndex === index ? "faq-item-open" : ""}`}
          >
            <button
              className="faq-question"
              onClick={() => toggle(index)}
              type="button"
              aria-expanded={openIndex === index}
            >
              <span>{item.question}</span>
              <span className="faq-chevron">
                {openIndex === index ? "\u2212" : "\u002B"}
              </span>
            </button>
            {openIndex === index && (
              <div className="faq-answer">
                <p>{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default FAQ;
