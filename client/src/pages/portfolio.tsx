import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Play, Camera, ZoomIn, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { PortfolioItem } from "@shared/schema";

export default function Portfolio() {
  const [portfolioFilter, setPortfolioFilter] = useState<'all' | 'video' | 'photo'>('all');
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<PortfolioItem | null>(null);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

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

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedPortfolioItem?.photos && selectedImageIndex !== null) {
      const totalImages = selectedPortfolioItem.photos.length;
      if (direction === 'prev') {
        setSelectedImageIndex(selectedImageIndex === 0 ? totalImages - 1 : selectedImageIndex - 1);
      } else {
        setSelectedImageIndex(selectedImageIndex === totalImages - 1 ? 0 : selectedImageIndex + 1);
      }
    }
  };

  // Convert YouTube URL to embeddable format
  const getEmbeddableVideoUrl = (url: string) => {
    if (!url) return '';

    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);

    if (match && match[1]) {
      const videoId = match[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }

    return url;
  };

  // Keyboard navigation for image viewer
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (isImageViewerOpen) {
        if (event.key === 'ArrowLeft') {
          navigateImage('prev');
        } else if (event.key === 'ArrowRight') {
          navigateImage('next');
        } else if (event.key === 'Escape') {
          closeImageViewer();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isImageViewerOpen, selectedImageIndex]);

  const filteredItems = portfolioItems.filter(item => 
    portfolioFilter === 'all' || item.type === portfolioFilter
  );

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
    <div className="min-h-screen bg-wedding-cream">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="flex items-center gap-2 text-wedding-charcoal hover:text-green-600">
                <ArrowLeft size={20} />
                Повернутися на головну
              </Button>
            </Link>
            <h1 className="font-display text-2xl md:text-4xl font-bold text-wedding-charcoal">
              Наше <span className="text-green-600">портфоліо</span>
            </h1>
            <div></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Filter Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            variant={portfolioFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setPortfolioFilter('all')}
            className="px-6 py-2"
          >
            Всі роботи ({portfolioItems.length})
          </Button>
          <Button
            variant={portfolioFilter === 'video' ? 'default' : 'outline'}
            onClick={() => setPortfolioFilter('video')}
            className="px-6 py-2"
          >
            Відео ({portfolioItems.filter(item => item.type === 'video').length})
          </Button>
          <Button
            variant={portfolioFilter === 'photo' ? 'default' : 'outline'}
            onClick={() => setPortfolioFilter('photo')}
            className="px-6 py-2"
          >
            Фото ({portfolioItems.filter(item => item.type === 'photo').length})
          </Button>
        </div>

        {/* Portfolio Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-wedding-gray text-lg">Немає робіт для відображення</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card 
                key={item.id} 
                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
                onClick={() => openPortfolioItem(item)}
              >
                <div className="relative h-48 group overflow-hidden">
                  {item.thumbnail ? (
                    <>
                      <img
                        src={item.thumbnail}
                        alt={`${item.title} - превью`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                        {item.type === 'video' ? (
                          <Play className="text-white text-5xl drop-shadow-lg group-hover:scale-125 transition-transform duration-300" />
                        ) : (
                          <Camera className="text-white text-5xl drop-shadow-lg group-hover:scale-125 transition-transform duration-300" />
                        )}
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.type === 'video' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'
                        }`}>
                          {item.type === 'video' ? 'Відео' : 'Фото'}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-white font-semibold text-sm drop-shadow-lg">{item.category}</p>
                        <p className="text-white/90 text-xs drop-shadow-lg">({item.couple})</p>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-green-50">
                      <div className="text-center">
                        {item.type === 'video' ? (
                          <Play className="text-green-600 text-5xl mb-3 mx-auto group-hover:scale-125 transition-transform duration-300" />
                        ) : (
                          <Camera className="text-green-600 text-5xl mb-3 mx-auto group-hover:scale-125 transition-transform duration-300" />
                        )}
                        <p className="text-wedding-charcoal font-semibold">{item.category}</p>
                        <p className="text-wedding-gray text-sm">({item.couple})</p>
                      </div>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-display text-lg font-semibold text-wedding-charcoal mb-2">{item.title}</h3>
                  <p className="text-wedding-gray text-sm leading-relaxed line-clamp-2">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Portfolio Modal */}
      <Dialog open={isPortfolioModalOpen} onOpenChange={setIsPortfolioModalOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-wedding-charcoal">
              {selectedPortfolioItem?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedPortfolioItem?.category} • {selectedPortfolioItem?.couple}
            </DialogDescription>
          </DialogHeader>

          {selectedPortfolioItem && (
            <div className="space-y-6">
              <p className="text-wedding-gray">
                {selectedPortfolioItem.description}
              </p>

              {selectedPortfolioItem.type === 'video' && selectedPortfolioItem.videoUrl ? (
                <div className="aspect-video w-full">
                  <iframe
                    src={getEmbeddableVideoUrl(selectedPortfolioItem.videoUrl)}
                    title={selectedPortfolioItem.title}
                    className="w-full h-full rounded-lg"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedPortfolioItem.photos?.map((photo: string, index: number) => (
                    <div 
                      key={index}
                      className="relative group cursor-pointer overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() => openImageViewer(index)}
                    >
                      <img
                        src={photo}
                        alt={`${selectedPortfolioItem.title} - фото ${index + 1}`}
                        className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" size={32} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-center">
                <p className="text-sm text-wedding-gray mb-3">
                  Хочете такий же результат для вашого весілля?
                </p>
                <Link href="/#contact">
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => setIsPortfolioModalOpen(false)}
                  >
                    Замовити консультацію
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      <Dialog open={isImageViewerOpen} onOpenChange={closeImageViewer}>
        <DialogContent className="max-w-5xl w-full h-[90vh] bg-black/95 border-none p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Перегляд фотографії</DialogTitle>
            <DialogDescription>Повноекранний перегляд фотографії з портфоліо</DialogDescription>
          </DialogHeader>
          <div className="relative w-full h-full flex items-center justify-center">
            {selectedPortfolioItem?.photos && selectedImageIndex !== null && (
              <>
                <button
                  onClick={closeImageViewer}
                  className="absolute top-4 right-4 z-50 text-white hover:text-gray-300 transition-colors"
                >
                  <X size={32} />
                </button>

                {selectedPortfolioItem.photos.length > 1 && (
                  <>
                    <button
                      onClick={() => navigateImage('prev')}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 z-40 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
                    >
                      <ChevronLeft size={32} />
                    </button>
                    <button
                      onClick={() => navigateImage('next')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 z-40 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
                    >
                      <ChevronRight size={32} />
                    </button>
                  </>
                )}

                <img
                  src={selectedPortfolioItem.photos[selectedImageIndex]}
                  alt={`${selectedPortfolioItem.title} - фото ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />

                {selectedPortfolioItem.photos.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
                    {selectedImageIndex + 1} / {selectedPortfolioItem.photos.length}
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}