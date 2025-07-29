import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Brain, TrendingUp, Target, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { analyzePitchDeckWithGemini } from '@/lib/geminiClient';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  analysis?: PitchAnalysis;
}

interface PitchAnalysis {
  founderAnalysis: {
    names: string[];
    background: string;
    credibility: number;
    assessment: string;
  };
  marketSize: {
    tam: string;
    sam: string;
    som: string;
    growth: string;
    assessment: string;
  };
  aiVertical: {
    connection: string;
    strength: number;
    opportunities: string[];
    assessment: string;
  };
  vcAnalysis: {
    pros: string[];
    cons: string[];
    rating: number;
    recommendation: string;
    fundingStage: string;
    suggestedAmount: string;
  };
}

interface ChatInterfaceProps {
  apiKey: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ apiKey }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Welcome to VentureMind! I\'m your AI pitch deck analyzer. Please paste your pitch deck content, and I\'ll provide a comprehensive VC-style analysis covering founder background, market sizing, AI vertical connections, and investment recommendations.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const analyzePitchDeck = async (content: string): Promise<PitchAnalysis> => {
    return await analyzePitchDeckWithGemini(apiKey, content);
  };

   const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

  try {
      const analysis = await analyzePitchDeck(input);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Here\'s your comprehensive pitch deck analysis:',
        timestamp: new Date(),
        analysis
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '❌ Error analyzing the pitch deck. Please check your input or API key and try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };


    
  const AnalysisCard: React.FC<{ analysis: PitchAnalysis }> = ({ analysis }) => (
    <div className="space-y-6 mt-4">
      {/* Founder Analysis */}
      <Card className="p-6 bg-gradient-card border-glass-border backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/20">
            <User className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Founder Analysis</h3>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Team</p>
            <p className="text-foreground">{analysis.founderAnalysis.names.join(', ')}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Background</p>
            <p className="text-foreground">{analysis.founderAnalysis.background}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">Credibility Score:</p>
            <span className="text-primary font-bold">{analysis.founderAnalysis.credibility}/10</span>
          </div>
          <p className="text-sm text-muted-foreground italic">{analysis.founderAnalysis.assessment}</p>
        </div>
      </Card>

      {/* Market Analysis */}
      <Card className="p-6 bg-gradient-card border-glass-border backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-success/20">
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <h3 className="text-lg font-semibold">Market Analysis</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">TAM</p>
            <p className="text-lg font-bold text-primary">{analysis.marketSize.tam}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">SAM</p>
            <p className="text-lg font-bold text-primary">{analysis.marketSize.sam}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">SOM</p>
            <p className="text-lg font-bold text-primary">{analysis.marketSize.som}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Growth</p>
            <p className="text-lg font-bold text-success">{analysis.marketSize.growth}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground italic">{analysis.marketSize.assessment}</p>
      </Card>

      {/* AI Vertical */}
      <Card className="p-6 bg-gradient-card border-glass-border backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-accent/20">
            <Brain className="w-5 h-5 text-accent" />
          </div>
          <h3 className="text-lg font-semibold">AI Vertical Connection</h3>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Connection</p>
            <p className="text-foreground">{analysis.aiVertical.connection}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">Strength:</p>
            <span className="text-accent font-bold">{analysis.aiVertical.strength}/10</span>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Opportunities</p>
            <div className="flex flex-wrap gap-2">
              {analysis.aiVertical.opportunities.map((opp, index) => (
                <span key={index} className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm">
                  {opp}
                </span>
              ))}
            </div>
          </div>
          <p className="text-sm text-muted-foreground italic">{analysis.aiVertical.assessment}</p>
        </div>
      </Card>

      {/* VC Analysis */}
      <Card className="p-6 bg-gradient-card border-glass-border backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-warning/20">
            <DollarSign className="w-5 h-5 text-warning" />
          </div>
          <h3 className="text-lg font-semibold">VC Investment Analysis</h3>
        </div>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Pros</p>
              <ul className="space-y-1">
                {analysis.vcAnalysis.pros.map((pro, index) => (
                  <li key={index} className="text-sm text-success flex items-center gap-2">
                    <Target className="w-3 h-3" />
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Cons</p>
              <ul className="space-y-1">
                {analysis.vcAnalysis.cons.map((con, index) => (
                  <li key={index} className="text-sm text-destructive flex items-center gap-2">
                    <Target className="w-3 h-3" />
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Investment Rating</p>
              <p className="text-2xl font-bold text-primary">{analysis.vcAnalysis.rating}/10</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{analysis.vcAnalysis.fundingStage}</p>
              <p className="text-lg font-semibold text-warning">{analysis.vcAnalysis.suggestedAmount}</p>
            </div>
          </div>
          
          <div className="p-4 bg-accent/10 rounded-lg">
            <p className="font-semibold text-accent mb-2">Recommendation</p>
            <p className="text-foreground">{analysis.vcAnalysis.recommendation}</p>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-4 animate-slide-up",
              message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              message.type === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-accent text-accent-foreground'
            )}>
              {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            
            <div className={cn(
              "max-w-[80%] rounded-2xl px-4 py-3",
              message.type === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            )}>
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.analysis && <AnalysisCard analysis={message.analysis} />}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-muted rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-typing"></div>
                <div className="w-2 h-2 bg-accent rounded-full animate-typing" style={{ animationDelay: '0.3s' }}></div>
                <div className="w-2 h-2 bg-accent rounded-full animate-typing" style={{ animationDelay: '0.6s' }}></div>
                <span className="text-sm text-muted-foreground ml-2">Analyzing pitch deck...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-glass-border">
        <div className="flex gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your pitch deck content here for comprehensive VC analysis..."
            className="min-h-[80px] resize-none bg-glass-bg border-glass-border backdrop-blur-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="self-end bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
