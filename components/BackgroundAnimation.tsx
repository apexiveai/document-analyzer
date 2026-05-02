"use client";

import { motion } from "framer-motion";

export default function BackgroundAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Blue Blob */}
      <motion.div
        animate={{
          x: [0, 150, -100, 0],
          y: [0, 100, 200, 0],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{ willChange: "transform" }}
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px]"
      />

      {/* Indigo Blob */}
      <motion.div
        animate={{
          x: [0, -120, 80, 0],
          y: [0, 150, -60, 0],
          scale: [1, 0.8, 1.2, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{ willChange: "transform" }}
        className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px]"
      />

      {/* Accent Cyan Blob */}
      <motion.div
        animate={{
          x: [0, 150, -100, 0],
          y: [0, -100, 120, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{ willChange: "transform" }}
        className="absolute top-[30%] left-[40%] w-[400px] h-[400px] bg-cyan-300/10 rounded-full blur-[80px]"
      />
    </div>
  );
}
