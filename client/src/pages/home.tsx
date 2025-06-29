import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ProgressiveImage } from "@/components/ProgressiveImage";
import { insertContactSubmissionSchema, type InsertContactSubmission, type PortfolioItem, type BookedDate } from "@shared/schema";
import logoPath from "@assets/Кружок copy_1749922259717.png";
import weddingHeroImage from "@assets/завантаження_1749993288302.png";

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
import { 
  Video, 
  Heart, 
  Eye, 
  Film, 
  Clock, 
  Sun, 
  Camera, 
  Shield, 
  Play,
  Star,
  Instagram,
  Send,
  Phone,
  MapPin,
  Gift,
  Menu,
  X,
  Upload,
  FileText,
  MessageCircle,
  Users,
  Award,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  MapPinIcon as Location,
  Church,
  VideoIcon,
  UserCheck
} from "lucide-react";
import { SiTelegram, SiViber } from "react-icons/si";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<any>(null);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>("");
  const [weddingDate, setWeddingDate] = useState<Date>();
  const [isRestaurantExpanded, setIsRestaurantExpanded] = useState(false);
  const [isFotoservicesExpanded, setIsFotoservicesExpanded] = useState(false);

  const [isRanokExpanded, setIsRanokExpanded] = useState(false);
  const [isCeremoniyaExpanded, setIsCeremoniyaExpanded] = useState(false);
  const [isLoveStoryExpanded, setIsLoveStoryExpanded] = useState(false);
  const [isDvokamernaExpanded, setIsDvokamernaExpanded] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const { toast } = useToast();

  // Package pricing structure
  const packagePrices = {
    "Комплексний пакет: Фото + Відео": {
      base: 700,
      options: {
        "Love Story - Відео": 150,
        "Love Story - Фото": 150
      }
    },
    "Пакет: Двокамерна відеозйомка": {
      base: 500,
      options: {
        "Love Story - Відео": 150
      }
    }
  };

  // Fetch portfolio items from API
  const { data: portfolioItems = [], isLoading: portfolioLoading } = useQuery<PortfolioItem[]>({
    queryKey: ["/api/portfolio"],
  });

  // Fetch booked dates from API
  const { data: bookedDates = [] } = useQuery<BookedDate[]>({
    queryKey: ["/api/booked-dates"],
  });

  // Check if a date is booked
  const isDateBooked = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");
    return bookedDates.some(bookedDate => bookedDate.date === dateString);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const form = useForm<InsertContactSubmission>({
    resolver: zodResolver(insertContactSubmissionSchema),
    defaultValues: {
      brideName: "",
      groomName: "",
      phone: "",
      email: "",
      weddingDate: "",
      location: "",
      services: [],
      additionalInfo: "",
      attachments: [],
    },
  });

  const submitContactForm = useMutation({
    mutationFn: async (data: any) => {
      if (data instanceof FormData) {
        // Handle FormData for file uploads
        const response = await fetch("/api/contact", {
          method: "POST",
          body: data,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Network error" }));
          throw new Error(errorData.message || "Failed to submit form");
        }

        return response.json();
      } else {
        return apiRequest("POST", "/api/contact", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Заявка відправлена!",
        description: "Дякуємо за звернення! Тепер напишіть нам у особисті повідомлення в Telegram або Instagram для обговорення деталей.",
      });
      form.reset();
      setFiles([]);
      setWeddingDate(undefined);
      setSelectedPackage("");
      setSelectedOptions([]);
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося відправити заявку. Спробуйте пізніше.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: InsertContactSubmission) => {
    const formData = new FormData();

    // Prepare detailed services array with package and selected options
    const detailedServices = [];
    
    // Add selected package
    if (selectedPackage) {
      detailedServices.push(selectedPackage);
    }
    
    // Add all selected options
    selectedOptions.forEach(option => {
      detailedServices.push(option);
    });

    // Create enhanced data object with detailed services
    const enhancedData = {
      ...data,
      services: detailedServices
    };

    // Add form fields
    Object.entries(enhancedData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value as string);
      }
    });

    // Add files
    files.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });

    // Add total price and package details
    formData.append('totalPrice', calculateTotalPrice().toString());
    formData.append('selectedPackage', selectedPackage);
    formData.append('selectedOptions', JSON.stringify(selectedOptions));

    submitContactForm.mutate(formData);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Calculate offset for navbar height
      const navbarHeight = 80;
      // Special offset for testimonials to show more content
      let extraOffset = 0;
      if (sectionId === 'testimonials') {
        // Check if mobile device
        const isMobile = window.innerWidth < 768;
        extraOffset = isMobile ? -40 : 50;
      }
      const elementPosition = element.offsetTop - navbarHeight - extraOffset;
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
    setIsMenuOpen(false);
  };

  const handleServiceChange = (service: string, checked: boolean) => {
    const currentServices = form.getValues("services") || [];
    let newServices: string[] = [...currentServices];
    
    if (checked) {
      // Handle mutual exclusivity rules
      if (service === "Двокамерна відеозйомка" || service === "Фотопослуги") {
        // Remove the other mutually exclusive service
        const exclusive = service === "Двокамерна відеозйомка" ? "Фотопослуги" : "Двокамерна відеозйомка";
        newServices = newServices.filter(s => !s.startsWith(exclusive));
      } else if (service.startsWith("Двокамерна відеозйомка") || service.startsWith("Фотопослуги")) {
        // Remove parent service and other sub-options
        const parent = service.startsWith("Двокамерна відеозйомка") ? "Двокамерна відеозйомка" : "Фотопослуги";
        const exclusive = parent === "Двокамерна відеозйомка" ? "Фотопослуги" : "Двокамерна відеозйомка";
        newServices = newServices.filter(s => s !== parent && !s.startsWith(exclusive));
      }
      
      // Handle restaurant sub-options (only one allowed)
      if (service.startsWith("Ресторан")) {
        newServices = newServices.filter(s => !s.startsWith("Ресторан"));
      }
      
      // Handle other single-choice sub-options
      if (service.startsWith("Вінчання - ")) {
        newServices = newServices.filter(s => !s.startsWith("Вінчання - "));
      }
      
      newServices.push(service);
    } else {
      newServices = newServices.filter(s => s !== service);
    }
    
    form.setValue("services", newServices);
    setSelectedServices(newServices);
  };

  const handleSubServiceChange = (parentService: string, subService: string, checked: boolean, allowMultiple = false) => {
    const currentServices = form.getValues("services") || [];
    let newServices: string[] = [...currentServices];
    
    if (checked) {
      if (!allowMultiple) {
        // Remove other sub-services of the same parent
        newServices = newServices.filter(s => !s.startsWith(parentService + " - "));
      }
      newServices.push(subService);
    } else {
      newServices = newServices.filter(s => s !== subService);
    }
    
    form.setValue("services", newServices);
    setSelectedServices(newServices);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate total price based on selected package and options
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  const calculateTotalPrice = () => {
    if (!selectedPackage) return 0;
    
    const packageData = packagePrices[selectedPackage as keyof typeof packagePrices];
    if (!packageData) return 0;
    
    let total = packageData.base;
    // Only add prices for add-on services (Вінчання and Love Story)
    selectedOptions.forEach(option => {
      if (option.startsWith('Вінчання -') || option.startsWith('Love Story -')) {
        total += packageData.options[option as keyof typeof packageData.options] || 0;
      }
    });
    
    return total;
  };

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

    // Handle different YouTube URL formats
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);

    if (match && match[1]) {
      // Extract video ID and create embed URL
      const videoId = match[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // If it's already an embed URL or another video platform, return as is
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

  return (
    <div className="min-h-screen bg-wedding-cream text-wedding-charcoal">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img 
                src={logoPath} 
                alt="Kubenko Production Studio Logo" 
                className="w-8 h-8 md:w-10 md:h-10 object-contain"
              />
              <span className="font-display font-semibold text-lg md:text-xl text-wedding-charcoal">Kubenko Production Studio</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
              <button onClick={() => scrollToSection('hero')} className="text-wedding-gray hover:text-green-600 transition-colors duration-300">Головна</button>
              <button onClick={() => scrollToSection('about')} className="text-wedding-gray hover:text-green-600 transition-colors duration-300">Про нас</button>
              <button onClick={() => scrollToSection('portfolio')} className="text-wedding-gray hover:text-green-600 transition-colors duration-300">Портфоліо</button>
              <button onClick={() => scrollToSection('services')} className="text-wedding-gray hover:text-green-600 transition-colors duration-300">Послуги</button>
              <button onClick={() => scrollToSection('testimonials')} className="text-wedding-gray hover:text-green-600 transition-colors duration-300">Відгуки</button>
              <button onClick={() => scrollToSection('contact')} className="text-wedding-gray hover:text-green-600 transition-colors duration-300">Замовити зйомку</button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-wedding-gray hover:text-green-600 transition-colors duration-300"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden pb-4 bg-white rounded-b-lg shadow-lg">
              <div className="flex flex-col space-y-4 p-4">
                <button onClick={() => scrollToSection('hero')} className="text-wedding-gray hover:text-green-600 transition-colors duration-300 text-left py-2">Головна</button>
                <button onClick={() => scrollToSection('about')} className="text-wedding-gray hover:text-green-600 transition-colors duration-300 text-left py-2">Про нас</button>
                <button onClick={() => scrollToSection('portfolio')} className="text-wedding-gray hover:text-green-600 transition-colors duration-300 text-left py-2">Портфоліо</button>
                <button onClick={() => scrollToSection('services')} className="text-wedding-gray hover:text-green-600 transition-colors duration-300 text-left py-2">Послуги</button>
                <button onClick={() => scrollToSection('testimonials')} className="text-wedding-gray hover:text-green-600 transition-colors duration-300 text-left py-2">Відгуки</button>
                <button onClick={() => scrollToSection('contact')} className="text-wedding-gray hover:text-green-600 transition-colors duration-300 text-left py-2">Замовити зйомку</button>
              </div>
            </div>
          )}
        </div>
      </nav>
      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          {/* Desktop Image */}
          <img 
            src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Wedding videographer filming ceremony"
            className="hero-background-desktop hidden md:block"
          />
          {/* Mobile Image */}
          <img 
            src={weddingHeroImage}
            alt="Beautiful wedding ceremony moment"
            className="hero-background-mobile block md:hidden"
          />
          <div className="absolute inset-0 hero-overlay"></div>
        </div>

        {/* Logo, buttons, and stats moved to bottom */}
        <div className="absolute bottom-12 md:bottom-32 left-1/2 transform -translate-x-1/2 w-full max-w-6xl mx-auto px-4 text-center">
          {/* Logo */}
          <div className={`mb-4 md:mb-8 ${isVisible ? 'fade-in-scale' : ''}`}>
            <img 
              src={logoPath} 
              alt="Kubenko Production Studio" 
              className="w-16 h-16 md:w-32 md:h-32 mx-auto mb-3 md:mb-6 drop-shadow-2xl"
            />
          </div>

          <div className={`flex flex-col gap-3 md:flex-row md:gap-4 justify-center mb-6 md:mb-12 ${isVisible ? 'slide-in-bottom delay-600' : ''}`}>
            <Button 
              onClick={() => scrollToSection('contact')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 md:px-8 md:py-4 rounded-full font-medium transform hover:scale-105 transition-all duration-300 shadow-2xl"
            >
              Замовити зйомку
              <ArrowRight className="ml-2" size={18} />
            </Button>
            <Button 
              variant="outline"
              onClick={() => scrollToSection('portfolio')}
              className="border-2 border-white text-white bg-white/20 hover:bg-white hover:text-wedding-charcoal px-6 py-3 md:px-8 md:py-4 rounded-full font-medium transform hover:scale-105 transition-all duration-300 shadow-2xl backdrop-blur-sm"
            >
              Переглянути роботи
              <Play className="ml-2" size={18} />
            </Button>
          </div>

          <div className={`grid grid-cols-3 gap-4 md:gap-8 text-center ${isVisible ? 'slide-in-bottom delay-800' : ''}`}>
            <div className="transform hover:scale-105 transition-transform duration-300 backdrop-blur-sm bg-white/10 rounded-xl md:rounded-2xl p-3 md:p-6">
              <div className="text-xl md:text-4xl font-bold text-green-400 drop-shadow-lg mb-1 md:mb-2">16+</div>
              <div className="text-white drop-shadow font-medium text-xs md:text-base">років досвіду</div>
            </div>
            <div className="transform hover:scale-105 transition-transform duration-300 backdrop-blur-sm bg-white/10 rounded-xl md:rounded-2xl p-3 md:p-6">
              <div className="text-xl md:text-4xl font-bold text-green-400 drop-shadow-lg mb-1 md:mb-2">1000+</div>
              <div className="text-white drop-shadow font-medium text-xs md:text-base">щасливих пар</div>
            </div>
            <div className="transform hover:scale-105 transition-transform duration-300 backdrop-blur-sm bg-white/10 rounded-xl md:rounded-2xl p-3 md:p-6">
              <div className="text-xl md:text-4xl font-bold text-green-400 drop-shadow-lg mb-1 md:mb-2">100%</div>
              <div className="text-white drop-shadow font-medium text-xs md:text-base">якість</div>
            </div>
          </div>


        </div>



        {/* Scroll indicator - hidden on mobile */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce hidden md:block">
          <ChevronDown className="text-white drop-shadow-lg" size={32} />
        </div>
      </section>
      {/* About Section */}
      <section id="about" className="py-10 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center md:hidden mb-8">
            <h2 className="font-display text-2xl font-bold text-wedding-charcoal mb-3">
              Про нашу <span className="text-green-600">студію</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="slide-in-left">
              <h2 className="hidden md:block font-display text-4xl md:text-5xl font-bold text-wedding-charcoal mb-6">
                Про нашу <span className="text-green-600">студію</span>
              </h2>
              <p className="text-base md:text-lg text-wedding-gray mb-4 md:mb-6 leading-relaxed">Ми любимо свою справу і з душею підходимо до кожної пари. Наша мета — зберегти у відео справжні емоції та атмосферу вашого свята.</p>
              <p className="text-base md:text-lg text-wedding-gray mb-6 md:mb-8 leading-relaxed">У команді працюють досвідчені відеографи та фотографи, які відповідально ставляться до кожної деталі — від зйомки до монтажу.</p>

              <div className="hidden md:grid grid-cols-2 gap-4 md:gap-6">
                <div className="text-center p-4 md:p-6 bg-green-50 rounded-xl md:rounded-2xl transform hover:scale-105 transition-all duration-300 shadow-lg">
                  <Heart className="text-green-600 text-2xl md:text-3xl mb-2 md:mb-3 mx-auto" size={24} />
                  <div className="font-semibold text-wedding-charcoal text-sm md:text-base">Підхід з душею</div>
                </div>
                <div className="text-center p-4 md:p-6 bg-green-50 rounded-xl md:rounded-2xl transform hover:scale-105 transition-all duration-300 shadow-lg">
                  <Eye className="text-green-600 text-2xl md:text-3xl mb-2 md:mb-3 mx-auto" size={24} />
                  <div className="font-semibold text-wedding-charcoal text-sm md:text-base">Справжні емоції</div>
                </div>
              </div>
            </div>

            <div className="relative slide-in-right">
              <img 
                src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Professional video equipment setup" 
                className="rounded-xl md:rounded-2xl shadow-2xl w-full transform hover:scale-105 transition-transform duration-500"
              />

              <div className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6 bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-2xl fade-in-scale delay-600">
                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <img src={logoPath} alt="Logo" className="w-8 h-8 md:w-12 md:h-12" />
                  </div>
                  <div>
                    <div className="font-bold text-wedding-charcoal text-sm md:text-lg">16 років</div>
                    <div className="text-wedding-gray text-xs md:text-base">професійного досвіду</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Portfolio Section */}
      <section id="portfolio" className="py-10 md:py-20 bg-gradient-to-br from-green-50 to-wedding-cream">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-6 md:mb-16 slide-in-top">
            <h2 className="font-display text-xl md:text-4xl lg:text-5xl font-bold text-wedding-charcoal mb-2 md:mb-4">
              Наше <span className="text-green-600">портфоліо</span>
            </h2>
            <p className="hidden md:block text-base md:text-lg text-wedding-gray max-w-2xl mx-auto mb-4">
              Перегляньте приклади наших робіт та переконайтеся в якості наших послуг
            </p>


          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {portfolioItems
            .slice(0, 3)
            .map((item, index) => (
              <Card 
                key={item.id} 
                className={`bg-gradient-to-br from-green-50 to-white rounded-lg md:rounded-2xl overflow-hidden shadow-md md:shadow-xl hover:shadow-lg md:hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] slide-in-bottom delay-${(index + 1) * 100} cursor-pointer flex flex-col`}
                onClick={() => openPortfolioItem(item)}
              >
                <div className="relative group overflow-hidden">
                  {(item.categoryPreview || item.photoThumbnail || item.videoThumbnail) ? (
                    <>
                      <div className="aspect-[4/3] w-full">
                        <img
                          src={item.categoryPreview || item.photoThumbnail || item.videoThumbnail || ''}
                          alt={`${item.categoryName} - превью`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                        {item.videoUrl ? (
                          <Play className="text-white text-2xl md:text-5xl drop-shadow-lg group-hover:scale-125 transition-transform duration-300" />
                        ) : (
                          <Camera className="text-white text-2xl md:text-5xl drop-shadow-lg group-hover:scale-125 transition-transform duration-300" />
                        )}
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                      </div>
                    </>
                  ) : (
                    <div className="aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-green-100 to-green-50 group relative">
                      <div className="text-center z-10">
                        <Camera className="text-green-600 text-2xl md:text-5xl mb-2 md:mb-3 mx-auto group-hover:scale-125 transition-transform duration-300" />
                        <p className="text-wedding-charcoal font-semibold text-sm md:text-base">{item.categoryName}</p>
                      </div>
                      <div className="absolute inset-0 bg-green-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                    </div>
                  )}
                </div>
                <CardContent className="p-3 md:p-6 flex-1 flex flex-col">
                  <h3 className="font-display text-sm md:text-lg font-semibold text-wedding-charcoal mb-1 md:mb-2">{item.categoryName}</h3>
                  <div className="flex items-center gap-1 mt-auto">
                    {item.photos && item.photos.length > 0 && (
                      <span className="inline-flex items-center px-1 md:px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <Camera className="w-2 h-2 md:w-3 md:h-3 mr-1" />
                        Фото
                      </span>
                    )}
                    {item.videoUrl && (
                      <span className="inline-flex items-center px-1 md:px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Play className="w-2 h-2 md:w-3 md:h-3 mr-1" />
                        Відео
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8 md:mt-12 slide-in-bottom delay-700">
            <Link href="/portfolio">
              <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 md:px-8 md:py-4 rounded-full font-medium transform hover:scale-105 transition-all duration-300 shadow-2xl">
                Переглянути всі роботи
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      {/* Services Section */}
      <section id="services" className="py-10 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-6 md:mb-16 slide-in-top">
            <h2 className="font-display text-xl md:text-4xl lg:text-5xl font-bold text-wedding-charcoal mb-2 md:mb-4">
              Наші <span className="text-green-600">послуги</span>
            </h2>
            <p className="hidden md:block text-base md:text-lg text-wedding-gray max-w-2xl mx-auto">
              Повний спектр послуг для створення ідеального весільного відео
            </p>
          </div>

          {/* Mobile: Properly aligned 2-column grid */}
          <div className="md:hidden grid grid-cols-2 gap-3">
            {[
              { icon: Film, title: "Повнометражний фільм", description: "Детальний фільм про ваш весільний день з усіма важливими моментами", delay: "delay-100" },
              { icon: Heart, title: "Весільний кліп", description: "Короткий кліп з найяскравішими та найемоційнішими моментами дня", delay: "delay-200" },
              { icon: Camera, title: "Фотопослуги", description: "Професійний фотограф на повний день весілля", delay: "delay-300" },
              { icon: Sun, title: "Ранок нареченої і нареченого", description: "Зйомка підготовки нареченої та збори нареченого", delay: "delay-400" },
              { icon: Church, title: "Церемонія", description: "Професійна зйомка церемонії одруження", delay: "delay-500" },
              { icon: VideoIcon, title: "Двокамерна відеозйомка", description: "Зйомка з двох камер для повного охоплення моментів", delay: "delay-600" },
            ].map((service, index) => (
              <Card key={index} className={`bg-white p-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-500 transform hover:scale-105 slide-in-bottom ${service.delay} h-full`}>
                <CardContent className="p-0 h-full flex flex-col">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mb-3 transform hover:rotate-6 transition-transform duration-300">
                    <service.icon className="text-white w-5 h-5" />
                  </div>
                  <h3 className="font-display text-sm font-semibold text-wedding-charcoal mb-2">{service.title}</h3>
                  <p className="text-wedding-gray leading-relaxed text-xs flex-grow">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop: Clean 3-column grid */}
          <div className="hidden md:block">
            <div className="grid grid-cols-3 gap-8">
              {[
                { icon: Film, title: "Повнометражний фільм", description: "Детальний фільм про ваш весільний день з усіма важливими моментами", delay: "delay-100" },
                { icon: Heart, title: "Весільний кліп", description: "Короткий кліп з найяскравішими та найемоційнішими моментами дня", delay: "delay-200" },
                { icon: Camera, title: "Фотопослуги", description: "Професійний фотограф на повний день весілля", delay: "delay-300" },
                { icon: Sun, title: "Ранок нареченої і нареченого", description: "Зйомка підготовки нареченої та збори нареченого", delay: "delay-400" },
                { icon: Church, title: "Церемонія", description: "Професійна зйомка церемонії одруження", delay: "delay-500" },
                { icon: VideoIcon, title: "Двокамерна відеозйомка", description: "Зйомка з двох камер для повного охоплення моментів", delay: "delay-600" },
              ].map((service, index) => (
                <Card key={index} className={`bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 slide-in-bottom ${service.delay} h-full`}>
                  <CardContent className="p-0 h-full flex flex-col">
                    <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mb-6 transform hover:rotate-6 transition-transform duration-300">
                      <service.icon className="text-white w-8 h-8" />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-wedding-charcoal mb-4">{service.title}</h3>
                    <p className="text-wedding-gray leading-relaxed text-base flex-grow">{service.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* How We Work Section */}
      <section id="process" className="py-10 md:py-20 bg-gradient-to-br from-green-50 to-wedding-cream">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-6 md:mb-16 slide-in-top">
            <h2 className="font-display text-xl md:text-4xl lg:text-5xl font-bold text-wedding-charcoal mb-2 md:mb-4">
              Як ми <span className="text-green-600">працюємо</span>
            </h2>
            <p className="hidden md:block text-base md:text-lg text-wedding-gray max-w-2xl mx-auto">
              Простий і зрозумілий процес від першого звернення до готового відео
            </p>
          </div>

          {/* Mobile layout */}
          <div className="md:hidden grid grid-cols-1 gap-6">
            {[
              { title: "Ваше звернення", description: "Зв'яжіться з нами зручним способом - через форму, телефон або соцмережі", icon: MessageCircle, delay: "delay-100" },
              { title: "Обговорення деталей", description: "Детально обговорюємо ваші побажання, дату, локацію та формат зйомки", icon: Users, delay: "delay-200" },
              { title: "День зйомки", description: "Професійно знімаємо ваше весілля, не заважаючи насолоджуватись днем", icon: Video, delay: "delay-300" },
              { title: "Монтаж відео та обробка фотографій", description: "Створюємо емоційний фільм з вашими найкращими моментами та обробляємо фотографії", icon: Film, delay: "delay-400" },
              { title: "Готове відео", description: "Отримуєте готовий фільм у високій якості для зберігання спогадів", icon: Gift, delay: "delay-500" },
            ].map((item, index) => (
              <div key={index} className={`parallax-slide ${item.delay} relative`}>
                <Card className={`bg-white p-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-500 transform hover:scale-105 slide-in-bottom`}>
                  <CardContent className="p-0">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mb-3 transform hover:rotate-6 transition-transform duration-300">
                      <item.icon className="text-white" size={20} />
                    </div>
                    <h3 className="font-display text-sm font-semibold text-wedding-charcoal mb-2">{item.title}</h3>
                    <p className="text-wedding-gray leading-relaxed text-xs">{item.description}</p>
                  </CardContent>
                </Card>

                {/* Mobile arrow */}
                {index < 4 && (
                  <div className="flex justify-center mt-3">
                    <ArrowRight className="text-green-400 rotate-90" size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop layout */}
          <div className="hidden md:block">
            {/* First row - 3 items */}
            <div className="grid grid-cols-3 gap-8 mb-8">
              {[
                { title: "Ваше звернення", description: "Зв'яжіться з нами зручним способом - через форму, телефон або соцмережі", icon: MessageCircle, delay: "delay-100" },
                { title: "Обговорення деталей", description: "Детально обговорюємо ваші побажання, дату, локацію та формат зйомки", icon: Users, delay: "delay-200" },
                { title: "День зйомки", description: "Професійно знімаємо ваше весілля, не заважаючи насолоджуватись днем", icon: Video, delay: "delay-300" },
              ].map((item, index) => (
                <div key={index} className={`parallax-slide ${item.delay} relative text-center`}>
                  <div className="relative mb-4 md:mb-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-green-600 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 transform hover:rotate-6 transition-transform duration-300 shadow-lg md:shadow-xl">
                      <item.icon className="text-white" size={28} />
                    </div>
                    {/* Arrow for first row items */}
                    {index < 2 && (
                      <div className="absolute top-1/2 -translate-y-1/2 -right-8 lg:-right-12 hidden lg:block">
                        <ArrowRight className="text-green-400" size={40} />
                      </div>
                    )}
                  </div>
                  <h3 className="font-display text-lg md:text-xl font-semibold text-wedding-charcoal mb-2 md:mb-3">{item.title}</h3>
                  <p className="text-wedding-gray leading-relaxed text-sm md:text-base">{item.description}</p>
                </div>
              ))}
            </div>

            {/* Second row - 2 items centered */}
            <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
              {[
                { title: "Монтаж відео та обробка фотографій", description: "Створюємо емоційний фільм з вашими найкращими моментами та обробляємо фотографії", icon: Film, delay: "delay-400" },
                { title: "Готове відео", description: "Отримуєте готовий фільм у високій якості для зберігання спогадів", icon: Gift, delay: "delay-500" },
              ].map((item, index) => (
                <div key={index} className={`parallax-slide ${item.delay} relative text-center`}>
                  <div className="relative mb-4 md:mb-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-green-600 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 transform hover:rotate-6 transition-transform duration-300 shadow-lg md:shadow-xl">
                      <item.icon className="text-white" size={28} />
                    </div>
                    {/* Arrow for second row - only first item */}
                    {index === 0 && (
                      <div className="absolute top-1/2 -translate-y-1/2 -right-8 lg:-right-12 hidden lg:block">
                        <ArrowRight className="text-green-400" size={40} />
                      </div>
                    )}
                  </div>
                  <h3 className="font-display text-lg md:text-xl font-semibold text-wedding-charcoal mb-2 md:mb-3">{item.title}</h3>
                  <p className="text-wedding-gray leading-relaxed text-sm md:text-base">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* Instagram Reviews Section */}
      <section id="testimonials" className="py-8 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-6 md:mb-16 slide-in-top">
            <h2 className="font-display text-xl md:text-4xl lg:text-5xl font-bold text-wedding-charcoal mb-2 md:mb-4">
              Відгуки з <span className="text-green-600">Instagram</span>
            </h2>
            <p className="text-sm md:text-lg text-wedding-gray max-w-2xl mx-auto">
              Справжні відгуки наших клієнтів з соціальних мереж
            </p>
          </div>

          <div className="text-center slide-in-bottom">
            <div className="bg-gradient-to-br from-green-50 to-white p-4 md:p-12 rounded-xl md:rounded-3xl shadow-md md:shadow-2xl max-w-2xl mx-auto">
              <Instagram className="text-green-600 mx-auto mb-3 md:mb-6" size={32} />
              <h3 className="font-display text-lg md:text-2xl font-semibold text-wedding-charcoal mb-2 md:mb-4">
                Перегляньте відгуки в Instagram
              </h3>
              <p className="text-wedding-gray mb-4 md:mb-6 leading-relaxed text-sm md:text-base">
                Ми регулярно публікуємо відгуки наших клієнтів та приклади робіт у нашому Instagram. 
                Там ви знайдете 99% всіх наших проектів та справжні емоції пар.
              </p>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 md:px-8 md:py-4 rounded-full font-medium transform hover:scale-105 transition-all duration-300 shadow-lg md:shadow-2xl text-sm md:text-base"
                onClick={() => window.open('https://www.instagram.com/stories/highlights/17986870213093771/', '_blank')}
              >
                Instagram
                <Instagram className="ml-2" size={16} />
              </Button>
            </div>
          </div>
        </div>
      </section>
      {/* Working Hours & Info Section - Simplified for mobile */}
      <section className="py-8 md:py-16 bg-gradient-to-r from-green-100 to-green-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center">
            <div className="slide-in-left delay-100">
              <Clock className="text-green-600 mx-auto mb-3 md:mb-4" size={40} />
              <h3 className="font-display text-lg md:text-xl font-semibold text-wedding-charcoal mb-2">Час роботи</h3>
              <p className="text-wedding-gray text-sm md:text-base">Понеділок - Неділя</p>
              <p className="text-green-600 font-semibold text-base md:text-lg">9:00 - 21:00</p>
            </div>
            <div className="slide-in-bottom delay-200">
              <MapPin className="text-green-600 mx-auto mb-3 md:mb-4" size={40} />
              <h3 className="font-display text-lg md:text-xl font-semibold text-wedding-charcoal mb-2">Локація</h3>
              <p className="text-wedding-gray text-sm md:text-base">Київська область</p>
              <p className="text-green-600 font-semibold text-base md:text-lg">Працюємо ТІЛЬКИ в Київській області</p>
            </div>
            <div className="slide-in-right delay-300">
              <Award className="text-green-600 mx-auto mb-3 md:mb-4" size={40} />
              <h3 className="font-display text-lg md:text-xl font-semibold text-wedding-charcoal mb-2">Досвід</h3>
              <p className="text-wedding-gray text-sm md:text-base">16 років в індустрії</p>
              <p className="text-green-600 font-semibold text-base md:text-lg">1000+ весіль</p>
            </div>
          </div>
        </div>
      </section>
      {/* Contact Section - Mobile optimized */}
      <section id="contact" className="py-8 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-6 md:mb-16 slide-in-top">
            <h2 className="font-display text-xl md:text-4xl lg:text-5xl font-bold text-wedding-charcoal mb-2 md:mb-4">
              Зв'яжіться з <span className="text-green-600">нами</span>
            </h2>
            <p className="hidden md:block text-base md:text-lg text-wedding-gray max-w-2xl mx-auto">
              Готові обговорити ваше весілля? Заповніть форму або зв'яжіться зручним способом
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
            {/* Contact Form */}
            <div className="slide-in-left">
              <Card className="p-3 md:p-8 rounded-lg md:rounded-2xl shadow-lg md:shadow-2xl bg-gradient-to-br from-white to-green-50">
                <CardContent className="p-0">
                  <h3 className="font-display text-lg md:text-2xl font-semibold text-wedding-charcoal mb-3 md:mb-6">Залишити заяву</h3>
                  <p className="text-sm text-wedding-gray mb-4 leading-relaxed">Після відправки заяви обов'язково напишіть нам у особисті повідомлення для обговорення деталей та уточнення всіх нюансів вашого весілля.</p>

                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 md:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <label className="block text-sm font-medium text-wedding-charcoal mb-2 select-none">
                          Ім'я нареченої *
                        </label>
                        <Input
                          {...form.register("brideName")}
                          placeholder="Анна"
                          className="transition-all duration-300 focus:ring-2 focus:ring-green-500 border-green-200 placeholder:select-none"
                        />
                        {form.formState.errors.brideName && (
                          <p className="text-red-500 text-sm mt-1">{form.formState.errors.brideName.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-wedding-charcoal mb-2 select-none">
                          Ім'я нареченого *
                        </label>
                        <Input
                          {...form.register("groomName")}
                          placeholder="Олексій"
                          className="transition-all duration-300 focus:ring-2 focus:ring-green-500 border-green-200 placeholder:select-none"
                        />
                        {form.formState.errors.groomName && (
                          <p className="text-red-500 text-sm mt-1">{form.formState.errors.groomName.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-wedding-charcoal mb-2 select-none">
                          Телефон *
                        </label>
                        <Input
                          {...form.register("phone")}
                          placeholder="+380 XX XXX XX XX"
                          type="tel"
                          className="transition-all duration-300 focus:ring-2 focus:ring-green-500 border-green-200 placeholder:select-none"
                        />
                        {form.formState.errors.phone && (
                          <p className="text-red-500 text-sm mt-1">{form.formState.errors.phone.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-wedding-charcoal mb-2 select-none">
                          Email *
                        </label>
                        <Input
                          {...form.register("email")}
                          placeholder="your@email.com"
                          type="email"
                          className="transition-all duration-300 focus:ring-2 focus:ring-green-500 border-green-200 placeholder:select-none"
                        />
                        {form.formState.errors.email && (
                          <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-wedding-charcoal mb-2 select-none">
                          Дата весілля *
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal transition-all duration-300 focus:ring-2 focus:ring-green-500 border-green-200 hover:bg-green-50 select-none"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              <span className={weddingDate ? "text-foreground" : "text-muted-foreground select-none"}>
                                {weddingDate ? format(weddingDate, "dd.MM.yyyy") : "Оберіть дату"}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={weddingDate}
                              onSelect={(date) => {
                                setWeddingDate(date);
                                if (date) {
                                  form.setValue("weddingDate", format(date, "yyyy-MM-dd"));
                                }
                              }}
                              disabled={(date) => date < new Date() || isDateBooked(date)}
                              modifiers={{
                                booked: (date) => isDateBooked(date)
                              }}
                              modifiersStyles={{
                                booked: {
                                  backgroundColor: '#ef4444',
                                  color: 'white',
                                  fontWeight: 'bold'
                                }
                              }}
                              locale={uk}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        {form.formState.errors.weddingDate && (
                          <p className="text-red-500 text-sm mt-1">{form.formState.errors.weddingDate.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-wedding-charcoal mb-2 select-none">
                          Локація весілля *
                        </label>
                        <Input
                          {...form.register("location")}
                          placeholder="Київ, ресторан..."
                          className="transition-all duration-300 focus:ring-2 focus:ring-green-500 border-green-200 placeholder:select-none"
                        />
                        {form.formState.errors.location && (
                          <p className="text-red-500 text-sm mt-1">{form.formState.errors.location.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-wedding-charcoal mb-3 select-none">
                        Оберіть пакет послуг *
                      </label>
                      
                      {/* Package Selection */}
                      <div className="grid grid-cols-1 gap-4 mb-6">
                        {Object.keys(packagePrices).map((packageName) => {
                          const isSelected = selectedPackage === packageName;
                          const packageData = packagePrices[packageName as keyof typeof packagePrices];
                          
                          return (
                            <div 
                              key={packageName}
                              onClick={() => {
                                if (selectedPackage === packageName) {
                                  // Close if clicking on already selected package
                                  setSelectedPackage("");
                                  setSelectedOptions([]);
                                  form.setValue("services", []);
                                } else {
                                  // Select new package
                                  setSelectedPackage(packageName);
                                  setSelectedOptions([]);
                                  form.setValue("services", [packageName]);
                                }
                              }}
                              className={`border rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                                isSelected 
                                  ? 'border-green-500 bg-green-50 shadow-lg' 
                                  : 'border-green-200 hover:bg-green-50 hover:border-green-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-5 h-5 border-2 rounded-full transition-all duration-300 flex items-center justify-center ${
                                    isSelected 
                                      ? 'border-green-600 bg-green-600' 
                                      : 'border-green-300'
                                  }`}>
                                    {isSelected && (
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    )}
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-semibold text-wedding-charcoal">
                                      {packageName}
                                    </h3>
                                    <div className="text-sm text-wedding-gray mt-1">
                                      {packageName === "Комплексний пакет: Фото + Відео" ? (
                                        <span>Повнометражний фільм + Весільний кліп + Обробка фотографій</span>
                                      ) : (
                                        <span>Повнометражний фільм + Весільний кліп</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right min-w-[120px]">
                                  <div className={`text-lg md:text-xl font-bold ${isSelected ? 'text-green-700' : 'text-green-600'}`}>
                                    ${packageData.base}
                                  </div>
                                  <div className="text-xs text-wedding-gray whitespace-nowrap">базова вартість</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Package Options */}
                      {selectedPackage && (
                        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                          <h4 className="text-lg font-semibold text-wedding-charcoal mb-4">
                            Деталізація послуг:
                          </h4>
                          
                          {/* Ранок */}
                          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                            <h5 className="font-medium text-wedding-charcoal mb-1">Ранок (входить в базову вартість):</h5>
                            <p className="text-xs text-gray-600 mb-3">Можна обрати декілька варіантів</p>
                            <div className="space-y-2">
                              {['Наречена', 'Наречений'].map((option) => {
                                const optionKey = `Ранок - ${option}`;
                                const isSelected = selectedOptions.includes(optionKey);
                                
                                return (
                                  <div 
                                    key={optionKey}
                                    onClick={() => {
                                      const newOptions = isSelected 
                                        ? selectedOptions.filter(o => o !== optionKey)
                                        : [...selectedOptions, optionKey];
                                      setSelectedOptions(newOptions);
                                    }}
                                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-300 ${
                                      isSelected 
                                        ? 'border-green-500 bg-green-100' 
                                        : 'border-green-200 hover:bg-green-100'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className={`w-4 h-4 border-2 rounded transition-all duration-300 flex items-center justify-center ${
                                        isSelected 
                                          ? 'border-green-600 bg-green-600' 
                                          : 'border-green-300'
                                      }`}>
                                        {isSelected && (
                                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                        )}
                                      </div>
                                      <span className="text-sm text-wedding-charcoal">{option}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Прогулянка */}
                          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                            <h5 className="font-medium text-wedding-charcoal mb-1">Прогулянка (входить в базову вартість):</h5>
                            <p className="text-xs text-gray-600 mb-3">Оберіть одне</p>
                            <div className="space-y-2">
                              {['На території закладу', 'Інша локація'].map((option) => {
                                const optionKey = `Прогулянка - ${option}`;
                                const isSelected = selectedOptions.includes(optionKey);
                                
                                return (
                                  <div 
                                    key={optionKey}
                                    onClick={() => {
                                      const newOptions = selectedOptions.filter(o => !o.startsWith('Прогулянка -'));
                                      if (!isSelected) {
                                        newOptions.push(optionKey);
                                      }
                                      setSelectedOptions(newOptions);
                                    }}
                                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-300 ${
                                      isSelected 
                                        ? 'border-green-500 bg-green-100' 
                                        : 'border-green-200 hover:bg-green-100'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className={`w-4 h-4 border-2 rounded-full transition-all duration-300 flex items-center justify-center ${
                                        isSelected 
                                          ? 'border-green-600 bg-green-600' 
                                          : 'border-green-300'
                                      }`}>
                                        {isSelected && (
                                          <div className="w-2 h-2 bg-white rounded-full"></div>
                                        )}
                                      </div>
                                      <span className="text-sm text-wedding-charcoal">{option}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Церемонія */}
                          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                            <h5 className="font-medium text-wedding-charcoal mb-1">Церемонія (входить в базову вартість):</h5>
                            <p className="text-xs text-gray-600 mb-3">Оберіть одне</p>
                            <div className="space-y-2">
                              {['ЗАГС', 'На території ресторану'].map((option) => {
                                const optionKey = `Церемонія - ${option}`;
                                const isSelected = selectedOptions.includes(optionKey);
                                
                                return (
                                  <div 
                                    key={optionKey}
                                    onClick={() => {
                                      const newOptions = selectedOptions.filter(o => !o.startsWith('Церемонія -'));
                                      if (!isSelected) {
                                        newOptions.push(optionKey);
                                      }
                                      setSelectedOptions(newOptions);
                                    }}
                                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-300 ${
                                      isSelected 
                                        ? 'border-green-500 bg-green-100' 
                                        : 'border-green-200 hover:bg-green-100'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className={`w-4 h-4 border-2 rounded-full transition-all duration-300 flex items-center justify-center ${
                                        isSelected 
                                          ? 'border-green-600 bg-green-600' 
                                          : 'border-green-300'
                                      }`}>
                                        {isSelected && (
                                          <div className="w-2 h-2 bg-white rounded-full"></div>
                                        )}
                                      </div>
                                      <span className="text-sm text-wedding-charcoal">{option}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Ресторан */}
                          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                            <h5 className="font-medium text-wedding-charcoal mb-1">Ресторан (входить в базову вартість):</h5>
                            <p className="text-xs text-gray-600 mb-3">Оберіть одне</p>
                            <div className="space-y-2">
                              {['До закінчення програми ведучого'].map((option) => {
                                const optionKey = `Ресторан - ${option}`;
                                const isSelected = selectedOptions.includes(optionKey);
                                
                                return (
                                  <div 
                                    key={optionKey}
                                    onClick={() => {
                                      const newOptions = selectedOptions.filter(o => !o.startsWith('Ресторан -'));
                                      if (!isSelected) {
                                        newOptions.push(optionKey);
                                      }
                                      setSelectedOptions(newOptions);
                                    }}
                                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-300 ${
                                      isSelected 
                                        ? 'border-green-500 bg-green-100' 
                                        : 'border-green-200 hover:bg-green-100'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className={`w-4 h-4 border-2 rounded-full transition-all duration-300 flex items-center justify-center ${
                                        isSelected 
                                          ? 'border-green-600 bg-green-600' 
                                          : 'border-green-300'
                                      }`}>
                                        {isSelected && (
                                          <div className="w-2 h-2 bg-white rounded-full"></div>
                                        )}
                                      </div>
                                      <span className="text-sm text-wedding-charcoal">{option}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>



                          {/* Love Story - Add-on */}
                          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium text-wedding-charcoal">Love Story</h5>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Доповнення</span>
                            </div>
                            <p className="text-xs text-gray-600 mb-3">
                              {selectedPackage === 'Комплексний пакет: Фото + Відео' 
                                ? 'Можна обрати декілька варіантів (необов\'язково)' 
                                : 'Оберіть варіант (необов\'язково)'}
                            </p>
                            <div className="space-y-2">
                              {selectedPackage === "Комплексний пакет: Фото + Відео" 
                                ? ['Відео', 'Фото'].map((option) => {
                                    const optionKey = `Love Story - ${option}`;
                                    const isSelected = selectedOptions.includes(optionKey);
                                    const packageData = packagePrices[selectedPackage as keyof typeof packagePrices];
                                    const price = packageData?.options?.[optionKey as keyof typeof packageData.options];
                                    
                                    return (
                                      <div 
                                        key={optionKey}
                                        onClick={() => {
                                          const newOptions = isSelected 
                                            ? selectedOptions.filter(o => o !== optionKey)
                                            : [...selectedOptions, optionKey];
                                          setSelectedOptions(newOptions);
                                        }}
                                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all duration-300 ${
                                          isSelected 
                                            ? 'border-green-500 bg-green-100' 
                                            : 'border-green-200 hover:bg-green-100'
                                        }`}
                                      >
                                        <div className="flex items-center space-x-3">
                                          <div className={`w-4 h-4 border-2 rounded transition-all duration-300 flex items-center justify-center ${
                                            isSelected 
                                              ? 'border-green-600 bg-green-600' 
                                              : 'border-green-300'
                                          }`}>
                                            {isSelected && (
                                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                              </svg>
                                            )}
                                          </div>
                                          <span className="text-sm text-wedding-charcoal">{option}</span>
                                        </div>
                                        <span className={`text-sm font-semibold ${isSelected ? 'text-green-700' : 'text-green-600'}`}>
                                          +${price}
                                        </span>
                                      </div>
                                    );
                                  })
                                : (
                                    // Single selection for Two-camera package (radio button behavior)
                                    (<div 
                                      onClick={() => {
                                        const optionKey = 'Love Story - Відео';
                                        const isSelected = selectedOptions.includes(optionKey);
                                        const newOptions = isSelected 
                                          ? selectedOptions.filter(opt => opt !== optionKey)
                                          : [...selectedOptions.filter(opt => !opt.startsWith('Love Story -')), optionKey];
                                        setSelectedOptions(newOptions);
                                      }}
                                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all duration-300 ${
                                        selectedOptions.includes('Love Story - Відео')
                                          ? 'border-green-500 bg-green-100' 
                                          : 'border-green-200 hover:bg-green-100'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-3">
                                        <div className={`w-4 h-4 border-2 rounded-full transition-all duration-300 flex items-center justify-center ${
                                          selectedOptions.includes('Love Story - Відео')
                                            ? 'border-green-600 bg-green-600' 
                                            : 'border-green-300'
                                        }`}>
                                          {selectedOptions.includes('Love Story - Відео') && (
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                          )}
                                        </div>
                                        <span className="text-sm text-wedding-charcoal">Відео</span>
                                      </div>
                                      <span className={`text-sm font-semibold ${selectedOptions.includes('Love Story - Відео') ? 'text-green-700' : 'text-green-600'}`}>
                                        +${packagePrices[selectedPackage as keyof typeof packagePrices]?.options?.['Love Story - Відео']}
                                      </span>
                                    </div>)
                                  )
                              }
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {form.formState.errors.services && (
                      <p className="text-red-500 text-sm mt-2">{form.formState.errors.services.message}</p>
                    )}

                    {/* Total Price Calculator */}
                    {calculateTotalPrice() > 0 && (
                      <div className="mt-4 p-4 bg-green-100 rounded-lg border-l-4 border-green-500 select-none">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-wedding-charcoal">
                            Загальна вартість:
                          </span>
                          <span className="text-lg font-bold text-green-600">
                            ${calculateTotalPrice()}
                          </span>
                        </div>
                        <p className="text-xs text-wedding-gray mt-1">
                          * Остаточна ціна може відрізнятися залежно від ваших побажань
                        </p>
                      </div>
                    )}

                    {/* File Upload Section - Mobile simplified */}
                    <div>
                      <label className="block text-sm font-medium text-wedding-charcoal mb-3 select-none">
                        Додаткові файли
                      </label>
                      <div className="border-2 border-dashed border-green-300 rounded-xl p-4 md:p-6 text-center hover:bg-green-50 transition-colors duration-300">
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*,.pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer select-none">
                          <Upload className="text-green-600 mx-auto mb-2" size={24} />
                          <p className="text-wedding-gray text-sm select-none">Натисніть для вибору файлів</p>
                        </label>
                      </div>

                      {files.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                              <span className="text-sm text-wedding-charcoal truncate">{file.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <X size={16} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-wedding-charcoal mb-2 select-none">
                        Додаткова інформація
                      </label>
                      <Textarea
                        {...form.register("additionalInfo")}
                        placeholder="Розкажіть більше про ваші побажання..."
                        rows={3}
                        className="transition-all duration-300 focus:ring-2 focus:ring-green-500 border-green-200 placeholder:select-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={submitContactForm.isPending}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl md:rounded-2xl font-medium transform hover:scale-105 transition-all duration-300 shadow-2xl"
                    >
                      {submitContactForm.isPending ? "Відправляємо..." : "Відправити заяву"}
                      <Send className="ml-2" size={18} />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Info - Mobile simplified */}
            <div className="slide-in-right">
              <div className="space-y-4 md:space-y-6">
                <Card className="p-4 md:p-6 rounded-xl md:rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-white to-green-50 cursor-pointer" onClick={() => window.location.href = 'tel:+380972056022'}>
                  <CardContent className="p-0">
                    <div className="flex items-center space-x-3 md:space-x-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-green-600 rounded-xl md:rounded-2xl flex items-center justify-center">
                        <Phone className="text-white" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-wedding-charcoal text-base md:text-lg">Телефон</h3>
                        <p className="text-wedding-gray hover:text-green-600 transition-colors text-sm md:text-base">+380 97 205 6022</p>
                        <p className="text-sm text-green-600 font-medium">9:00 - 21:00, щодня</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-4 md:p-6 rounded-xl md:rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-white to-green-50 cursor-pointer" onClick={() => window.open('https://www.instagram.com/kubenko_production_studio', '_blank')}>
                  <CardContent className="p-0">
                    <div className="flex items-center space-x-3 md:space-x-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-green-600 rounded-xl md:rounded-2xl flex items-center justify-center">
                        <Instagram className="text-white" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-wedding-charcoal text-base md:text-lg">Instagram</h3>
                        <p className="text-wedding-gray hover:text-green-600 transition-colors text-sm md:text-base">@kubenko_production_studio</p>
                        <p className="text-sm text-green-600 font-medium">99% всіх наших робіт</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-4 md:p-6 rounded-xl md:rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-white to-green-50 cursor-pointer" onClick={() => window.open('https://t.me/kub982', '_blank')}>
                  <CardContent className="p-0">
                    <div className="flex items-center space-x-3 md:space-x-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-green-600 rounded-xl md:rounded-2xl flex items-center justify-center">
                        <SiTelegram className="text-white" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-wedding-charcoal text-base md:text-lg">Telegram</h3>
                        <p className="text-wedding-gray hover:text-green-600 transition-colors text-sm md:text-base">@kub982</p>
                        <p className="text-sm text-green-600 font-medium">Швидкий зв'язок</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-4 md:p-6 rounded-xl md:rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-white to-green-50 cursor-pointer" onClick={() => window.location.href = 'viber://chat?number=%2B380972056022'}>
                  <CardContent className="p-0">
                    <div className="flex items-center space-x-3 md:space-x-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-green-600 rounded-xl md:rounded-2xl flex items-center justify-center">
                        <SiViber className="text-white" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-wedding-charcoal text-base md:text-lg">Viber</h3>
                        <p className="text-wedding-gray hover:text-green-600 transition-colors text-sm md:text-base">+380 97 205 6022</p>
                        <p className="text-sm text-green-600 font-medium">Зручне спілкування</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-4 md:p-6 rounded-xl md:rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-white to-green-50">
                  <CardContent className="p-0">
                    <div className="flex items-center space-x-3 md:space-x-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-green-600 rounded-xl md:rounded-2xl flex items-center justify-center">
                        <Location className="text-white" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-wedding-charcoal text-base md:text-lg">Локація</h3>
                        <p className="text-wedding-gray text-sm md:text-base">Київська область</p>
                        <p className="text-sm text-green-600 font-medium">Працюємо ТІЛЬКИ в Київській області</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Footer - Mobile simplified */}
      <footer className="bg-gray-900 text-white py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="slide-in-left text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
                <img src={logoPath} alt="Logo" className="w-8 h-8 md:w-10 md:h-10" />
                <span className="font-display font-semibold text-lg md:text-xl">Kubenko Production Studio</span>
              </div>
              <p className="text-gray-300 mb-4 leading-relaxed text-sm md:text-base">
                Професійна свадебна відеозйомка з 16-річним досвідом. Створюємо незабутні спогади для щасливих пар.
              </p>
              <div className="flex justify-center md:justify-start space-x-4">
                <div 
                  className="w-8 h-8 md:w-10 md:h-10 bg-green-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-pointer"
                  onClick={() => window.open('https://www.instagram.com/kubenko_production_studio/', '_blank')}
                >
                  <Instagram className="text-white" size={16} />
                </div>
                <div 
                  className="w-8 h-8 md:w-10 md:h-10 bg-green-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-pointer"
                  onClick={() => window.open('https://t.me/+380972056022', '_blank')}
                >
                  <SiTelegram className="text-white" size={16} />
                </div>
                <div 
                  className="w-8 h-8 md:w-10 md:h-10 bg-green-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-pointer"
                  onClick={() => window.open('viber://chat?number=%2B380972056022', '_blank')}
                >
                  <SiViber className="text-white" size={16} />
                </div>
              </div>
            </div>



            <div className="slide-in-right delay-400 text-center md:text-left">
              <h3 className="font-display text-base md:text-lg font-semibold mb-4">Контакти</h3>
              <div className="space-y-2 text-gray-300 text-sm md:text-base">
                <p className="flex items-center justify-center md:justify-start space-x-2">
                  <Phone size={14} />
                  <a 
                    href="tel:+380972056022" 
                    className="hover:text-green-400 transition-colors duration-300 cursor-pointer"
                  >
                    +380 97 205 6022
                  </a>
                </p>
                <p className="flex items-center justify-center md:justify-start space-x-2">
                  <MapPin size={14} />
                  <span>Київська область</span>
                </p>
                <p className="flex items-center justify-center md:justify-start space-x-2">
                  <Clock size={14} />
                  <span>9:00 - 21:00, щодня</span>
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-6 md:mt-8 pt-6 md:pt-8 text-center">
            <p className="text-gray-400 text-sm md:text-base">© 2025 Kubenko Production Studio. Всі права захищені.</p>
          </div>
        </div>
      </footer>
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
              {(() => {
                const hasPhotos = selectedPortfolioItem.photos && selectedPortfolioItem.photos.length > 0;
                const hasVideo = selectedPortfolioItem.videoUrl;
                const hasBothContent = hasPhotos && hasVideo;

                return (
                  <div className={`grid gap-6 ${hasBothContent ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-md mx-auto lg:max-w-lg'}`}>
                    {/* Photo Section */}
                    {hasPhotos && (
                      <div>
                        <h4 className="font-semibold text-wedding-charcoal mb-4 flex items-center">
                          <Camera className="w-5 h-5 mr-2 text-purple-600" />
                          Фото ({selectedPortfolioItem.photos.length})
                        </h4>
                        <Card 
                          className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
                          onClick={() => openImageViewer(0)}
                        >
                          <div className="relative group overflow-hidden">
                            <div className="aspect-[4/3] w-full">
                              <img
                                src={selectedPortfolioItem.photoThumbnail || (selectedPortfolioItem.photos[0] || '')}
                                alt={`${selectedPortfolioItem.categoryName} - фото превью`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                              <Camera className="text-white text-3xl md:text-4xl drop-shadow-lg group-hover:scale-125 transition-transform duration-300" />
                            </div>
                            <div className="absolute bottom-2 left-2 right-2">
                              <Button variant="secondary" size="sm" className="w-full text-xs bg-white/90 hover:bg-white">
                                Переглянути всі фото
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </div>
                    )}

                    {/* Video Section */}
                    {hasVideo && (
                      <div>
                        <h4 className="font-semibold text-wedding-charcoal mb-4 flex items-center">
                          <Play className="w-5 h-5 mr-2 text-blue-600" />
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
                  </div>
                );
              })()}

              {/* Show message if neither photo nor video available */}
              {(!selectedPortfolioItem.photos || selectedPortfolioItem.photos.length === 0) && !selectedPortfolioItem.videoUrl && (
                <div className="text-center py-8">
                  <Camera className="text-gray-400 text-4xl mb-3 mx-auto" />
                  <p className="text-gray-500">Контент ще не додано</p>
                </div>
              )}

              <div className="mt-6 text-center">
                <p className="text-sm text-wedding-gray">
                  Хочете такий же результат для вашого весілля?
                </p>
                <Button 
                  className="mt-3 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    setIsPortfolioModalOpen(false);
                    setTimeout(() => {
                      const contactSection = document.getElementById('contact');
                      if (contactSection) {
                        contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 100);
                  }}
                >
                  Замовити консультацію
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
                      onClick={() => navigateImage('prev')}
                      className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 z-40 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2 md:p-3"
                    >
                      <ChevronLeft size={24} className="md:w-8 md:h-8" />
                    </button>
                    <button
                      onClick={() => navigateImage('next')}
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
                    alt={`${selectedPortfolioItem.title} - фото ${selectedImageIndex + 1}`}
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