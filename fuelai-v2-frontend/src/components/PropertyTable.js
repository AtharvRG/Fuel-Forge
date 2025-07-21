import React from 'react';
import { Table, Typography } from 'antd';

const { Text } = Typography;

const PropertyTable = ({ data, fuelType }) => {
  if (!data || data.length === 0) {
    return <Text type="secondary">No component details available.</Text>;
  }

  // Define base columns
  const baseColumns = [
    { title: 'Component', dataIndex: 'name', key: 'name', fixed: 'left', width: 200, render: (text) => <Text strong>{text}</Text> },
    { title: 'Percentage', dataIndex: 'percentage', key: 'percentage', width: 120, render: (text) => `${text.toFixed(1)}%` },
  ];

  // Define fuel-specific columns
  const gasolineColumns = [
    { title: 'RON', dataIndex: 'RON', key: 'RON', width: 80 },
    { title: 'MON', dataIndex: 'MON', key: 'MON', width: 80 },
  ];

  const dieselColumns = [
    { title: 'CN', dataIndex: 'CN', key: 'CN', width: 80 },
  ];

  // Define common columns
  const commonColumns = [
    { title: 'LHV', dataIndex: 'LHV', key: 'LHV', width: 80 },
    { title: 'Density', dataIndex: 'Density', key: 'Density', width: 100 },
  ];

  // Assemble the final columns based on fuelType
  const finalColumns = [
      ...baseColumns, 
      ...(fuelType === 'gasoline' ? gasolineColumns : dieselColumns),
      ...commonColumns
  ];

  // Dynamically hide columns if no data exists for them in any row
  const visibleColumns = finalColumns.filter(col => 
    col.fixed || data.some(d => d[col.key] != null)
  );

  return <Table columns={visibleColumns} dataSource={data} pagination={false} rowKey="name" scroll={{ x: 'max-content' }} />;
};

export default PropertyTable;