import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './views/LoginView';
import { AdminView } from './views/AdminView';
import { ChatView } from './views/ChatView';
import { NetworkView } from './views/NetworkView';
import { PdfExportView } from './views/PdfExportView';
import { AuditLogView } from './views/AuditLogView';
import { SystemStatusView } from './views/SystemStatusView';
import { ResetTokenView } from './views/ResetTokenView';
import { InsightsView } from './views/InsightsView';

function AppContent() {
  const { session } = useAuth();
  const [activeScreen, setActiveScreen] = useState('login');

  // If session is active and currently on login, route appropriately
  React.useEffect(() => {
    if (session?.user && activeScreen === 'login') {
      if (session.profile?.role === 'admin') {
        setActiveScreen('admin');
      } else {
        setActiveScreen('chat');
      }
    } else if (!session && activeScreen !== 'login' && activeScreen !== 'status' && activeScreen !== 'reset') {
      setActiveScreen('login');
    }
  }, [session]);

  const pageVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 }
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'login':
        return <LoginView setActiveScreen={setActiveScreen} />;
      case 'admin':
        return <AdminView setActiveScreen={setActiveScreen} />;
      case 'chat':
        return <ChatView setActiveScreen={setActiveScreen} />;
      case 'network':
        return <NetworkView setActiveScreen={setActiveScreen} />;
      case 'pdf':
        return <PdfExportView setActiveScreen={setActiveScreen} />;
      case 'audit':
        return <AuditLogView setActiveScreen={setActiveScreen} />;
      case 'status':
        return <SystemStatusView setActiveScreen={setActiveScreen} />;
      case 'reset':
        return <ResetTokenView setActiveScreen={setActiveScreen} />;
      case 'insights':
        return <InsightsView setActiveScreen={setActiveScreen} />;
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
      <AppContent />
    </AuthProvider>
  );
}
