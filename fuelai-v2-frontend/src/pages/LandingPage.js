import React, { Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Button, Row, Col, Typography } from 'antd';
import { ArrowRightOutlined, LineChartOutlined, SlidersOutlined, BuildOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei'; 
import { Molecule } from '../components/canvas/Molecule';
import '../styles/LandingPage.css';

const { Title, Paragraph } = Typography;


const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const FeatureCard = ({ icon, title, text }) => (
    <motion.div className="feature-card-new" variants={fadeIn}>
      <div className="feature-icon-new">{icon}</div>
      <Title level={4}>{title}</Title>
      <Paragraph>{text}</Paragraph>
    </motion.div>
);


const LandingPage = () => {
  return (
    <div className="landing-page-new">
      {/* Hero Section */}
      <section className="hero-section-new">
        <Row align="middle" style={{ height: '100%' }}>
          <Col xs={24} lg={12} className="hero-text-content">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.h1 variants={fadeIn}>
                Fuel Forge
              </motion.h1>
              <motion.p className="hero-subtitle" variants={fadeIn}>
                The future of energy is not found, it's forged.
                Harness the power of AI to design, analyze, and perfect the next generation of fuels.
              </motion.p>
              <motion.div variants={fadeIn}>
                <Link to="/tool">
                  <Button type="primary" size="large" className="hero-cta-button">
                    Enter the Forge <ArrowRightOutlined />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </Col>
          <Col xs={24} lg={12} className="hero-3d-canvas">
            <Suspense fallback={null}>
              <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 10], fov: 45, near: 0.1, far: 100 }}>
                <ambientLight intensity={0.8} />
                <spotLight
                  position={[20, 20, 20]}
                  angle={0.15}
                  penumbra={1}
                  intensity={2}
                  castShadow
                />
                <pointLight position={[-10, -10, -10]} intensity={1.5} />
                

                <Stage intensity={0.5} environment={null} preset="rembrandt" adjustCamera={false}>
                  <Molecule scale={0.8} /> {/* Shrink the molecule itself */}
                </Stage>
                
                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
              </Canvas>
            </Suspense>
          </Col>

        </Row>
      </section>

      <section className="intro-section">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8 }}
        >
          <Title level={2} style={{ textAlign: 'center' }}>
            From Raw Data to Refined Results
          </Title>
          <Paragraph className="intro-paragraph">
            Fuel Forge transforms the complex art of fuel blending into a precise science. Our platform provides an intuitive interface backed by powerful neural networks, enabling you to innovate faster and with greater confidence than ever before.
          </Paragraph>
        </motion.div>
      </section>

      <section className="features-grid-section">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <Row gutter={[48, 48]}>
            <Col xs={24} md={8}>
              <FeatureCard
                icon={<SlidersOutlined />}
                title="Intuitive Design"
                text="Visually construct complex fuel recipes with simple, interactive controls. Blend components and see the composition update in real-time."
              />
            </Col>
            <Col xs={24} md={8}>
              <FeatureCard
                icon={<BuildOutlined />}
                title="AI-Powered Prediction"
                text="Leverage our pre-trained models to instantly predict critical performance metrics, saving invaluable time and resources on physical testing."
              />
            </Col>
            <Col xs={24} md={8}>
              <FeatureCard
                icon={<LineChartOutlined />}
                title="Insightful Analysis"
                text="Go beyond numbers. Visualize data with interactive charts, compare blends side-by-side, and export professional reports for stakeholder review."
              />
            </Col>
          </Row>
        </motion.div>
      </section>

      <section className="final-cta-new">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <Title level={2} color='#ffffff'>Begin Your Discovery.</Title>
          <Paragraph color='#ffffff'>Step into the future of fuel engineering. Your next breakthrough is just a blend away.</Paragraph>
          <Link to="/tool">
            <Button type="primary" size="large" className="final-cta-button">
              Start Forging
            </Button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default LandingPage;