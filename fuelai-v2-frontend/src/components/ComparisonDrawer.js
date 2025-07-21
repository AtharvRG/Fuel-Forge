import React from 'react';
import { Drawer, Table, Button, Space, Typography } from 'antd';
import { DeleteOutlined, FilePdfOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

// Use React.forwardRef to allow the parent to pass a ref to the inner div
const ComparisonDrawer = React.forwardRef(({ blends, visible, onClose, onRemove, onClear, onExport }, ref) => {
  const properties = [
    { key: 'Viability_Score', name: 'Viability Score' },
    { key: 'RON', name: 'RON' },
    { key: 'MON', name: 'MON' },
    { key: 'AKI', name: 'AKI' },
    { key: 'CN', name: 'Cetane Number' },
    { key: 'LHV', name: 'LHV (MJ/kg)' },
    { key: 'Density', name: 'Density (g/mL)' },
    { key: 'O2_wt_percent', name: 'Oxygen (wt%)' },
    { key: 'Simulated_Cost_per_L', name: 'Cost ($/L)' },
    { key: 'Efficiency_Score', name: 'Efficiency Score' },
    { key: 'Oxidative_Stability', name: 'Oxidative Stability (h)'},
    { key: 'Gum_Content', name: 'Gum Content (mg/100mL)'},
    { key: 'Acidity', name: 'Acidity (mg KOH/g)'},
  ];

  const columns = [
    {
      title: 'Property',
      dataIndex: 'property',
      key: 'property',
      fixed: 'left',
      width: 220,
      render: (text) => <strong>{text}</strong>,
    },
    ...blends.map((blend, index) => ({
      title: () => (
        <Space direction="vertical" size="small" align="center">
          <Text strong>Blend {index + 1}</Text>
          <Text type="secondary" style={{ fontSize: 12, textAlign: 'center', maxWidth: 120 }}>
            {blend.recipe.map(r => r.name.split(' ')[0]).join(' + ')}
          </Text>
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => onRemove(blend.id)} />
        </Space>
      ),
      dataIndex: `blend_${blend.id}`,
      key: `blend_${blend.id}`,
      align: 'center',
      width: 150,
    })),
  ];

  const dataSource = properties
    .filter(prop => blends.some(b => b[prop.key] !== undefined && b[prop.key] !== null))
    .map(prop => {
      const row = { key: prop.key, property: prop.name };
      blends.forEach(blend => {
        const value = blend[prop.key];
        row[`blend_${blend.id}`] = (typeof value === 'number') ? value.toFixed(2) : (value ?? 'N/A');
      });
      return row;
    });

  // This is the content we want to print
  const PrintableContent = (
    <div ref={ref} className="printable-comparison">
        <Title level={4} style={{textAlign: 'center', padding: '20px'}}>Fuel Forge Blend Comparison Report</Title>
        <Table
            columns={columns.map(col => ({...col, title: col.title}))} // Clone columns to avoid modifying original
            dataSource={dataSource}
            pagination={false}
            bordered
            scroll={{ x: 'max-content' }}
            summary={() => (
                <Table.Summary.Row>
                    <Table.Summary.Cell index={0} fixed="left"><strong>Recipe</strong></Table.Summary.Cell>
                    {blends.map(blend => (
                        <Table.Summary.Cell index={blend.id} key={blend.id} align="center">
                            <div style={{fontSize: 12}}>
                                {blend.recipe.map(r => <div key={r.name}>{r.percentage.toFixed(1)}% {r.name}</div>)}
                            </div>
                        </Table.Summary.Cell>
                    ))}
                </Table.Summary.Row>
            )}
        />
    </div>
  );

  return (
    <>
      {/* Hidden container for PDF export */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {PrintableContent}
      </div>

      {/* Visible Drawer for UI */}
      <Drawer
        title={`Comparing ${blends.length} Blends`}
        placement="right"
        width={'85vw'}
        onClose={onClose}
        open={visible}
        extra={
          <Space>
            <Button danger onClick={onClear}>Clear All</Button>
            <Button type="primary" icon={<FilePdfOutlined />} onClick={onExport}>Export PDF</Button>
          </Space>
        }
      >
        {/* We render the same content, but without the ref */}
        {PrintableContent}
      </Drawer>
    </>
  );
});

export default ComparisonDrawer;