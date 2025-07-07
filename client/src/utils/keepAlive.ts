// Keep server alive utility
export class KeepAlive {
  private intervalId: number | null = null;
  private isActive = false;

  start(intervalMinutes = 5) {
    if (this.isActive) return;
    
    this.isActive = true;
    console.log(`Starting keep-alive ping every ${intervalMinutes} minutes`);
    
    // Ping immediately
    this.ping();
    
    // Set up interval
    this.intervalId = window.setInterval(() => {
      this.ping();
    }, intervalMinutes * 60 * 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isActive = false;
    console.log('Keep-alive stopped');
  }

  private async ping() {
    try {
      const response = await fetch('/api/ping', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        console.log('Keep-alive ping successful');
      } else {
        console.warn('Keep-alive ping failed:', response.status);
      }
    } catch (error) {
      console.warn('Keep-alive ping error:', error);
    }
  }
}

export const keepAlive = new KeepAlive();