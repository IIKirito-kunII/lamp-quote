// In Quote.jsx

import React, { useState, useEffect } from "react";
import { FaQuoteLeft, FaQuoteRight, FaTwitter } from "react-icons/fa";
import "./Quote.css";

// Accept glowColor as a prop
export default function Quote({ glowColor }) {
  const [quote, setQuote] = useState("");
  const [author, setAuthor] = useState("");
  // Remove color/bgColor states as they are now driven by the prop/CSS

  // Use the prop color for the box-shadow, with a fallback
  const boxShadow = glowColor
    ? `0 10px 10px ${glowColor}, 0 0 15px ${glowColor}`
    : "none";

  // Use a fixed bright color for the quote text
  const quoteTextColor = "#FFF";
  const textShadowStyle = glowColor ? `0 0 8px ${glowColor}` : "none";

  const getQuote = async () => {
    const response = await fetch(
      "https://gist.githubusercontent.com/camperbot/5a022b72e96c4c9585c32bf6a75f62d9/raw/e3c6895ce42069f0ee7e991229064f167fe8ccdc/quotes.json"
    );
    const data = await response.json();
    const i = Math.floor(Math.random() * data.quotes.length);
    const randomQuote = data.quotes[i];

    setQuote(randomQuote.quote);
    setAuthor(randomQuote.author);
    // Removed changeColors() call
  };

  // Removed changeColors function entirely

  useEffect(() => {
    getQuote();
  }, []);

  return (
    <>
      <div
        className="quote-box-container"
        // Apply box-shadow
        style={{ boxShadow: boxShadow }}
      >
        <div id="quote-box">
          <div
            id="text"
            // Apply text color and glow
            style={{ color: quoteTextColor, textShadow: textShadowStyle }}
          >
            <b>
              <FaQuoteLeft /> {quote || "Loading..."} <FaQuoteRight />
            </b>
          </div>
          <div id="author" style={{ color: quoteTextColor }}>
            ~ {author || ""}
          </div>
          <footer>
            <a
              // Apply the glowColor as button background
              style={{ backgroundColor: glowColor || "black" }}
              id="tweet-quote"
              className="btn twitter"
              href={`https://twitter.com/intent/tweet?text="${quote}" ~${author}`}
              target="_blank"
            >
              <FaTwitter />
            </a>
            <button
              // Apply the glowColor as button background
              style={{ backgroundColor: glowColor || "black" }}
              id="new-quote"
              className="btn next"
              onClick={getQuote}
            >
              New quote
            </button>
          </footer>
        </div>
      </div>
    </>
  );
}
