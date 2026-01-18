import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Bell, History } from 'lucide-react';
import { IntroScreen } from '@/components/IntroScreen';
import { HackerClock } from '@/components/HackerClock';
import { MiniCalendar } from '@/components/MiniCalendar';
import { RemindersList } from '@/components/RemindersList';
import { ChatInterface } from '@/components/ChatInterface';
import { ModeSwitcher, ModeIndicator } from '@/components/ModeSwitcher';
import { Navigation } from '@/components/Navigation';
import { SettingsPage } from '@/components/SettingsPage';
import { AddReminderModal } from '@/components/AddReminderModal';
import { NotesPage } from '@/components/NotesPage';
import { CTFEventsWidget } from '@/components/CTFEventsWidget';
import { ChatHistorySidebar } from '@/components/ChatHistorySidebar';
import { useAppState } from '@/hooks/useAppState';
import { aiRouter } from '@/services/ai-router';
import { notificationService } from '@/services/notifications';
import { Attachment } from '@/types';
import { toast } from 'sonner';

type Tab = 'home' | 'chat' | 'calendar' | 'notes' | 'settings';

const Index = () => {
  const {
    mode,
    toggleMode,
    messages,
    addMessage,
    updateLastMessage,
    chatSessions,
    currentSessionId,
    createNewSession,
    selectSession,
    deleteSession,
    clearAllSessions,
    reminders,
    addReminder,
    toggleReminder,
    deleteReminder,
    events,
    notes,
    addNote,
    deleteNote,
    apiConfig,
    setApiConfig,
    appSettings,
    saveAppSettings,
    isLoading,
    hasSeenIntro,
    markIntroSeen,
  } = useAppState();

  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(false);

  useEffect(() => {
    if (activeTab === 'settings') {
      setShowSettings(true);
    }
  }, [activeTab]);

  // Check notification permission
  useEffect(() => {
    const checkPermission = async () => {
      const granted = await notificationService.requestPermission();
      setNotificationPermission(granted);
    };
    checkPermission();
  }, []);

  const handleSendMessage = async (content: string, attachments?: Attachment[]) => {
    // Add user message
    await addMessage({
      role: 'user',
      content,
      mode,
      attachments,
    });

    // Create placeholder for assistant message
    await addMessage({
      role: 'assistant',
      content: '',
      mode,
    });

    // Stream AI response
    let assistantContent = '';
    
    try {
      await aiRouter.streamResponse(
        content,
        messages,
        (chunk) => {
          assistantContent += chunk;
          updateLastMessage(assistantContent);
        },
        appSettings.responseLength
      );
    } catch (error) {
      console.error('Failed to get AI response:', error);
      toast.error('Failed to get AI response');
      updateLastMessage('Sorry, I encountered an error. Please try again.');
    }
  };

  const handleRequestNotificationPermission = async () => {
    const granted = await notificationService.requestPermission();
    setNotificationPermission(granted);
    if (granted) {
      toast.success('Notifications enabled for MR!JK!');
    } else {
      toast.error('Notification permission denied');
    }
  };

  const handleNewChat = async () => {
    await createNewSession();
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
          <header className="fixed top-0 left-0 right-0 glass border-b border-border z-40 safe-area-pt">
            <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
              <div className="flex items-center gap-2">
                <ModeIndicator mode={mode} />
                {activeTab === 'chat' && (
                  <button
                    onClick={() => setShowChatHistory(true)}
                    className="p-1.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    title="Chat history"
                  >
                    <History className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
                {!notificationPermission && (
                  <button
                    onClick={handleRequestNotificationPermission}
                    className="p-1.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    title="Enable notifications"
                  >
                    <Bell className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
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
                  transition={{ duration: 0.2 }}
                  className="p-4 max-w-lg mx-auto space-y-4"
                >
                  <HackerClock />
                  
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-mono font-medium text-primary">// REMINDERS</h2>
                      <button
                        onClick={() => setShowAddReminder(true)}
                        className="p-2 bg-primary/20 hover:bg-primary/30 rounded-lg transition-colors hover:scale-105 active:scale-95"
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

                  {/* CTF Events Widget */}
                  <CTFEventsWidget onAddReminder={addReminder} />

                  {/* Status card */}
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm text-muted-foreground">// SYSTEM_STATUS</p>
                        <p className="text-sm font-mono">
                          <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2 animate-pulse" />
                          AI: CONNECTED | VOICE: READY
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xs text-muted-foreground">
                          {notificationPermission ? '🔔 ALERTS: ON' : '🔕 ALERTS: OFF'}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'chat' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="h-[calc(100vh-7.5rem)]"
                >
                  <ChatInterface
                    mode={mode}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    voiceSettings={appSettings.voiceSettings}
                    onNewChat={handleNewChat}
                  />
                </motion.div>
              )}

              {activeTab === 'calendar' && (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 max-w-lg mx-auto space-y-4"
                >
                  <MiniCalendar events={events} />
                  
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-mono font-medium text-primary">// ALL_REMINDERS</h2>
                      <button
                        onClick={() => setShowAddReminder(true)}
                        className="p-2 bg-primary/20 hover:bg-primary/30 rounded-lg transition-colors hover:scale-105 active:scale-95"
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

              {activeTab === 'notes' && (
                <NotesPage
                  notes={notes}
                  onAddNote={addNote}
                  onDeleteNote={deleteNote}
                />
              )}
            </AnimatePresence>
          </main>

          {/* Navigation */}
          <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Chat History Sidebar */}
          <ChatHistorySidebar
            sessions={chatSessions}
            currentSessionId={currentSessionId}
            isOpen={showChatHistory}
            onClose={() => setShowChatHistory(false)}
            onSelectSession={selectSession}
            onNewChat={handleNewChat}
            onDeleteSession={deleteSession}
            onClearAll={clearAllSessions}
          />

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
                appSettings={appSettings}
                onSaveApiConfig={setApiConfig}
                onSaveAppSettings={saveAppSettings}
                onClearChatHistory={clearAllSessions}
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
