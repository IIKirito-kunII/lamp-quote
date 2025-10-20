import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import Quote from "./components/Quote";

// Register plugins once at the top level
gsap.registerPlugin(Draggable, MorphSVGPlugin);

const App = () => {
  const lampRef = useRef(null);
  const hitRef = useRef(null);
  const dummyCordRef = useRef(null);
  const quoteWrapperRef = useRef(null); // NEW: Ref for the quote component wrapper
  const cordsRef = useRef([]);

  // Add state to hold and pass the dynamic glow color to Quote
  const [currentGlowColor, setCurrentGlowColor] = useState("");

  // State Refs for control
  const isOnRef = useRef(false); // Tracks current ON/OFF state
  const isTogglingRef = useRef(false); // FIX: Tracks if an animation is currently running

  const AUDIO = useRef(
    new Audio("https://assets.codepen.io/605876/click.mp3")
  ).current;

  // --- Toggle Lamp Function ---
  const toggleLamp = () => {
    const nextOn = !isOnRef.current;
    isOnRef.current = nextOn;

    // Update CSS variable (controls glow, colors, etc.)
    gsap.set(document.documentElement, { "--on": nextOn ? 1 : 0 });

    // Rotate eyes (part of the animation)
    gsap.set(".lamp__eye", { rotate: nextOn ? 0 : 180 });

    if (nextOn) {
      const hue = gsap.utils.random(0, 359);
      const glowColor = `hsl(${hue}, 40%, 45%)`;
      const glowColorDark = `hsl(${hue}, 40%, 35%)`;

      gsap.set(document.documentElement, {
        "--shade-hue": hue,
        "--glow-color": glowColor,
        "--glow-color-dark": glowColorDark,
      });

      // SET the glow color state to be passed as a prop
      setCurrentGlowColor(glowColor);

      // Show quote wrapper (uses the transition from .login-form.active)
      quoteWrapperRef.current.classList.add("active");

      // Removed redundant GSAP code targeting non-existent form elements

      // Tell the Quote component to refresh (new quote)
      // The color is now handled by the prop 'currentGlowColor'
      const quoteEl = document.querySelector("#new-quote");
      if (quoteEl) {
        // Trigger the quote component to fetch a new quote
        quoteEl.click();
      }
    } else {
      // Turn off colors
      gsap.set(document.documentElement, {
        "--glow-color": "hsl(0,0%,0%)",
        "--glow-color-dark": "hsl(0,0%,0%)",
      });

      // Clear the glow color state
      setCurrentGlowColor("");

      // Hide the Quote component
      quoteWrapperRef.current.classList.remove("active");
    }

    AUDIO.play();
  };

  // --- GSAP/Draggable Setup ---
  useEffect(() => {
    const lampEl = lampRef.current;
    const hitEl = hitRef.current;
    const dummyCord = dummyCordRef.current;

    const PROXY = document.createElement("div");
    const ENDX = dummyCord.getAttribute("x2");
    const ENDY = dummyCord.getAttribute("y2");

    // Initial GSAP setup
    gsap.set([".cords", hitEl], { x: -10 });
    gsap.set(".lamp__eye", {
      rotate: 180,
      transformOrigin: "50% 50%",
      yPercent: 50,
    });

    cordsRef.current = gsap.utils.toArray(".cords path.cord--rig");

    const RESET = () => {
      gsap.set(PROXY, { x: ENDX, y: ENDY });
      gsap.set(dummyCord, { attr: { x2: ENDX, y2: ENDY } });
    };
    RESET();

    // Timeline for the morphing cord animation
    const baseCord = cordsRef.current[0];
    const CORD_TL = gsap.timeline({
      paused: true,
      onComplete: () => {
        cordsRef.current.forEach((cord) => gsap.set(cord, { display: "none" }));
        gsap.set(dummyCord, { display: "block" });
        RESET();
        // FIX: Clear the flag after the cord animation snaps back
        isTogglingRef.current = false;
      },
    });

    for (let i = 1; i < cordsRef.current.length; i++) {
      CORD_TL.to(baseCord, {
        morphSVG: cordsRef.current[i],
        duration: 0.1,
        repeat: 1,
        yoyo: true,
      });
    }

    // Draggable setup for the pull cord
    Draggable.create(PROXY, {
      trigger: hitEl,
      type: "x,y",
      onPress: (e) => {
        // Record starting position for distance calculation
        PROXY.startX = e.x;
        PROXY.startY = e.y;
      },
      onDrag: function () {
        // Visually update the dummy cord during the drag
        gsap.set(dummyCord, {
          attr: { x2: this.x, y2: Math.max(400, this.y) },
        });
      },
      onRelease: function (e) {
        const DISTX = Math.abs(e.x - PROXY.startX);
        const DISTY = Math.abs(e.y - PROXY.startY);
        const TRAVELLED = Math.sqrt(DISTX ** 2 + DISTY ** 2);
        const MIN_TRAVEL = 50; // Minimum distance to register a "pull"

        // Animate the dummy cord snapping back to its original position
        gsap.to(dummyCord, {
          attr: { x2: ENDX, y2: ENDY },
          duration: 0.1,
          onComplete: () => {
            if (TRAVELLED > MIN_TRAVEL) {
              // FIX: Check if an animation is already in progress
              if (!isTogglingRef.current) {
                isTogglingRef.current = true; // Set flag to block re-entry
                CORD_TL.restart();
                toggleLamp();
              } else {
                RESET(); // Still reset the cord visually even if the action is blocked
              }
            } else {
              RESET();
            }
          },
        });
      },
    });

    gsap.set(lampEl, { display: "block" });
  }, []); // Empty dependency array ensures this runs once on mount

  // --- Rendered JSX ---
  return (
    <div className="container">
      <svg
        ref={lampRef}
        className="lamp"
        viewBox="0 0 333 484"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Lamp SVG content... (omitted for brevity) */}
        {/* Lamp Shade */}
        <g className="lamp__shade shade">
          <ellipse
            className="shade__opening"
            cx="165"
            cy="220"
            rx="130"
            ry="20"
          />
          <ellipse
            className="shade__opening-shade"
            cx="165"
            cy="220"
            rx="130"
            ry="20"
            fill="url(#opening-shade)"
          />
        </g>

        {/* Lamp Base */}
        <g className="lamp__base base">
          <path
            className="base__side"
            d="M165 464c44.183 0 80-8.954 80-20v-14h-22.869c-14.519-3.703-34.752-6-57.131-6-22.379 0-42.612 2.297-57.131 6H85v14c0 11.046 35.817 20 80 20z"
          />
          <path
            d="M165 464c44.183 0 80-8.954 80-20v-14h-22.869c-14.519-3.703-34.752-6-57.131-6-22.379 0-42.612 2.297-57.131 6H85v14c0 11.046 35.817 20 80 20z"
            fill="url(#side-shading)"
          />
          <ellipse className="base__top" cx="165" cy="430" rx="80" ry="20" />
          <ellipse
            cx="165"
            cy="430"
            rx="80"
            ry="20"
            fill="url(#base-shading)"
          />
        </g>

        {/* Lamp Post */}
        <g className="lamp__post post">
          <path
            className="post__body"
            d="M180 142h-30v286c0 3.866 6.716 7 15 7 8.284 0 15-3.134 15-7V142z"
          />
          <path
            d="M180 142h-30v286c0 3.866 6.716 7 15 7 8.284 0 15-3.134 15-7V142z"
            fill="url(#post-shading)"
          />
        </g>

        {/* Lamp Cords */}
        <g className="lamp__cords cords">
          <path
            className="cord cord--rig"
            d="M124 187.033V347"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            className="cord cord--rig"
            d="M124 187.023s17.007 21.921 17.007 34.846c0 12.925-11.338 23.231-17.007 34.846-5.669 11.615-17.007 21.921-17.007 34.846 0 12.925 17.007 34.846 17.007 34.846"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            className="cord cord--rig"
            d="M124 187.017s-21.259 17.932-21.259 30.26c0 12.327 14.173 20.173 21.259 30.26 7.086 10.086 21.259 17.933 21.259 30.26 0 12.327-21.259 30.26-21.259 30.26"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            className="cord cord--rig"
            d="M124 187s29.763 8.644 29.763 20.735-19.842 13.823-29.763 20.734c-9.921 6.912-29.763 8.644-29.763 20.735S124 269.939 124 269.939"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            className="cord cord--rig"
            d="M124 187.029s-10.63 26.199-10.63 39.992c0 13.794 7.087 26.661 10.63 39.992 3.543 13.331 10.63 26.198 10.63 39.992 0 13.793-10.63 39.992-10.63 39.992"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            className="cord cord--rig"
            d="M124 187.033V347"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Dummy cord (used for dragging and snap-back) */}
          <line
            className="cord cord--dummy"
            x1="124"
            y1="190"
            x2="124"
            y2="348"
            strokeWidth="6"
            strokeLinecap="round"
            ref={dummyCordRef}
          />
        </g>

        {/* Lamp Light */}
        <path
          className="lamp__light"
          d="M290.5 193H39L0 463.5c0 11.046 75.478 20 165.5 20s167-11.954 167-23l-42-267.5z"
          fill="url(#light)"
        />

        {/* Lamp Top */}
        <g className="lamp__top top">
          <path
            className="top__body"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M164.859 0c55.229 0 100 8.954 100 20l29.859 199.06C291.529 208.451 234.609 200 164.859 200S38.189 208.451 35 219.06L64.859 20c0-11.046 44.772-20 100-20z"
          />
          <path
            className="top__shading"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M164.859 0c55.229 0 100 8.954 100 20l29.859 199.06C291.529 208.451 234.609 200 164.859 200S38.189 208.451 35 219.06L64.859 20c0-11.046 44.772-20 100-20z"
            fill="url(#top-shading)"
          />
        </g>

        {/* Lamp Face */}
        <g className="lamp__face face">
          <g className="lamp__mouth">
            <path
              d="M165 178c19.882 0 36-16.118 36-36h-72c0 19.882 16.118 36 36 36z"
              fill="#141414"
            />
            <clipPath id="mouth" x="129" y="142" width="72" height="36">
              <path
                d="M165 178c19.882 0 36-16.118 36-36h-72c0 19.882 16.118 36 36 36z"
                fill="#141414"
              />
            </clipPath>
            <g clipPath="url(#mouth)">
              <circle className="lamp__tongue" cx="179.4" cy="172.6" r="18" />
            </g>
          </g>
          <g className="lamp__eyes">
            <path
              className="lamp__eye lamp__stroke"
              d="M115 135c0-5.523-5.82-10-13-10s-13 4.477-13 10"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              className="lamp__eye lamp__stroke"
              d="M241 135c0-5.523-5.82-10-13-10s-13 4.477-13 10"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </g>

        {/* Hit Circle (The invisible area the user drags) */}
        <circle
          ref={hitRef}
          className="lamp__hit"
          cx="124"
          cy="347"
          r="66"
          fill="#C4C4C4"
          fillOpacity=".1"
        />

        <defs>
          <linearGradient
            id="opening-shade"
            x1="35"
            y1="220"
            x2="295"
            y2="220"
            gradientUnits="userSpaceOnUse"
          >
            <stop />
            <stop offset="1" stopColor="var(--shade)" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="base-shading"
            x1="85"
            y1="444"
            x2="245"
            y2="444"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="var(--b-1)" />
            <stop offset="0.8" stopColor="var(--b-2)" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="side-shading"
            x1="119"
            y1="430"
            x2="245"
            y2="430"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="var(--b-3)" />
            <stop offset="1" stopColor="var(--b-4)" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="post-shading"
            x1="150"
            y1="288"
            x2="180"
            y2="288"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="var(--b-1)" />
            <stop offset="1" stopColor="var(--b-2)" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="light"
            x1="165.5"
            y1="218.5"
            x2="165.5"
            y2="483.5"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="var(--l-1)" stopOpacity=".2" />
            <stop offset="1" stopColor="var(--l-2)" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="top-shading"
            x1="56"
            y1="110"
            x2="295"
            y2="110"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="var(--t-1)" stopOpacity=".8" />
            <stop offset="1" stopColor="var(--t-2)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      {/* Quote Component now wrapped with login-form class for animation */}
      <div className="login-form" ref={quoteWrapperRef}>
        {/* Pass the dynamic glow color to the Quote component */}
        <Quote glowColor={currentGlowColor} />
      </div>
    </div>
  );
};

export default App;
