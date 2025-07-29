import React, { useState } from 'react';
import { Key, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ApiKeySetupProps {
  onApiKeySet: (apiKey: string) => void;
}

export const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError('Please enter your Gemini API key');
      return;
    }

    // Basic validation for API key format
    if (!apiKey.startsWith('AIza') && !apiKey.includes('dummy')) {
      setError('Invalid API key format. Gemini API keys typically start with "AIza"');
      return;
    }

    // Store in localStorage for persistence
    localStorage.setItem('gemini_api_key', apiKey);
    onApiKeySet(apiKey);
  };

  const useDummyKey = () => {
    const dummyKey = 'dummy-key-for-demo';
    setApiKey(dummyKey);
    localStorage.setItem('gemini_api_key', dummyKey);
    onApiKeySet(dummyKey);
  };

  return (
    <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 shadow-glow animate-float">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">VentureMind</h1>
          <p className="text-muted-foreground">AI-Powered Pitch Deck Analysis</p>
        </div>

        <Card className="bg-glass-bg border-glass-border backdrop-blur-sm shadow-elevation">
          <CardHeader>
            <CardTitle className="text-center">Setup Gemini API</CardTitle>
            <CardDescription className="text-center">
              Enter your Gemini API key to start analyzing pitch decks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your Gemini API key..."
                  className="pr-10 bg-glass-bg border-glass-border"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <Alert className="bg-destructive/20 border-destructive/30">
                  <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
              >
                Start Analyzing
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-glass-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button 
              onClick={useDummyKey}
              variant="outline" 
              className="w-full border-glass-border bg-glass-bg hover:bg-muted/20"
            >
              Use Demo Mode (Dummy API)
            </Button>

            <div className="space-y-3 pt-4 border-t border-glass-border">
              <h3 className="text-sm font-medium text-foreground">How to get your API key:</h3>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Visit Google AI Studio</li>
                <li>Sign in with your Google account</li>
                <li>Generate a new API key</li>
                <li>Copy and paste it above</li>
              </ol>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-center gap-2 text-primary hover:text-primary"
                onClick={() => window.open('https://makersuite.google.com/app/apikey', '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
                Get Gemini API Key
              </Button>
            </div>

            <Alert className="bg-warning/20 border-warning/30">
              <AlertDescription className="text-warning text-xs">
                Your API key is stored locally in your browser and never sent to our servers.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};