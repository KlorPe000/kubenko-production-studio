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
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>("");

  const { data: portfolioItems = [], isLoading } = useQuery<PortfolioItem[]>({
    queryKey: ['/api/portfolio'],
  });

  const openPortfolioItem = (item: PortfolioItem) => {
    setSelectedPortfolioItem(item);
    setIsPortfolioModalOpen(true);
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
          <div className="space-y-8">
            {portfolioItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-lg p-6">
                {/* Category Header */}
                <h2 className="text-xl md:text-2xl font-display font-bold text-wedding-charcoal mb-6 text-center">
                  {item.categoryName}
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Photo Section */}
                  {item.photos && item.photos.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-wedding-charcoal mb-4 flex items-center">
                        <Camera className="w-5 h-5 mr-2 text-purple-600" />
                        Фото ({item.photos.length})
                      </h3>
                      <Card 
                        className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
                        onClick={() => openPortfolioItem(item)}
                      >
                        <div className="relative group overflow-hidden">
                          <div className="aspect-[4/3] w-full">
                            <img
                              src={item.photoThumbnail || (item.photos[0] || '')}
                              alt={`${item.categoryName} - фото превью`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                            <Camera className="text-white text-3xl md:text-4xl drop-shadow-lg group-hover:scale-125 transition-transform duration-300" />
                          </div>
                          <div className="absolute bottom-2 left-2 right-2">
                            <Button variant="secondary" size="sm" className="w-full text-xs bg-white/90 hover:bg-white">
                              Переглянути фото
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* Video Section */}
                  {item.videoUrl && (
                    <div>
                      <h3 className="font-semibold text-wedding-charcoal mb-4 flex items-center">
                        <Play className="w-5 h-5 mr-2 text-blue-600" />
                        Відео
                      </h3>
                      <Card 
                        className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
                        onClick={() => openPortfolioItem(item)}
                      >
                        <div className="relative group overflow-hidden">
                          <div className="aspect-[4/3] w-full">
                            <img
                              src={item.videoThumbnail || getYouTubeThumbnail(item.videoUrl || '') || ''}
                              alt={`${item.categoryName} - відео превью`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                            <Play className="text-white text-3xl md:text-4xl drop-shadow-lg group-hover:scale-125 transition-transform duration-300" />
                          </div>
                          <div className="absolute bottom-2 left-2 right-2">
                            <Button variant="secondary" size="sm" className="w-full text-xs bg-white/90 hover:bg-white">
                              Переглянути відео
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}
                </div>

                {/* Show message if neither photo nor video available */}
                {(!item.photos || item.photos.length === 0) && !item.videoUrl && (
                  <div className="text-center py-8">
                    <Camera className="text-gray-400 text-4xl mb-3 mx-auto" />
                    <p className="text-gray-500">Контент ще не додано</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Portfolio Modal */}
      <Dialog open={isPortfolioModalOpen} onOpenChange={setIsPortfolioModalOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] overflow-y-auto p-0">
          <DialogHeader className="p-4 md:p-6 pb-2 md:pb-4">
            <DialogTitle className="text-lg md:text-xl font-display font-semibold text-wedding-charcoal">
              {selectedPortfolioItem?.categoryName}
            </DialogTitle>
            <DialogDescription className="text-wedding-gray text-sm">
              Перегляд портфоліо
            </DialogDescription>
          </DialogHeader>
          
          {selectedPortfolioItem && (
            <div className="p-4 md:p-6 pt-0">
              {/* Video Section */}
              {selectedPortfolioItem.videoUrl && (
                <div className="mb-6">
                  <h4 className="font-semibold text-wedding-charcoal mb-3 flex items-center">
                    <Play className="w-4 h-4 mr-2 text-blue-600" />
                    Відео
                  </h4>
                  <Card 
                    className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
                    onClick={() => {
                      if (selectedPortfolioItem.videoUrl) {
                        openVideoModal(selectedPortfolioItem.videoUrl);
                      }
                    }}
                  >
                    <div className="relative group overflow-hidden">
                      <div className="aspect-[4/3] w-full">
                        <img
                          src={selectedPortfolioItem.videoThumbnail || getYouTubeThumbnail(selectedPortfolioItem.videoUrl || '') || ''}
                          alt={`${selectedPortfolioItem.categoryName} - відео превью`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                        <Play className="text-white text-3xl md:text-4xl drop-shadow-lg group-hover:scale-125 transition-transform duration-300" />
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <Button variant="secondary" size="sm" className="w-full text-xs bg-white/90 hover:bg-white">
                          Переглянути відео
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Photos Section */}
              {selectedPortfolioItem.photos && selectedPortfolioItem.photos.length > 0 && (
                <div>
                  <h4 className="font-semibold text-wedding-charcoal mb-3 flex items-center">
                    <Camera className="w-4 h-4 mr-2 text-purple-600" />
                    Фото ({selectedPortfolioItem.photos.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                    {selectedPortfolioItem.photos.map((photo, index) => (
                      <div
                        key={index}
                        className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100"
                        onClick={() => openImageViewer(index)}
                      >
                        <div className="aspect-square">
                          <ProgressiveImage
                            src={photo}
                            alt={`${selectedPortfolioItem.categoryName} - Фото ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                          <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xl" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      <Dialog open={isImageViewerOpen} onOpenChange={closeImageViewer}>
        <DialogContent className="w-[98vw] h-[98vh] max-w-none max-h-none p-0 bg-black/95 border-none">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={closeImageViewer}
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 border border-white/20"
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Navigation Buttons */}
            {selectedPortfolioItem?.photos && selectedPortfolioItem.photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50 text-white hover:bg-white/20 border border-white/20"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 text-white hover:bg-white/20 border border-white/20"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}

            {/* Image Counter */}
            {selectedPortfolioItem?.photos && selectedImageIndex !== null && (
              <div className="absolute top-4 left-4 z-50 bg-black/50 text-white px-3 py-1 rounded-full text-sm border border-white/20">
                {selectedImageIndex + 1} / {selectedPortfolioItem.photos.length}
              </div>
            )}

            {/* Main Image */}
            {selectedPortfolioItem?.photos && selectedImageIndex !== null && (
              <div className="relative max-w-full max-h-full flex items-center justify-center p-4">
                <img
                  src={selectedPortfolioItem.photos[selectedImageIndex]}
                  alt={`${selectedPortfolioItem.categoryName} - Фото ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                  style={{
                    maxWidth: 'calc(100vw - 2rem)',
                    maxHeight: 'calc(100vh - 2rem)'
                  }}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Video Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={closeVideoModal}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-auto bg-transparent border-none p-0 m-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Перегляд відео</DialogTitle>
            <DialogDescription>Повноекранний перегляд відео з портфоліо</DialogDescription>
          </DialogHeader>
          <div className="relative w-full">
            {/* Close button - positioned above video on mobile, overlay on desktop */}
            <button
              onClick={closeVideoModal}
              className="absolute -top-12 right-0 md:top-4 md:right-4 z-50 text-white hover:text-gray-300 transition-colors bg-black/80 rounded-full p-2"
            >
              <X size={28} />
            </button>

            {/* YouTube Embed with mobile optimization */}
            {selectedVideoUrl && (
              <div className="relative bg-black" style={{ paddingBottom: '56.25%', height: 0 }}>
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