import React, {useEffect, useRef, useState} from "react";
import {Plot} from "@d3plus/react";
import {sharedConfig, animationFrames} from "./Logo-Frames.js";

const duration = 3000;
const {height, width} = sharedConfig;

const Logo = () => {
  const [frame, setFrame] = useState(0);
  const [scale, setScale] = useState(1);
  const intervalRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (animationFrames.length > 1) {
      intervalRef.current = setInterval(() => {
        setFrame(prevFrame => prevFrame + 1);
      }, duration);
    }
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (frame >= animationFrames.length - 1) {
      clearInterval(intervalRef.current);
    }
  }, [frame]);

  // The logo always draws at one size and scales down to fit narrow columns,
  // so its geometry stays identical on every screen.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setScale(Math.min(1, entry.contentRect.width / width));
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  return frame >= 0 ? (
    <div ref={wrapperRef}>
      <div
        style={{height: height * scale, margin: "0 auto", width: width * scale}}
      >
        <div
          style={{
            height,
            pointerEvents: "none",
            transform: `scale(${scale})`,
            transformOrigin: "0 0",
            width,
          }}
        >
          <Plot
            className="d3plus-logo"
            config={{...sharedConfig, ...animationFrames[frame]}}
          />
        </div>
      </div>
    </div>
  ) : null;
};

export default Logo;
