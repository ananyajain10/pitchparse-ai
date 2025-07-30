import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Brain, TrendingUp, Target, DollarSign, Upload, FileText, Image, File, X, Loader2, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { analyzePitchDeckWithGemini } from '@/lib/geminiClient';


// File processing utilities
class FileProcessor {
   
  

  static async extractTextFromDoc(file: File): Promise<string> {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  static async extractTextFromImage(file: File): Promise<string> {
    const Tesseract = await import('tesseract.js');
    const { data: { text } } = await Tesseract.recognize(file, 'eng', {
      logger: m => console.log(m)
    });
    return text;
  }

  static async processFile(file: File): Promise<string> {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    if (fileType === 'application/pdf') {
      // Updated to get PDF text from API
      const formData = new FormData();
      formData.append('file', file);
      const BASE_URL = import.meta.env.VITE_API_URL
      const res = await fetch(`${BASE_URL}/extract-pdf-text`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extract text from PDF');
      return data.text;
    } else if (fileType.includes('image/')) {
      return await this.extractTextFromImage(file);
    } else if (
      fileType.includes('document') || 
      fileType.includes('msword') || 
      fileName.endsWith('.docx') || 
      fileName.endsWith('.doc')
    ) {
      return await this.extractTextFromDoc(file);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  static getSupportedFileTypes(): string {
    return '.pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.bmp,.tiff';
  }

  static getFileIcon(fileType: string) {
    if (fileType.includes('pdf')) return FileText;
    if (fileType.includes('image')) return Image;
    if (fileType.includes('document') || fileType.includes('msword')) return File;
    return File;
  }
}

// File Upload Button Component
interface FileUploadButtonProps {
  onFileUpload: (files: FileList) => void;
  isProcessing: boolean;
  disabled?: boolean;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({ 
  onFileUpload, 
  isProcessing, 
  disabled 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFileUpload(files);
    }
    // Clear the input
    event.target.value = '';
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className="flex items-center gap-2 border-glass-border bg-glass-bg hover:bg-glass-bg/80"
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Paperclip className="w-4 h-4" />
        )}
        {isProcessing ? 'Processing...' : 'Upload File'}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept={FileProcessor.getSupportedFileTypes()}
        onChange={handleFileChange}
        multiple
        className="hidden"
      />
    </>
  );
};

// Uploaded File Display Component
interface UploadedFile {
  id: string;
  file: File;
  text: string;
  processing: boolean;
  error?: string;
}

interface FileDisplayProps {
  files: UploadedFile[];
  onRemove: (id: string) => void;
}

const FileDisplay: React.FC<FileDisplayProps> = ({ files, onRemove }) => {
  if (files.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      {files.map((uploadedFile) => {
        const IconComponent = FileProcessor.getFileIcon(uploadedFile.file.type);
        
        return (
          <div
            key={uploadedFile.id}
            className="flex items-center gap-3 p-3 bg-glass-bg border border-glass-border rounded-lg"
          >
            <div className="flex items-center gap-2 flex-1">
              {uploadedFile.processing ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              ) : (
                <IconComponent className="w-4 h-4 text-blue-500" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {uploadedFile.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(uploadedFile.file.size / 1024).toFixed(1)} KB
                  {uploadedFile.error && (
                    <span className="text-red-500 ml-2">• {uploadedFile.error}</span>
                  )}
                  {!uploadedFile.processing && !uploadedFile.error && uploadedFile.text && (
                    <span className="text-green-500 ml-2">• Text extracted</span>
                  )}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(uploadedFile.id)}
              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
};

// Input Area Component
interface InputAreaProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onFileUpload: (files: FileList) => void;
  isLoading: boolean;
  isProcessingFile: boolean;
  uploadedFiles: UploadedFile[];
  onRemoveFile: (id: string) => void;
}

const InputArea: React.FC<InputAreaProps> = ({
  input,
  onInputChange,
  onSend,
  onFileUpload,
  isLoading,
  isProcessingFile,
  uploadedFiles,
  onRemoveFile
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const canSend = (input.trim() || uploadedFiles.some(f => f.text && !f.error)) && !isLoading && !isProcessingFile;

  return (
    <div className="p-6 border-t border-glass-border">
      <FileDisplay files={uploadedFiles} onRemove={onRemoveFile} />
      
      <div className="flex gap-3">
        <div className="flex-1">
          <Textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Type your message or upload files (PDF, DOC, Images) for analysis..."
            className="min-h-[80px] resize-none bg-glass-bg border-glass-border backdrop-blur-sm"
            onKeyDown={handleKeyDown}
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <FileUploadButton
            onFileUpload={onFileUpload}
            isProcessing={isProcessingFile}
            disabled={isLoading}
          />
          
          <Button
            onClick={onSend}
            disabled={!canSend}
            className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main interfaces
interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  analysis?: PitchAnalysis;
  fileInfo?: Array<{ name: string; type: string; size: number }>;
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

// Main Chat Interface Component
export const ChatInterface: React.FC<ChatInterfaceProps> = ({ apiKey }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Welcome to VentureMind! I\'m your AI pitch deck analyzer. You can:\n\n📝 Type your pitch deck content directly\n📄 Upload PDF documents\n🖼️ Upload images (PNG, JPG, etc.)\n📋 Upload Word documents (DOC, DOCX)\n\nI\'ll extract the text and provide comprehensive VC-style analysis!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
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

  const handleFileUpload = async (files: FileList) => {
    setIsProcessingFile(true);
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(files)) {
      const fileId = `${Date.now()}-${Math.random()}`;
      const uploadedFile: UploadedFile = {
        id: fileId,
        file,
        text: '',
        processing: true
      };
      
      newFiles.push(uploadedFile);
      setUploadedFiles(prev => [...prev, uploadedFile]);

      try {
        const text = await FileProcessor.processFile(file);
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, text, processing: false }
              : f
          )
        );
      } catch (error) {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, processing: false, error: error instanceof Error ? error.message : 'Unknown error' }
              : f
          )
        );
      }
    }

    setIsProcessingFile(false);
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSend = async () => {
    const validFiles = uploadedFiles.filter(f => f.text && !f.error);
    
    if (!input.trim() && validFiles.length === 0) return;
    if (isLoading || isProcessingFile) return;

    let content = input.trim();
    const fileInfos: Array<{ name: string; type: string; size: number }> = [];

    // Combine text from uploaded files
    if (validFiles.length > 0) {
      const fileTexts = validFiles.map(f => {
        fileInfos.push({
          name: f.file.name,
          type: f.file.type,
          size: f.file.size
        });
        return `--- Content from ${f.file.name} ---\n${f.text}\n`;
      }).join('\n');
      
      content = content ? `${content}\n\n${fileTexts}` : fileTexts;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim() || 'Uploaded files for analysis',
      timestamp: new Date(),
      fileInfo: fileInfos
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setUploadedFiles([]);
    setIsLoading(true);

    try {
      const analysis = await analyzePitchDeck(content);

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
              {message.fileInfo && message.fileInfo.length > 0 && (
                <div className="mt-2 text-sm opacity-75">
                  📎 {message.fileInfo.length} file(s) uploaded
                </div>
              )}
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
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.6s' }}></div>
                <span className="text-sm text-muted-foreground ml-2">Analyzing pitch deck...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <InputArea
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        onFileUpload={handleFileUpload}
        isLoading={isLoading}
        isProcessingFile={isProcessingFile}
        uploadedFiles={uploadedFiles}
        onRemoveFile={handleRemoveFile}
      />
    </div>
  );
};