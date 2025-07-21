import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from 'antd';
import './FuelRadarChart.css';

const CustomRadarChart = ({ result, isGasoline }) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(300);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!result) {
    return <Skeleton.Node active style={{ width: '100%', height: '350px', borderRadius: '50%' }}><div /></Skeleton.Node>;
  }

  const properties = [
    { label: 'Octane/Cetane', value: isGasoline ? ((result.AKI - 80) / (105 - 80)) : ((result.CN - 40) / (65 - 40)) },
    { label: 'Energy (LHV)', value: (result.LHV - 25) / (48 - 25) },
    { label: 'Efficiency', value: result.Efficiency_Score / 100 },
    { label: 'Cleanliness (O₂)', value: result.O2_wt_percent / 20 },
    { label: 'Cost-Effectiveness', value: 1 - ((result.Simulated_Cost_per_L - 0.6) / (1.5 - 0.6)) },
  ];

  // --- THIS IS WHERE YOU CONTROL THE VIEW AREA ---
  // 1. Define the size of the drawing itself.
  const drawingSize = Math.min(450, Math.max(300, containerWidth));

  // 2. Define the viewBox. Making it larger than the drawingSize "zooms out".
  // This creates the padding you want for the labels.
  const viewBoxSize = drawingSize + 220; // The '80' is your padding control. Increase it to zoom out more.
  
  // 3. All calculations are now based on the viewBoxSize.
  const center = viewBoxSize / 2;
  const chartRadius = center * 0.75; // Use a percentage of the center to define the main chart area.

  const numLevels = 4;

  const getPoint = (value, index) => {
    const angle = (Math.PI * 2 * index) / properties.length - Math.PI / 2;
    const radius = Math.max(0, Math.min(1, value)) * chartRadius;
    return {
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
    };
  };

  const points = properties.map((prop, i) => getPoint(prop.value, i));
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') + ' Z';

  return (
    <div className="radar-chart-container" ref={containerRef}>
      {/* The physical size of the SVG on the page */}
      <svg width={drawingSize} height={drawingSize} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
        <g className="grid-group">
          {[...Array(numLevels + 1)].map((_, levelIndex) => {
            if (levelIndex === 0) return null;
            const radius = (chartRadius * levelIndex) / numLevels;
            const scoreLabel = (100 * levelIndex) / numLevels;
            return (
              <g key={`level-${levelIndex}`}>
                <polygon
                  points={properties.map((_, i) => {
                    const angle = (Math.PI * 2 * i) / properties.length - Math.PI / 2;
                    return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`;
                  }).join(' ')}
                  className="radar-grid"
                />
                <text
                  x={center + 5}
                  y={center - radius}
                  dy="0.3em"
                  className="radar-grid-label"
                >
                  {scoreLabel}
                </text>
              </g>
            );
          })}
        </g>

        <g className="spokes-group">
          {properties.map((prop, i) => {
            const angle = (Math.PI * 2 * i) / properties.length - Math.PI / 2;
            const labelRadius = chartRadius + 20; // Position labels outside the main chart
            const x = center + Math.cos(angle) * labelRadius;
            const y = center + Math.sin(angle) * labelRadius;
            
            const spokeRadius = chartRadius;
            const spokeX = center + Math.cos(angle) * spokeRadius;
            const spokeY = center + Math.sin(angle) * spokeRadius;

            return (
              <g key={prop.label}>
                <line x1={center} y1={center} x2={spokeX} y2={spokeY} className="radar-spoke" />
                <text
                  x={x}
                  y={y}
                  dy="0.3em"
                  textAnchor={x > center + 10 ? 'start' : x < center - 10 ? 'end' : 'middle'}
                  className="radar-label"
                >
                  {prop.label}
                </text>
              </g>
            );
          })}
        </g>

        <motion.path
          d={pathData}
          className="radar-area"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, ease: 'circOut' }}
        />
        <motion.path
          d={pathData}
          className="radar-stroke"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, ease: 'circOut' }}
        />
      </svg>
    </div>
  );
};

export default CustomRadarChart;