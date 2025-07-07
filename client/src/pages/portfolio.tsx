import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Play, Camera, ZoomIn, X, ChevronLeft, ChevronRight } from "lucide-react";
import { ProgressiveImage } from "@/components/ProgressiveImage";
import type { PortfolioItem } from "@shared/schema";

// Utility function to extract YouTube video ID and create thumbnail
function getYouTubeThumbnail(url: string): string | null {
  if (!url) return null;

  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[7].length == 11) ? match[7] : null;

  return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
}

// Utility function to convert YouTube URL to embed format
function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;

  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[7].length == 11) ? match[7] : null;

  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

export default function Portfolio() {
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<PortfolioItem | null>(null);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>("");

  const { data: portfolioItems = [], isLoading } = useQuery<PortfolioItem[]>({
    queryKey: ['/api/portfolio'],
  });

  const openPhotoGallery = (item: PortfolioItem) => {
    setSelectedPortfolioItem(item);
    openImageViewer(0);
  };

  const openVideoOnly = (item: PortfolioItem) => {
    if (item.videoUrl) {
      openVideoModal(item.videoUrl);
    }
  };

  // Smart portfolio item opener - always open directly without modal
  const handlePortfolioItemClick = (item: PortfolioItem) => {
    const hasPhotos = item.photos && item.photos.length > 0;
    const hasVideo = Boolean(item.videoUrl);
    
    if (hasPhotos && !hasVideo) {
      // Only photos - open photo gallery directly
      openPhotoGallery(item);
    } else if (!hasPhotos && hasVideo) {
      // Only video - open video directly
      openVideoOnly(item);
    } else if (hasPhotos && hasVideo) {
      // Both exist - default to photos first (or you can change to video)
      openPhotoGallery(item);
    }
  };

  const openImageViewer = (imageIndex: number) => {
    setSelectedImageIndex(imageIndex);
    setIsImageViewerOpen(true);
  };

  const closeImageViewer = () => {
    setIsImageViewerOpen(false);
    setSelectedImageIndex(null);
  };

  const openVideoModal = (videoUrl: string) => {
    setSelectedVideoUrl(videoUrl);
    setIsVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    setIsVideoModalOpen(false);
    setSelectedVideoUrl("");
  };

  const nextImage = () => {
    if (selectedPortfolioItem?.photos && selectedImageIndex !== null) {
      const nextIndex = (selectedImageIndex + 1) % selectedPortfolioItem.photos.length;
      setSelectedImageIndex(nextIndex);
    }
  };

  const prevImage = () => {
    if (selectedPortfolioItem?.photos && selectedImageIndex !== null) {
      const prevIndex = selectedImageIndex === 0 ? selectedPortfolioItem.photos.length - 1 : selectedImageIndex - 1;
      setSelectedImageIndex(prevIndex);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (isImageViewerOpen) {
        if (event.key === 'ArrowRight') nextImage();
        if (event.key === 'ArrowLeft') prevImage();
        if (event.key === 'Escape') closeImageViewer();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isImageViewerOpen, selectedImageIndex]);

  // Display all portfolio items without filtering

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-wedding-cream">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-wedding-gray">Завантаження портфоліо...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-wedding-cream to-white">
      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-sm border-b border-green-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 md:space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Головна</span>
                </Button>
              </Link>
              <div>
                <h1 className="text-lg md:text-2xl lg:text-3xl font-display font-bold text-wedding-charcoal">
                  Наше <span className="text-green-600">портфоліо</span>
                </h1>
                <p className="text-xs md:text-sm text-wedding-gray mt-1">Приклади наших робіт</p>
              </div>
            </div>
            <div className="flex-1"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        

        {/* Portfolio Grid */}
        {portfolioItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-wedding-gray text-lg">Немає робіт для відображення</p>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-10">
            {portfolioItems.map((item) => (
              <div key={item.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-8 border border-gray-100">
                {/* Category Header */}
                <div className="text-center mb-6 md:mb-8">
                  <h2 className="text-xl md:text-3xl font-display font-bold text-wedding-charcoal mb-2">
                    {item.categoryName}
                  </h2>
                  <div className="w-20 h-1 bg-gradient-to-r from-green-400 to-blue-400 mx-auto rounded-full"></div>
                </div>

                {/* Mobile Layout - Vertical Stack */}
                <div className="md:hidden space-y-6">
                  {/* Photos Section - Mobile */}
                  {item.photos && item.photos.length > 0 && (
                    <div className="bg-white rounded-xl p-4 shadow-md border border-green-100">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-green-700 flex items-center text-lg">
                          <Camera className="w-6 h-6 mr-2" />
                          Фотографії
                        </h3>
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                          {item.photos.length} фото
                        </span>
                      </div>
                      <Card 
                        className="bg-gradient-to-br from-green-50 to-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border border-green-200"
                        onClick={() => openPhotoGallery(item)}
                      >
                        <div className="relative group overflow-hidden">
                          <div className="w-full">
                            <img
                              src={item.photoThumbnail || (item.photos[0] || '')}
                              alt={`${item.categoryName} - фото превью`}
                              className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                            <Camera className="text-white text-4xl drop-shadow-lg group-hover:scale-125 transition-transform duration-300" />
                          </div>

                        </div>
                      </Card>
                    </div>
                  )}

                  {/* Video Section - Mobile */}
                  {item.videoUrl && (
                    <div className="bg-white rounded-xl p-4 shadow-md border border-blue-100">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-blue-700 flex items-center text-lg">
                          <Play className="w-6 h-6 mr-2" />
                          Відеоролик
                        </h3>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                          HD відео
                        </span>
                      </div>
                      <Card 
                        className="bg-gradient-to-br from-blue-50 to-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border border-blue-200"
                        onClick={() => openVideoOnly(item)}
                      >
                        <div className="relative group overflow-hidden">
                          <div className="w-full">
                            <img
                              src={item.videoThumbnail || getYouTubeThumbnail(item.videoUrl || '') || ''}
                              alt={`${item.categoryName} - відео превью`}
                              className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                            <Play className="text-white text-4xl drop-shadow-lg group-hover:scale-125 transition-transform duration-300" />
                          </div>

                        </div>
                      </Card>
                    </div>
                  )}
                </div>

                {/* Desktop Layout - Side by Side */}
                <div className="hidden md:grid md:grid-cols-2 md:gap-8">
                  {/* Photos Section - Desktop */}
                  {item.photos && item.photos.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-green-700 flex items-center text-xl">
                          <Camera className="w-7 h-7 mr-3" />
                          Фотографії
                        </h3>
                        <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                          {item.photos.length} фото
                        </span>
                      </div>
                      <Card 
                        className="bg-gradient-to-br from-green-50 to-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-green-200 group"
                        onClick={() => openPhotoGallery(item)}
                      >
                        <div className="relative overflow-hidden">
                          <div className="w-full">
                            <img
                              src={item.photoThumbnail || (item.photos[0] || '')}
                              alt={`${item.categoryName} - фото превью`}
                              className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                            <Camera className="text-white text-5xl drop-shadow-lg group-hover:scale-125 transition-transform duration-300" />
                          </div>

                        </div>
                      </Card>
                    </div>
                  )}

                  {/* Video Section - Desktop */}
                  {item.videoUrl && (
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-blue-700 flex items-center text-xl">
                          <Play className="w-7 h-7 mr-3" />
                          Відеоролик
                        </h3>
                        <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                          HD відео
                        </span>
                      </div>
                      <Card 
                        className="bg-gradient-to-br from-blue-50 to-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-blue-200 group"
                        onClick={() => openVideoOnly(item)}
                      >
                        <div className="relative overflow-hidden">
                          <div className="w-full">
                            <img
                              src={item.videoThumbnail || getYouTubeThumbnail(item.videoUrl || '') || ''}
                              alt={`${item.categoryName} - відео превью`}
                              className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                            <Play className="text-white text-5xl drop-shadow-lg group-hover:scale-125 transition-transform duration-300" />
                          </div>

                        </div>
                      </Card>
                    </div>
                  )}
                </div>

                {/* Show message if neither photo nor video available */}
                {(!item.photos || item.photos.length === 0) && !item.videoUrl && (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <Camera className="text-gray-400 text-5xl mb-4 mx-auto" />
                    <p className="text-gray-500 text-lg font-medium">Контент ще не додано</p>
                    <p className="text-gray-400 text-sm mt-2">Незабаром тут з'явиться портфоліо</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>



      {/* Image Viewer Modal */}
      <Dialog open={isImageViewerOpen} onOpenChange={closeImageViewer}>
        <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full bg-black border-none p-0 m-0 rounded-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Перегляд фотографії</DialogTitle>
            <DialogDescription>Повноекранний перегляд фотографії з портфоліо</DialogDescription>
          </DialogHeader>
          <div className="relative w-full h-full flex items-center justify-center">
            {selectedPortfolioItem?.photos && selectedImageIndex !== null && (
              <>
                {/* Close button - single white X */}
                <button
                  onClick={closeImageViewer}
                  className="absolute top-4 right-4 z-50 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
                >
                  <X size={28} />
                </button>

                {/* Navigation buttons */}
                {selectedPortfolioItem.photos.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 z-40 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2 md:p-3"
                    >
                      <ChevronLeft size={24} className="md:w-8 md:h-8" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 z-40 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2 md:p-3"
                    >
                      <ChevronRight size={24} className="md:w-8 md:h-8" />
                    </button>
                  </>
                )}

                {/* Main image - mobile fills screen, desktop constrained */}
                <div className="w-full h-full flex items-center justify-center p-0 md:p-8">
                  <img
                    src={selectedPortfolioItem.photos[selectedImageIndex]}
                    alt={`${selectedPortfolioItem.categoryName} - фото ${selectedImageIndex + 1}`}
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                    style={{ 
                      maxWidth: '100vw', 
                      maxHeight: '100vh',
                      width: 'auto',
                      height: 'auto'
                    }}
                    onLoad={(e) => {
                      // Desktop-specific constraint to prevent overflow
                      const img = e.target as HTMLImageElement;
                      if (window.innerWidth >= 768) {
                        const maxWidth = window.innerWidth - 128; // 8rem padding * 2
                        const maxHeight = window.innerHeight - 128;
                        img.style.maxWidth = `${maxWidth}px`;
                        img.style.maxHeight = `${maxHeight}px`;
                      }
                    }}
                  />
                </div>

                {/* Image counter */}
                {selectedPortfolioItem.photos.length > 1 && (
                  <div className="absolute bottom-2 md:bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black/70 rounded-full px-3 py-1 md:px-4 md:py-2 text-sm">
                    {selectedImageIndex + 1} / {selectedPortfolioItem.photos.length}
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={closeVideoModal}>
        <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full bg-black border-none p-0 m-0 rounded-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Перегляд відео</DialogTitle>
            <DialogDescription>Повноекранний перегляд відео з портфоліо</DialogDescription>
          </DialogHeader>
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={closeVideoModal}
              className="absolute top-4 right-4 z-50 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
            >
              <X size={28} />
            </button>

            {/* YouTube Embed - full viewport without borders */}
            {selectedVideoUrl && (
              <div 
                className="relative bg-black w-full" 
                style={{ 
                  height: 'min(56.25vw, 90vh)',
                  maxHeight: '90vh'
                }}
              >
                <iframe
                  src={`${getYouTubeEmbedUrl(selectedVideoUrl) || ''}?enablejsapi=1&playsinline=1&modestbranding=1&rel=0&fs=1&autoplay=0`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  allowFullScreen={true}
                  className="absolute top-0 left-0 w-full h-full"
                  style={{ border: 'none' }}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}