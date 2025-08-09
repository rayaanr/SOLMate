// Debug utility for comprehensive logging

export class DebugLogger {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development' || process.env.DEBUG_ENABLED === 'true';
  }

  log(category: string, message: string, data?: any) {
    if (!this.isEnabled) return;
    
    const timestamp = new Date().toISOString();
    console.log(`\n🔍 [${timestamp}] ${category.toUpperCase()}`);
    console.log(`📝 ${message}`);
    
    if (data !== undefined) {
      console.log('📊 Data:', typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    }
    console.log('─'.repeat(80));
  }

  logOpenAI(direction: 'SEND' | 'RECEIVE', content: string, metadata?: any) {
    if (!this.isEnabled) return;
    
    const timestamp = new Date().toISOString();
    const emoji = direction === 'SEND' ? '🚀' : '📥';
    
    console.log(`\n${emoji} [${timestamp}] OPENAI_${direction}`);
    console.log(`📝 Content: ${content}`);
    
    if (metadata) {
      console.log('🔧 Metadata:', JSON.stringify(metadata, null, 2));
    }
    console.log('─'.repeat(80));
  }

  logError(category: string, error: any, context?: any) {
    const timestamp = new Date().toISOString();
    console.error(`\n❌ [${timestamp}] ERROR_${category.toUpperCase()}`);
    console.error(`📝 Message:`, error.message || error);
    
    if (context) {
      console.error('🔍 Context:', JSON.stringify(context, null, 2));
    }
    
    if (error.stack) {
      console.error('📍 Stack:', error.stack);
    }
    console.error('─'.repeat(80));
  }
}

// Global debug instance
export const debugLogger = new DebugLogger();
