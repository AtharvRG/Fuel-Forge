import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Row, Col, Cascader, Slider, Button, Card, Spin, message, Typography, Statistic, Space, Divider, Tabs, Tag, Tooltip } from 'antd';
import { ExperimentOutlined, FilePdfOutlined, PlusOutlined, MinusCircleOutlined, PushpinOutlined, ClearOutlined, TableOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../api/apiClient';
import BlendReport from '../components/BlendReport';
import ComparisonDrawer from '../components/ComparisonDrawer';
import PropertyTable from '../components/PropertyTable';
import ComponentTooltip from '../components/ComponentTooltip';
import '../styles/ToolPage.css';
import { exportToPdf } from '../utils/pdfExporter';

const { Title, Text, Paragraph } = Typography;

const ToolPage = () => {
    const [fuelType, setFuelType] = useState('gasoline');
    const [rawComponents, setRawComponents] = useState({ gasolineBases: [], gasolineAdditives: [], dieselBases: [], dieselAdditives: [] });
    const [recipe, setRecipe] = useState([]);
    const [currentResult, setCurrentResult] = useState(null);
    const [pinnedBlends, setPinnedBlends] = useState([]);
    const [isComparisonVisible, setIsComparisonVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const reportRef = useRef();
    const comparisonRef = useRef(null);

    // --- THE DEFINITIVE FIX IS HERE ---
    // We create a new memoized value that pre-processes the options with tooltips.
    // This runs ONLY when the raw component data or the fuelType changes.
    const optionsWithTooltips = useMemo(() => {
        const addTooltips = (options, type) => {
            if (!options) return [];
            return options.map(group => ({
                ...group,
                children: group.children.map(option => ({
                    ...option,
                    label: (
                        <Tooltip
                            title={<ComponentTooltip details={option.details} fuelType={type} />}
                            placement="right"
                            mouseEnterDelay={0.3}
                            overlayClassName="component-tooltip-overlay"
                        >
                            <span>{option.label}</span>
                        </Tooltip>
                    )
                }))
            }));
        };

        return {
            gasolineBases: addTooltips(rawComponents.gasolineBases, 'gasoline'),
            gasolineAdditives: addTooltips(rawComponents.gasolineAdditives, 'gasoline'),
            dieselBases: addTooltips(rawComponents.dieselBases, 'diesel'),
            dieselAdditives: addTooltips(rawComponents.dieselAdditives, 'diesel'),
        };
    }, [rawComponents]);

    const { currentBases, currentAdditives } = useMemo(() => {
        if (fuelType === 'gasoline') {
            return { currentBases: optionsWithTooltips.gasolineBases, currentAdditives: optionsWithTooltips.gasolineAdditives };
        }
        return { currentBases: optionsWithTooltips.dieselBases, currentAdditives: optionsWithTooltips.dieselAdditives };
    }, [fuelType, optionsWithTooltips]);

    useEffect(() => {
        apiClient.get('/get_components').then(response => {
            const data = response.data;
            setRawComponents(data); // Store the raw data
            
            // Initialize recipe with data from the raw source
            if (data.gasolineBases?.[0]?.children?.[0]?.value && data.gasolineAdditives?.[0]?.children?.[0]?.value) {
                setRecipe([
                    { id: Date.now(), name: data.gasolineBases[0].children[0].value, percentage: 90 },
                    { id: Date.now() + 1, name: data.gasolineAdditives[0].children[0].value, percentage: 10 },
                ]);
            }
        }).catch(() => message.error('Failed to load component data from the server.'));
    }, []);

    const handleFuelTypeChange = useCallback((type) => {
        setFuelType(type);
        setCurrentResult(null);
        setPinnedBlends([]);
        
        let newRecipe = [];
        if (type === 'gasoline' && rawComponents.gasolineBases?.[0]?.children?.[0]?.value) {
            newRecipe = [
                { id: Date.now(), name: rawComponents.gasolineBases[0].children[0].value, percentage: 90 },
                { id: Date.now() + 1, name: rawComponents.gasolineAdditives[0].children[0].value, percentage: 10 },
            ];
        } else if (type === 'diesel' && rawComponents.dieselBases?.[0]?.children?.[0]?.value) {
            newRecipe = [
                { id: Date.now(), name: rawComponents.dieselBases[0].children[0].value, percentage: 95 },
                { id: Date.now() + 1, name: rawComponents.dieselAdditives[0].children[0].value, percentage: 5 },
            ];
        }
        setRecipe(newRecipe);
    }, [rawComponents]);

    const updateRecipe = useCallback((id, field, value) => {
        let finalValue = value;
        if (Array.isArray(value)) {
            finalValue = value[value.length - 1];
        }

        if (field === 'name' && recipe.some(item => item.name === finalValue && item.id !== id)) {
            message.error(`'${finalValue}' is already in the recipe. Please choose a different component.`);
            return;
        }
        setRecipe(prevRecipe => prevRecipe.map(item => item.id === id ? { ...item, [field]: finalValue } : item));
    }, [recipe]);

    const addComponent = useCallback(() => {
        if (recipe.length >= 5) {
            message.warning('For statistical accuracy, a maximum of 5 components is allowed per blend.');
            return;
        }
        const defaultAdditive = currentAdditives?.[0]?.children?.[0]?.value || '';
        if (defaultAdditive) {
            setRecipe(prev => [...prev, { id: Date.now(), name: defaultAdditive, percentage: 0 }]);
        }
    }, [recipe.length, currentAdditives]);

    const removeComponent = useCallback((id) => {
        setRecipe(prev => prev.filter(r => r.id !== id));
    }, []);

    const normalizeRecipe = useCallback(() => {
        setRecipe(prev => {
            const total = prev.reduce((sum, item) => sum + item.percentage, 0);
            if (total === 0) return prev;
            const normalized = prev.map(item => ({ ...item, percentage: (item.percentage / total) * 100 }));
            message.success('Recipe normalized to 100%');
            return normalized;
        });
    }, []);
    
    const handlePredict = useCallback(async () => {
        if (recipe.length < 2) {
            message.error('A blend requires at least two components.');
            return;
        }
        const total = recipe.reduce((sum, item) => sum + item.percentage, 0);
        if (Math.abs(total - 100) > 0.1) {
            message.warning('Total percentage is not 100%. Please adjust or normalize.');
            return;
        }
        setIsLoading(true);
        setCurrentResult(null);
        try {
            const response = await apiClient.post('/predict', { fuelType, recipe });
            setCurrentResult(response.data);
            message.success('Prediction successful!');
        } catch (error) {
            message.error(error.response?.data?.error || 'Prediction failed.');
        } finally {
            setIsLoading(false);
        }
    }, [recipe, fuelType]);

    const pinResult = useCallback(() => {
        if (currentResult && !pinnedBlends.find(b => b.id === currentResult.id)) {
            setPinnedBlends(prev => [...prev, currentResult]);
            message.success(`Blend pinned for comparison.`);
        }
    }, [currentResult, pinnedBlends]);

    const usedComponentNames = useMemo(() => new Set(recipe.map(item => item.name)), [recipe]);

    const getFilteredOptions = useCallback((options) => {
        return options.map(group => ({
            ...group,
            disabled: group.children.every(opt => usedComponentNames.has(opt.value)),
            children: group.children.map(option => ({
                ...option,
                disabled: usedComponentNames.has(option.value)
            }))
        }));
    }, [usedComponentNames]);

    const totalPercentage = useMemo(() => recipe.reduce((sum, item) => sum + item.percentage, 0), [recipe]);
    const isPinned = useMemo(() => currentResult && pinnedBlends.some(b => b.id === currentResult.id), [currentResult, pinnedBlends]);

    const analysisTabs = useMemo(() => {
        if (!currentResult) return [];
        return [
            { key: '1', label: 'Overview', children: <BlendReport result={currentResult} /> },
            { key: '2', label: 'Component Properties', children: <PropertyTable data={currentResult.component_details || []} fuelType={fuelType} /> },
            { 
                key: '3', 
                label: 'Viability Analysis', 
                children: (
                    <div className="ai-insight-text">
                        <Title level={5}>Blend Stability Analysis</Title>
                        <Statistic title="Viability Score" value={currentResult.Viability_Score} suffix="/ 100" />
                        <Paragraph style={{ marginTop: '1rem' }}>{currentResult.viability_insight}</Paragraph>
                    </div>
                ) 
            },
            { key: '4', label: 'AI Summary', children: <Paragraph className="ai-insight-text">{currentResult.ai_insight || 'No insights generated.'}</Paragraph> },
        ];
    }, [currentResult, fuelType]);

    return (
        <div className="tool-page-container">
            <AnimatePresence>
                {pinnedBlends.length > 0 && (
                    <motion.div layout initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="pinned-blends-bar">
                        <Space>
                            <PushpinOutlined style={{ color: 'var(--primary-color)' }} />
                            <Text strong>Pinned for Comparison:</Text>
                            <Space wrap>
                                {pinnedBlends.map(blend => (
                                    <Tag key={blend.id} closable onClose={() => setPinnedBlends(pinnedBlends.filter(p => p.id !== blend.id))}>
                                        {blend.recipe.map(r => r.name.split(' ')[0]).join(' + ')}
                                    </Tag>
                                ))}
                            </Space>
                        </Space>
                        <Space>
                            <Button danger icon={<ClearOutlined />} onClick={() => setPinnedBlends([])} size="small">Clear</Button>
                            <Button type="primary" icon={<TableOutlined />} onClick={() => setIsComparisonVisible(true)}>
                                Compare ({pinnedBlends.length})
                            </Button>
                        </Space>
                    </motion.div>
                )}
            </AnimatePresence>

            <Title level={2} style={{ textAlign: 'center', marginBottom: '2rem' }}>Fuel Forge AI Predictor & Analyzer</Title>
            <Row gutter={[32, 32]}>
                <Col xs={24} lg={8}>
                    <Card title="1. Configure Blend" bordered={false} className="workflow-card">
                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                            <div className="fuel-type-toggle">
                                <Button size="large" type={fuelType === 'gasoline' ? 'primary' : 'default'} onClick={() => handleFuelTypeChange('gasoline')}>Gasoline</Button>
                                <Button size="large" type={fuelType === 'diesel' ? 'primary' : 'default'} onClick={() => handleFuelTypeChange('diesel')}>Diesel</Button>
                            </div>
                            <Divider>Recipe</Divider>
                            <div className="component-list-wrapper">
                                <AnimatePresence>
                                    {recipe.map((item, index) => (
                                        <motion.div 
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                                            className="component-row-new"
                                        >
                                            <Cascader
                                                value={[item.name.split(' (')[0], item.name]}
                                                style={{ flexGrow: 1 }}
                                                onChange={(value) => updateRecipe(item.id, 'name', value)}
                                                options={getFilteredOptions(index === 0 ? currentBases : currentAdditives)}
                                                placeholder="Select Component..."
                                                expandTrigger="hover"
                                                allowClear={false}
                                            />
                                            <Button 
                                                icon={<MinusCircleOutlined />} 
                                                danger 
                                                onClick={() => removeComponent(item.id)}
                                                disabled={recipe.length <= 2}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                            <Button 
                                block 
                                type="dashed" 
                                onClick={addComponent} 
                                icon={<PlusOutlined />}
                                disabled={recipe.length >= 5}
                            >
                                Add Component
                            </Button>
                            <Divider>Composition</Divider>
                            <div className="composition-wrapper">
                                {recipe.map((item) => (
                                    <div key={item.id} className="composition-row">
                                        <div className="composition-header">
                                            <Text className="composition-label">{item.name}</Text>
                                            <Text strong className="composition-value">{item.percentage.toFixed(1)}%</Text>
                                        </div>
                                        <Slider
                                            value={item.percentage}
                                            onChange={(value) => updateRecipe(item.id, 'percentage', value)}
                                            min={0}
                                            max={100}
                                            step={0.1}
                                            tooltip={{ open: false }}
                                        />
                                    </div>
                                ))}
                            </div>
                             <div className="total-bar">
                                <Space>
                                    <Text>Total:</Text>
                                    <Text strong style={{ color: Math.abs(totalPercentage - 100) > 0.1 ? '#ff4d4f' : '#52c41a' }}>
                                        {totalPercentage.toFixed(1)}%
                                    </Text>
                                </Space>
                                <Button size="small" onClick={normalizeRecipe} disabled={Math.abs(totalPercentage - 100) < 0.1}>Normalize</Button>
                            </div>
                            <Button block type="primary" icon={<ExperimentOutlined />} size="large" onClick={handlePredict} loading={isLoading}>
                                Forge & Analyze Blend
                            </Button>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} lg={16}>
                    <Card title="2. Analyze Result" bordered={false} className="workflow-card">
                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.div key="loader" className="center-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <Spin size="large" tip="Forging Blend..." />
                                </motion.div>
                            ) : currentResult ? (
                                <motion.div
                                    key={currentResult.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <div ref={reportRef}>
                                        <Tabs defaultActiveKey="1" items={analysisTabs} />
                                    </div>
                                    <Divider />
                                    <Space>
                                        <Button type="primary" icon={<PushpinOutlined />} onClick={pinResult} disabled={isPinned}>
                                            {isPinned ? 'Pinned' : 'Pin for Comparison'}
                                        </Button>
                                        <Button icon={<FilePdfOutlined />} onClick={() => exportToPdf(reportRef.current, `FuelForge_Report_${currentResult.id}`)}>Export Report</Button>
                                    </Space>
                                </motion.div>
                            ) : (
                                <div className="center-content placeholder-text">
                                    <InfoCircleOutlined style={{ fontSize: 48, color: '#ccc' }} />
                                    <Text type="secondary" style={{ marginTop: 16, fontSize: 16 }}>Your blend analysis will appear here.</Text>
                                </div>
                            )}
                        </AnimatePresence>
                    </Card>
                </Col>
            </Row>

            <div ref={comparisonRef}>
                <ComparisonDrawer
                    blends={pinnedBlends}
                    visible={isComparisonVisible}
                    onClose={() => setIsComparisonVisible(false)}
                    onRemove={(id) => setPinnedBlends(pinnedBlends.filter(p => p.id !== id))}
                    onClear={() => setPinnedBlends([])}
                    onExport={() => {
                        const drawerContent = comparisonRef.current?.querySelector('.ant-drawer-body');
                        if (drawerContent) {
                            exportToPdf(drawerContent, 'FuelForge_Comparison');
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default ToolPage;