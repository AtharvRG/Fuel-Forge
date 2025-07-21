import React from 'react';
import { Row, Col, Skeleton, Typography } from 'antd';
import { motion } from 'framer-motion';
import './FuelGauges.css'; // We will create this new CSS file

const { Text } = Typography;

// This is our new, custom, and reliable gauge component
const CustomMeter = ({ value, range, text, unit = '' }) => {
  // If the value is not a valid number, render a placeholder skeleton
  if (typeof value !== 'number' || isNaN(value)) {
    return (
      <div className="custom-meter-container">
        <Skeleton.Input active style={{ width: '100%', height: '48px' }} />
      </div>
    );
  }

  // Calculate the percentage for the bar width, clamped between 0 and 100
  const percent = Math.max(0, Math.min(100, ((value - range[0]) / (range[1] - range[0])) * 100));

  return (
    <div className="custom-meter-container">
      <div className="meter-header">
        <Text className="meter-text">{text}</Text>
        <Text className="meter-value">{value.toFixed(1)} <span className="meter-unit">{unit}</span></Text>
      </div>
      <div className="meter-bar-background">
        <motion.div
          className="meter-bar-foreground"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} // A smooth easing function
        />
      </div>
      <div className="meter-range">
        <span>{range[0]}</span>
        <span>{range[1]}</span>
      </div>
    </div>
  );
};


const FuelGauges = ({ result, isGasoline }) => {
  // If there's no result, show skeletons. This is safe.
  if (!result) {
    return (
      <div className="gauges-skeleton-container">
        <Skeleton.Input active style={{ width: '100%', height: '80px' }} />
        <Skeleton.Input active style={{ width: '100%', height: '80px' }} />
      </div>
    );
  }

  const primaryMetric = isGasoline ? 'RON' : 'CN';
  const primaryValue = result[primaryMetric];
  const primaryRange = isGasoline ? [70, 110] : [40, 65];

  const lhvValue = result.LHV;
  const lhvRange = [25, 48];

  return (
    <div className="fuel-gauges-wrapper">
      <CustomMeter value={primaryValue} range={primaryRange} text={primaryMetric} />
      <CustomMeter value={lhvValue} range={lhvRange} text="Energy Content" unit="MJ/kg" />
    </div>
  );
};

export default FuelGauges;