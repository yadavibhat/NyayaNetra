import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { dbService } from './lib/api';
import { LoginView } from './views/LoginView';
import { AdminView } from './views/AdminView';
import { ChatView } from './views/ChatView';
import { NetworkView } from './views/NetworkView';
import { PdfExportView } from './views/PdfExportView';
import { AuditLogView } from './views/AuditLogView';
import { SystemStatusView } from './views/SystemStatusView';
import { ResetTokenView } from './views/ResetTokenView';
import { InsightsView } from './views/InsightsView';
import { AdvancedConsoleView } from './views/AdvancedConsoleView';
import { CasesView } from './views/CasesView';

function AppContent() {
  const { session } = useAuth();
  const [activeScreen, setActiveScreen] = useState('login');
  
  // Shared global Case list & selection state
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [cases, setCases] = useState([]);

  // Fetch all cases registered under current credentials
  const reloadCases = async () => {
    if (!session) return;
    try {
      const loadedCases = await dbService.getCases(session);
      setCases(loadedCases);
      if (loadedCases.length > 0 && !selectedCaseId) {
        setSelectedCaseId(loadedCases[0].id || loadedCases[0]._id);
      }
    } catch (err) {
      console.error('Failed to load cases globally:', err);
    }
  };

  useEffect(() => {
    if (session) {
      reloadCases();
    } else {
      setCases([]);
      setSelectedCaseId(null);
    }
  }, [session]);

  // If session is terminated, redirect to login page
  useEffect(() => {
    if (!session && activeScreen !== 'login' && activeScreen !== 'status' && activeScreen !== 'reset') {
      setActiveScreen('login');
    }
  }, [session, activeScreen]);

  const pageVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 }
  };

  const renderScreen = () => {
    const props = {
      setActiveScreen,
      selectedCaseId,
      setSelectedCaseId,
      cases,
      reloadCases
    };

    switch (activeScreen) {
      case 'login':
        return <LoginView setActiveScreen={setActiveScreen} />;
      case 'admin':
        return <AdminView setActiveScreen={setActiveScreen} />;
      case 'cases':
        return <CasesView {...props} />;
      case 'chat':
        return <ChatView {...props} />;
      case 'network':
        return <NetworkView {...props} />;
      case 'pdf':
        return <PdfExportView {...props} />;
      case 'insights':
        return <InsightsView {...props} />;
      case 'advanced':
        return <AdvancedConsoleView {...props} />;
      case 'audit':
        return <AuditLogView setActiveScreen={setActiveScreen} />;
      case 'status':
        return <SystemStatusView setActiveScreen={setActiveScreen} />;
      case 'reset':
        return <ResetTokenView setActiveScreen={setActiveScreen} />;
      default:
        return <LoginView setActiveScreen={setActiveScreen} />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeScreen}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2 }}
        className="w-full h-full"
      >
        {renderScreen()}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}
