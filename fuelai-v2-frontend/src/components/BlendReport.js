import React from 'react';
import { Row, Col, Typography, Statistic, Divider } from 'antd';
import CustomRadarChart from './FuelRadarChart';
import './BlendReport.css';

const { Title, Paragraph } = Typography;

const BlendReport = ({ result }) => {
    if (!result) return null;

    const isGasoline = 'RON' in result;
    const recipeString = result.recipe.map(r => `${r.percentage.toFixed(1)}% ${r.name}`).join(' + ');

    // Define which metrics are "Key" and which are "Other"
    const keyMetrics = isGasoline 
        ? [{ title: 'RON', value: result.RON }, { title: 'MON', value: result.MON }, { title: 'AKI', value: result.AKI }]
        : [{ title: 'Cetane Number', value: result.CN }];
    
    keyMetrics.push({ title: 'Viability Score', value: result.Viability_Score, suffix: '/ 100' });

    const otherMetrics = [
        { title: 'Energy (LHV)', value: result.LHV, suffix: 'MJ/kg' },
        { title: 'Density', value: result.Density, suffix: 'g/mL' },
        { title: 'Oxygen Content', value: result.O2_wt_percent, suffix: '%' },
        { title: 'Simulated Cost', value: result.Simulated_Cost_per_L, prefix: '$', suffix: '/L' },
        { title: 'Efficiency Score', value: result.Efficiency_Score, suffix: '/ 100' },
    ];

    return (
        <div className="blend-report-container">
            <Title level={4} style={{ marginBottom: 4 }}>{recipeString}</Title>
            <Paragraph type="secondary" style={{ marginBottom: '1.5rem' }}>
                Detailed property analysis for the generated blend.
            </Paragraph>

            {/* --- FIX: Chart is now in its own full-width row --- */}
            <Row>
                <Col span={24}>
                    <Title level={5} style={{ textAlign: 'center', marginBottom: 0 }}>Fuel Property Fingerprint</Title>
                    <CustomRadarChart result={result} isGasoline={isGasoline} />
                </Col>
            </Row>

            <Divider />

            {/* Key Metrics are now below the chart */}
            <Title level={5} style={{ marginBottom: '1rem' }}>Key Performance Metrics</Title>
            <div className="key-metrics-grid">
                {keyMetrics.map(metric => (
                    <div key={metric.title} className="metric-card">
                        <Statistic 
                            title={metric.title} 
                            value={metric.value} 
                            precision={1}
                            suffix={metric.suffix}
                            prefix={metric.prefix}
                        />
                    </div>
                ))}
            </div>
            
            <Divider />

            {/* Other Metrics remain in their own section */}
            <Title level={5}>Other Properties</Title>
            <Row gutter={[16, 16]}>
                {otherMetrics.map(metric => (
                    <Col xs={12} sm={8} md={6} lg={4} key={metric.title}>
                        <Statistic 
                            title={metric.title} 
                            value={metric.value} 
                            precision={2}
                            suffix={metric.suffix}
                            prefix={metric.prefix}
                        />
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default BlendReport;