import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { IntroScreen } from '@/components/IntroScreen';
import { HackerClock } from '@/components/HackerClock';
import { MiniCalendar } from '@/components/MiniCalendar';
import { RemindersList } from '@/components/RemindersList';
import { ChatInterface } from '@/components/ChatInterface';
import { ModeSwitcher, ModeIndicator } from '@/components/ModeSwitcher';
import { Navigation } from '@/components/Navigation';
import { SettingsPage } from '@/components/SettingsPage';
import { AddReminderModal } from '@/components/AddReminderModal';
import { useAppState } from '@/hooks/useAppState';
import { aiRouter } from '@/services/ai-router';
import { Message, Attachment } from '@/types';

type Tab = 'home' | 'chat' | 'calendar' | 'settings';

const Index = () => {
  const {
    mode,
    setMode,
    toggleMode,
    messages,
    addMessage,
    reminders,
    addReminder,
    toggleReminder,
    deleteReminder,
    events,
    apiConfig,
    setApiConfig,
    isLoading,
    hasSeenIntro,
    markIntroSeen,
  } = useAppState();

  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (activeTab === 'settings') {
      setShowSettings(true);
    }
  }, [activeTab]);

  const handleSendMessage = async (content: string, attachments?: Attachment[]) => {
    // Add user message
    await addMessage({
      role: 'user',
      content,
      mode,
      attachments,
    });

    // Get AI response
    const response = await aiRouter.sendMessage(content, messages);
    
    // Add assistant message
    await addMessage({
      role: 'assistant',
      content: response.content,
      mode,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnimatePresence>
        {!hasSeenIntro && (
          <IntroScreen onComplete={markIntroSeen} />
        )}
      </AnimatePresence>

      {hasSeenIntro && (
        <>
          {/* Header */}
          <header className="fixed top-0 left-0 right-0 glass border-b border-border z-40">
            <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
              <ModeIndicator mode={mode} />
              <ModeSwitcher mode={mode} onToggle={toggleMode} />
            </div>
          </header>

          {/* Main content */}
          <main className="pt-14 pb-20 min-h-screen">
            <AnimatePresence mode="wait">
              {activeTab === 'home' && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-4 max-w-lg mx-auto space-y-4"
                >
                  <HackerClock />
                  
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-mono font-medium">Reminders</h2>
                      <button
                        onClick={() => setShowAddReminder(true)}
                        className="p-2 bg-primary/20 hover:bg-primary/30 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4 text-primary" />
                      </button>
                    </div>
                    <RemindersList
                      reminders={reminders.filter(r => !r.completed).slice(0, 5)}
                      onToggle={toggleReminder}
                      onDelete={deleteReminder}
                    />
                  </div>

                  <MiniCalendar events={events} />
                </motion.div>
              )}

              {activeTab === 'chat' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="h-[calc(100vh-7.5rem)]"
                >
                  <ChatInterface
                    mode={mode}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                  />
                </motion.div>
              )}

              {activeTab === 'calendar' && (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-4 max-w-lg mx-auto space-y-4"
                >
                  <MiniCalendar events={events} />
                  
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-mono font-medium">All Reminders</h2>
                      <button
                        onClick={() => setShowAddReminder(true)}
                        className="p-2 bg-primary/20 hover:bg-primary/30 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4 text-primary" />
                      </button>
                    </div>
                    <RemindersList
                      reminders={reminders}
                      onToggle={toggleReminder}
                      onDelete={deleteReminder}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Navigation */}
          <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Modals */}
          <AnimatePresence>
            {showAddReminder && (
              <AddReminderModal
                onAdd={addReminder}
                onClose={() => setShowAddReminder(false)}
              />
            )}
            
            {showSettings && (
              <SettingsPage
                apiConfig={apiConfig}
                onSave={async (config) => {
                  await setApiConfig(config);
                  setShowSettings(false);
                  setActiveTab('home');
                }}
                onClose={() => {
                  setShowSettings(false);
                  setActiveTab('home');
                }}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

export default Index;
