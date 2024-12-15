class VideoPlayer {
  constructor() {
    this.videoElement = document.getElementById('videoPlayer');
    this.currentChunk = 0;
    this.initializePlayer();
  }

  async initializePlayer() {
    this.videoElement.addEventListener('timeupdate', () => {
      // Handle chunk loading based on current time
      this.handleChunkLoading();
    });
  }

  async handleChunkLoading() {
    const currentTime = this.videoElement.currentTime;
    const chunkIndex = Math.floor(currentTime / 10);
    
    if (chunkIndex !== this.currentChunk) {
      this.currentChunk = chunkIndex;
      await this.loadChunk(chunkIndex);
    }
  }

  async loadChunk(index) {
    try {
      const response = await fetch(`/api/videos/chunk/video1/${index}`);
      const chunk = await response.json();
      // Handle chunk data
    } catch (error) {
      console.error('Error loading chunk:', error);
    }
  }
}

new VideoPlayer();
