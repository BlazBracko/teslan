'use client';

import { motion, MotionValue } from 'framer-motion';
import { SpearConfig } from '@/data/spears';

interface AsparagusSpearProps {
  config: SpearConfig;
  x: MotionValue<number>;
  y: MotionValue<number>;
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  opacity: MotionValue<number>;
}

export default function AsparagusSpear({
  config,
  x,
  y,
  rotate,
  scale,
  opacity,
}: AsparagusSpearProps) {
  const { height, width, color, colorDark, bractsCount } = config;

  // Calculate dimensions for SVG elements
  const tipHeight = height * 0.25;
  const stemHeight = height * 0.75;
  const stemY = tipHeight;

  // Generate bracts based on bractsCount
  const bracts = Array.from({ length: bractsCount }, (_, i) => {
    const position = (i + 1) / (bractsCount + 1);
    const side = i % 2 === 0 ? 0.3 : 0.7;
    const rotateDir = i % 2 === 0 ? -1 : 1;
    return {
      x: width * side,
      y: tipHeight + stemHeight * position,
      rotate: rotateDir * (20 + Math.random() * 10),
    };
  });

  return (
    <motion.div
      style={{
        x,
        y,
        rotate,
        scale,
        opacity,
        willChange: 'transform',
      }}
      className="absolute"
    >
      <svg
        width={width * 2}
        height={height}
        viewBox={`0 0 ${width * 2} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.g>
          {/* Asparagus Tip - Teardrop/pointed shape */}
          <path
            d={`
              M ${width} 0
              C ${width * 1.4} ${tipHeight * 0.3}, ${width * 1.5} ${tipHeight * 0.6}, ${width * 1.3} ${tipHeight}
              L ${width * 0.7} ${tipHeight}
              C ${width * 0.5} ${tipHeight * 0.6}, ${width * 0.6} ${tipHeight * 0.3}, ${width} 0
            `}
            fill={colorDark}
          />

          {/* Asparagus Stem - Rounded rectangle */}
          <rect
            x={width * 0.6}
            y={stemY}
            width={width * 0.8}
            height={stemHeight}
            rx={width * 0.3}
            fill={color}
          />

          {/* Small bracts (poganjki) on the stem */}
          {bracts.map((bract, index) => (
            <path
              key={index}
              d={`
                M ${bract.x} ${bract.y}
                Q ${bract.x + (bract.rotate > 0 ? width * 0.15 : -width * 0.15)} ${bract.y + height * 0.03},
                  ${bract.x + (bract.rotate > 0 ? width * 0.2 : -width * 0.2)} ${bract.y + height * 0.05}
              `}
              stroke={colorDark}
              strokeWidth={width * 0.08}
              strokeLinecap="round"
              fill="none"
            />
          ))}

          {/* Stem details - vertical lines for texture */}
          <line
            x1={width * 0.75}
            y1={stemY + 5}
            x2={width * 0.75}
            y2={stemY + stemHeight - 5}
            stroke={colorDark}
            strokeWidth={0.5}
            opacity={0.3}
          />
          <line
            x1={width * 1.25}
            y1={stemY + 5}
            x2={width * 1.25}
            y2={stemY + stemHeight - 5}
            stroke={colorDark}
            strokeWidth={0.5}
            opacity={0.3}
          />
        </motion.g>
      </svg>
    </motion.div>
  );
}
