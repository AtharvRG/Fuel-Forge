import React, { useRef } from 'react';
import { Card, Table, Button, Space, Typography } from 'antd';
import { FilePdfOutlined, ClearOutlined, DeleteOutlined } from '@ant-design/icons';
import { exportToPdf } from '../utils/pdfExporter';

const { Title } = Typography;

const ComparisonTable = ({ blends, onRemove, onClear }) => {
    const comparisonRef = useRef();

    const properties = [
        { key: 'RON', name: 'RON' },
        { key: 'MON', name: 'MON' },
        { key: 'AKI', name: 'AKI' },
        { key: 'CN', name: 'Cetane Number' },
        { key: 'LHV', name: 'LHV (MJ/kg)' },
        { key: 'Density', name: 'Density (g/mL)' },
        { key: 'O2_wt_percent', name: 'Oxygen (wt%)' },
        { key: 'Simulated_Cost_per_L', name: 'Cost ($/L)' },
        { key: 'Efficiency_Score', name: 'Efficiency Score' },
    ];

    const columns = [
        {
            title: 'Property',
            dataIndex: 'property',
            key: 'property',
            render: (text) => <strong>{text}</strong>,
        },
        ...blends.map((blend, index) => ({
            title: () => (
                <Space direction="vertical" size="small">
                    <span style={{fontWeight: 'bold'}}>Blend {index + 1}</span>
                    <span style={{fontSize: '12px', color: '#888'}}>{blend.recipe[0].name.split(' ')[0]}...</span>
                    <Button icon={<DeleteOutlined />} size="small" danger onClick={() => onRemove(blend.id)} />
                </Space>
            ),
            dataIndex: `blend_${blend.id}`,
            key: `blend_${blend.id}`,
            align: 'center',
        }))
    ];

    const dataSource = properties.map(prop => {
        const row = { key: prop.key, property: prop.name };
        blends.forEach(blend => {
            row[`blend_${blend.id}`] = blend[prop.key] ?? 'N/A';
        });
        return row;
    });

    return (
        <Card title="3. Blend Comparison"
            extra={
                <Space>
                    <Button danger icon={<ClearOutlined />} onClick={onClear}>Clear All</Button>
                    <Button type="primary" icon={<FilePdfOutlined />} onClick={() => exportToPdf(comparisonRef.current, 'FuelAI_Comparison')}>Export PDF</Button>
                </Space>
            }>
            <div ref={comparisonRef}>
                <Title level={4} style={{textAlign: 'center', padding: '20px'}}>Fuel Blend Comparison Report</Title>
                <Table
                    columns={columns}
                    dataSource={dataSource}
                    pagination={false}
                    bordered
                />
            </div>
        </Card>
    );
};

export default ComparisonTable;