import React, {useEffect, useRef, useState} from "react";
import {Plot} from "@d3plus/react";
import {sharedConfig, animationFrames} from "./Logo-Frames.js";

const duration = 4000;

const Logo = () => {

  const [frame, setFrame] = useState(-1);
  const intervalRef = useRef(null);

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

  return frame >= 0 ? <Plot config={{...sharedConfig, ...animationFrames[frame]}} /> : null;
};

export default Logo;
