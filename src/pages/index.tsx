import React, { useState, useEffect } from 'react';
import { ApiKeySetup } from '@/components/ApiKeySetup';
import { ChatInterface } from '@/components/ChatInterface';
import { FloatingElements } from '@/components/FloatingElements';
import { Brain, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const Index = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Check for stored API key
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleApiKeySet = (key: string) => {
    setApiKey(key);
    setShowSettings(false);
  };

  const clearApiKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setShowSettings(false);
  };

  if (!apiKey) {
    return (
      <>
        <FloatingElements />
        <ApiKeySetup onApiKeySet={handleApiKeySet} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg relative">
      <FloatingElements />
      
      {/* Header */}
      <header className="border-b border-glass-border bg-glass-bg backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-xl shadow-glow">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">VentureMind</h1>
                <p className="text-sm text-muted-foreground">AI Pitch Deck Analyzer</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 right-6 z-50">
          <Card className="w-80 p-4 bg-glass-bg border-glass-border backdrop-blur-sm shadow-elevation">
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Settings</h3>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">API Key Status:</p>
                <p className="text-sm text-success">
                  {apiKey.includes('dummy') ? 'Demo Mode Active' : 'Connected'}
                </p>
              </div>
              <Button
                onClick={clearApiKey}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                Change API Key
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Main Chat Interface */}
      <main className="container mx-auto h-[calc(100vh-80px)] flex flex-col">
        <ChatInterface apiKey={apiKey} />
      </main>
    </div>
  );
};

export default Index;
