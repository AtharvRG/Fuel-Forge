import React from 'react';
import './ComponentTooltip.css';

const ComponentTooltip = ({ details, fuelType }) => {
  if (!details || Object.keys(details).length === 0) {
    return null;
  }

  // Define properties for each fuel type
  const gasolineProps = [
    { key: 'RON', label: 'RON' },
    { key: 'MON', label: 'MON' },
    { key: 'LHV', label: 'LHV (MJ/kg)' },
    { key: 'Density', label: 'Density' },
  ];

  const dieselProps = [
    { key: 'CN', label: 'Cetane No.' },
    { key: 'LHV', label: 'LHV (MJ/kg)' },
    { key: 'Density', label: 'Density' },
  ];

  // --- THE FIX IS HERE ---
  // Choose the correct property list based on the fuelType prop
  const propertiesToShow = fuelType === 'gasoline' ? gasolineProps : dieselProps;

  // Filter the properties to only include those that exist in the 'details' object
  const availableProperties = propertiesToShow.filter(prop => 
    details[prop.key] !== null && details[prop.key] !== undefined
  );

  // If no relevant properties are available for the current fuel type, don't show the tooltip
  if (availableProperties.length === 0) {
      return <div style={{ padding: '8px', color: '#888' }}>No relevant properties for this fuel type.</div>;
  }

  return (
    <div className="tooltip-container">
      <table className="tooltip-table">
        <tbody>
          {availableProperties.map(({ key, label }) => (
            <tr key={key}>
              <td className="tooltip-table-label">{label}</td>
              <td className="tooltip-table-value">
                {typeof details[key] === 'number' ? details[key].toFixed(2) : details[key]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ComponentTooltip;