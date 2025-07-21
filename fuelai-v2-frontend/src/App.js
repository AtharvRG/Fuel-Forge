// src/App.js (Updated)

import React from 'react';
import { ConfigProvider, Layout, Button } from 'antd';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ToolPage from './pages/ToolPage';
import './App.css';
import NavLogo from './assets/logo-nav.svg';

const { Header, Content, Footer } = Layout;

const App = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0a9396',
          fontFamily: 'Inter, sans-serif',
          borderRadius: 12,
        },
      }}
    >
      <Router>
        <Layout style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
          <Header style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            padding: '0 50px',
            borderBottom: '1px solid #e8e8e8',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <Link to="/" className="nav-logo-link">
              <img src={NavLogo} alt="Fuel Forge Logo" className="nav-logo-img" />
              <span className="nav-logo-text">Fuel Forge</span>
            </Link>
            <div style={{ flexGrow: 1 }} />
            <Link to="/tool">
            </Link>
          </Header>
          <Content>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/tool" element={<ToolPage />} />
            </Routes>
          </Content>
          <Footer style={{ textAlign: 'center', backgroundColor: '#f5f5f7' }}>
            Made with love by Team Fuel Forge❤️.
          </Footer>
        </Layout>
      </Router>
    </ConfigProvider>
  );
};

export default App;