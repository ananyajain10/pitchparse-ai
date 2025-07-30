import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry';
import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';

// Configuration constants
const PDF_CONFIG = {
  // Use compatible versions - PDF.js 3.11.174 with matching worker
  WORKER_URL: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_PAGES: 1000,
  TIMEOUT: 30000, // 30 seconds
  EXTRACTION_OPTIONS: {
    normalizeWhitespace: true,
    disableCombineTextItems: false,
  }
} as const;

// Error types for better error handling
export class PDFExtractionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'PDFExtractionError';
  }
}

export interface ExtractionOptions {
  maxPages?: number;
  includeMetadata?: boolean;
  normalizeWhitespace?: boolean;
  pageDelimiter?: string;
  timeout?: number;
}

export interface ExtractionResult {
  text: string;
  pageCount: number;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
  processingTime: number;
}

export class ProductionPDFProcessor {
  private static isInitialized = false;
  private static initPromise: Promise<void> | null = null;

  /**
   * Initialize PDF.js with proper worker configuration
   */
  private static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        // Set worker source with version compatibility
       
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

        // Verify worker is loaded
        await this.verifyWorkerCompatibility();
        
        this.isInitialized = true;
        console.log('PDF.js initialized successfully');
      } catch (error) {
        this.initPromise = null;
        throw new PDFExtractionError(
          'Failed to initialize PDF.js',
          'INIT_FAILED',
          error as Error
        );
      }
    })();

    return this.initPromise;
  }

  /**
   * Verify worker compatibility by loading a minimal PDF
   */
  private static async verifyWorkerCompatibility(): Promise<void> {
    try {
      // Create a minimal PDF buffer for testing
      const testPdf = new Uint8Array([
        0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3
      ]);
      
      const loadingTask = pdfjsLib.getDocument(testPdf);
      const pdf = await Promise.race([
        loadingTask.promise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Worker verification timeout')), 5000)
        )
      ]) as any;
      
      if (pdf) {
        pdf.destroy();
      }
    } catch (error) {
      throw new Error(`Worker compatibility check failed: ${error}`);
    }
  }

  /**
   * Validate file before processing
   */
  private static validateFile(file: File): void {
    if (!file) {
      throw new PDFExtractionError('No file provided', 'INVALID_FILE');
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new PDFExtractionError(
        'File must be a PDF document',
        'INVALID_FILE_TYPE'
      );
    }

    if (file.size > PDF_CONFIG.MAX_FILE_SIZE) {
      throw new PDFExtractionError(
        `File size exceeds maximum limit of ${PDF_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`,
        'FILE_TOO_LARGE'
      );
    }

    if (file.size === 0) {
      throw new PDFExtractionError('File is empty', 'EMPTY_FILE');
    }
  }

  /**
   * Extract text from a single page with error handling
   */
  private static async extractPageText(
    pdf: any,
    pageNum: number,
    options: ExtractionOptions
  ): Promise<string> {
    try {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent(PDF_CONFIG.EXTRACTION_OPTIONS);
      
      let pageText = textContent.items
        .filter((item: TextItem | TextMarkedContent): item is TextItem => 
          'str' in item && typeof item.str === 'string'
        )
        .map((item: TextItem) => item.str)
        .join(' ');

      if (options.normalizeWhitespace !== false) {
        pageText = pageText.replace(/\s+/g, ' ').trim();
      }

      // Clean up page resources
      page.cleanup();
      
      return pageText;
    } catch (error) {
      console.warn(`Failed to extract text from page ${pageNum}:`, error);
      return `[Error extracting page ${pageNum}]`;
    }
  }

  /**
   * Extract metadata from PDF document
   */
  private static async extractMetadata(pdf: any): Promise<ExtractionResult['metadata']> {
    try {
      const metadata = await pdf.getMetadata();
      const info = metadata.info;
      
      return {
        title: info.Title || undefined,
        author: info.Author || undefined,
        subject: info.Subject || undefined,
        creator: info.Creator || undefined,
        producer: info.Producer || undefined,
        creationDate: info.CreationDate ? new Date(info.CreationDate) : undefined,
        modificationDate: info.ModDate ? new Date(info.ModDate) : undefined,
      };
    } catch (error) {
      console.warn('Failed to extract PDF metadata:', error);
      return undefined;
    }
  }

  /**
   * Main method to extract text from PDF with comprehensive error handling
   */
  public static async extractTextFromPDF(
    file: File,
    options: ExtractionOptions = {}
  ): Promise<ExtractionResult> {
    const startTime = Date.now();
    
    try {
      // Initialize PDF.js
      await this.initialize();
      
      // Validate input
      this.validateFile(file);
      
      // Set up options with defaults
      const extractionOptions: Required<ExtractionOptions> = {
        maxPages: options.maxPages ?? PDF_CONFIG.MAX_PAGES,
        includeMetadata: options.includeMetadata ?? false,
        normalizeWhitespace: options.normalizeWhitespace ?? true,
        pageDelimiter: options.pageDelimiter ?? '\n\n',
        timeout: options.timeout ?? PDF_CONFIG.TIMEOUT,
      };

      // Convert file to array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF document with timeout
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0, // Reduce console output in production
      });

      const pdf = await Promise.race([
        loadingTask.promise,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new PDFExtractionError('PDF loading timeout', 'LOAD_TIMEOUT')),
            extractionOptions.timeout
          )
        ),
      ]) as any;

      try {
        const pageCount = pdf.numPages;
        
        if (pageCount === 0) {
          throw new PDFExtractionError('PDF contains no pages', 'NO_PAGES');
        }

        if (pageCount > extractionOptions.maxPages) {
          console.warn(`PDF has ${pageCount} pages, limiting to ${extractionOptions.maxPages}`);
        }

        const pagesToProcess = Math.min(pageCount, extractionOptions.maxPages);
        const pageTexts: string[] = [];

        // Extract text from each page with concurrent processing (limited)
        const concurrencyLimit = 3;
        for (let i = 0; i < pagesToProcess; i += concurrencyLimit) {
          const batch = [];
          for (let j = i; j < Math.min(i + concurrencyLimit, pagesToProcess); j++) {
            batch.push(this.extractPageText(pdf, j + 1, extractionOptions));
          }
          
          const batchResults = await Promise.allSettled(batch);
          batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              pageTexts[i + index] = result.value;
            } else {
              console.error(`Page ${i + index + 1} extraction failed:`, result.reason);
              pageTexts[i + index] = `[Error extracting page ${i + index + 1}]`;
            }
          });
        }

        // Combine page texts
        const fullText = pageTexts.join(extractionOptions.pageDelimiter);
        
        // Extract metadata if requested
        let metadata: ExtractionResult['metadata'];
        if (extractionOptions.includeMetadata) {
          metadata = await this.extractMetadata(pdf);
        }

        const processingTime = Date.now() - startTime;

        return {
          text: fullText,
          pageCount,
          metadata,
          processingTime,
        };

      } finally {
        // Clean up PDF document
        pdf.destroy();
      }

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      if (error instanceof PDFExtractionError) {
        throw error;
      }

      // Handle specific PDF.js errors
      if (error && typeof error === 'object' && 'name' in error) {
        switch (error.name) {
          case 'InvalidPDFException':
            throw new PDFExtractionError(
              'Invalid or corrupted PDF file',
              'INVALID_PDF',
              error as Error
            );
          case 'MissingPDFException':
            throw new PDFExtractionError(
              'PDF file not found or empty',
              'MISSING_PDF',
              error as Error
            );
          case 'PasswordException':
            throw new PDFExtractionError(
              'PDF is password protected',
              'PASSWORD_PROTECTED',
              error as Error
            );
          default:
            throw new PDFExtractionError(
              `PDF processing failed: ${error.message || 'Unknown error'}`,
              'PROCESSING_FAILED',
              error as Error
            );
        }
      }

      throw new PDFExtractionError(
        'Unexpected error during PDF processing',
        'UNKNOWN_ERROR',
        error as Error
      );
    }
  }

  /**
   * Utility method to extract text with basic error handling (simplified interface)
   */
  public static async extractText(file: File): Promise<string> {
    const result = await this.extractTextFromPDF(file, {
      includeMetadata: false,
      normalizeWhitespace: true,
    });
    return result.text;
  }

  /**
   * Check if the processor is ready to use
   */
  public static isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get processor status and configuration
   */
  public static getStatus() {
    return {
      initialized: this.isInitialized,
      workerUrl: PDF_CONFIG.WORKER_URL,
      maxFileSize: PDF_CONFIG.MAX_FILE_SIZE,
      maxPages: PDF_CONFIG.MAX_PAGES,
      timeout: PDF_CONFIG.TIMEOUT,
    };
  }
}

// Export for backward compatibility
export const FileProcessor = {
  extractTextFromPDF: ProductionPDFProcessor.extractText,
};

// Usage example:
/*
try {
  const result = await ProductionPDFProcessor.extractTextFromPDF(file, {
    maxPages: 100,
    includeMetadata: true,
    normalizeWhitespace: true,
    pageDelimiter: '\n---\n',
    timeout: 60000,
  });
  
  console.log('Text extracted:', result.text);
  console.log('Pages processed:', result.pageCount);
  console.log('Processing time:', result.processingTime, 'ms');
  if (result.metadata) {
    console.log('Title:', result.metadata.title);
    console.log('Author:', result.metadata.author);
  }
} catch (error) {
  if (error instanceof PDFExtractionError) {
    console.error('PDF extraction failed:', error.message, error.code);
  } else {
    console.error('Unexpected error:', error);
  }
}
*/

