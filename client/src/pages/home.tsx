import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
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
import { insertContactSubmissionSchema, type InsertContactSubmission, type PortfolioItem } from "@shared/schema";
import logoPath from "@assets/Кружок copy_1749922259717.png";
import weddingHeroImage from "@assets/завантаження_1749993288302.png";
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
  MapPinIcon as Location
} from "lucide-react";
import { SiTelegram, SiViber } from "react-icons/si";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [portfolioFilter, setPortfolioFilter] = useState<'all' | 'video' | 'photo'>('all');
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<any>(null);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [weddingDate, setWeddingDate] = useState<Date>();
  const { toast } = useToast();

  // Service pricing
  const servicePrices: Record<string, number> = {
    "Повнометражний фільм": 16000,
    "Емоційний кліп": 8000,
    "Ранок нареченої": 4000,
    "Збори нареченого": 4000,
    "Фотопослуги": 6000,
    "Love Story": 5000
  };

  // Fetch portfolio items from API
  const { data: portfolioItems = [], isLoading: portfolioLoading } = useQuery<PortfolioItem[]>({
    queryKey: ["/api/portfolio"],
  });

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

    // Add form fields
    Object.entries(data).forEach(([key, value]) => {
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

    // Add total price
    formData.append('totalPrice', calculateTotalPrice().toString());

    submitContactForm.mutate(formData);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsMenuOpen(false);
  };

  const handleServiceChange = (service: string, checked: boolean) => {
    const currentServices = form.getValues("services") || [];
    if (checked) {
      form.setValue("services", [...currentServices, service], { shouldValidate: true });
    } else {
      form.setValue("services", currentServices.filter(s => s !== service), { shouldValidate: true });
    }
    // Trigger re-render to update price calculation
    form.trigger("services");
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

  // Calculate total price based on selected services
  const calculateTotalPrice = () => {
    const selectedServices = form.watch("services") || [];
    return selectedServices.reduce((total, service) => {
      return total + (servicePrices[service] || 0);
    }, 0);
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
              <button onClick={() => scrollToSection('services')} className="text-wedding-gray hover:text-green-600 transition-colors duration-300">Послуги</button>
              <button onClick={() => scrollToSection('portfolio')} className="text-wedding-gray hover:text-green-600 transition-colors duration-300">Портфоліо</button>
              <button onClick={() => scrollToSection('testimonials')} className="text-wedding-gray hover:text-green-600 transition-colors duration-300">Відгуки</button>
              <button onClick={() => scrollToSection('contact')} className="text-wedding-gray hover:text-green-600 transition-colors duration-300">Контакти</button>
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
                <button onClick={() => scrollToSection('services')} className="text-wedding-gray hover:text-green-600 transition-colors duration-300 text-left py-2">Послуги</button>
                <button onClick={() => scrollToSection('portfolio')} className="text-wedding-gray hover:text-green-600 transition-colors duration-300 text-left py-2">Портфоліо</button>
                <button onClick={() => scrollToSection('testimonials')} className="text-wedding-gray hover:text-green-600 transition-colors duration-300 text-left py-2">Відгуки</button>
                <button onClick={() => scrollToSection('contact')} className="text-wedding-gray hover:text-green-600 transition-colors duration-300 text-left py-2">Контакти</button>
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
              <div className="text-white drop-shadow font-medium text-xs md:text-base">задоволення</div>
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
              <p className="text-base md:text-lg text-wedding-gray mb-4 md:mb-6 leading-relaxed">
                Ми любимо свою справу і підходимо з душею до кожної пари. Наша мета — зберегти у відео справжні емоції та атмосферу вашого свята.
              </p>
              <p className="text-base md:text-lg text-wedding-gray mb-6 md:mb-8 leading-relaxed">
                У нашій команді працюють Руслан — засновник і головний відеограф, та помічниця Олена.
              </p>

              <div className="grid grid-cols-2 gap-4 md:gap-6">
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
      {/* Services Section */}
      <section id="services" className="py-10 md:py-20 bg-gradient-to-br from-green-50 to-wedding-cream">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-6 md:mb-16 slide-in-top">
            <h2 className="font-display text-xl md:text-4xl lg:text-5xl font-bold text-wedding-charcoal mb-2 md:mb-4">
              Наші <span className="text-green-600">послуги</span>
            </h2>
            <p className="hidden md:block text-base md:text-lg text-wedding-gray max-w-2xl mx-auto">
              Повний спектр послуг для створення ідеального весільного відео
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
            {[
              { icon: Film, title: "Повнометражний фільм", description: "Детальний фільм про ваш весільний день з усіма важливими моментами", delay: "delay-100" },
              { icon: Heart, title: "Емоційний кліп", description: "Короткий кліп з найяскравішими та найемоційнішими моментами дня", delay: "delay-200" },
              { icon: Clock, title: "Гнучкий підхід", description: "Повний день, частина дня або кілька днів — обираємо формат під ваші потреби", delay: "delay-300" },
              { icon: Sun, title: "Ранок нареченої", description: "Зйомка підготовки нареченої та збори нареченого", delay: "delay-400" },
              { icon: Camera, title: "Фотопослуги", description: "Професійна фотозйомка як доповнення до відеозйомки", delay: "delay-500" },
              { icon: Shield, title: "Безпека перш за все", description: "Не використовуємо дрони з міркувань безпеки в Україні", delay: "delay-600" },
            ].map((service, index) => (
              <Card key={index} className={`bg-white p-3 md:p-8 rounded-lg md:rounded-2xl shadow-md md:shadow-xl hover:shadow-lg md:hover:shadow-2xl transition-all duration-500 transform hover:scale-105 slide-in-bottom ${service.delay}`}>
                <CardContent className="p-0">
                  <div className="w-10 h-10 md:w-16 md:h-16 bg-green-600 rounded-lg md:rounded-2xl flex items-center justify-center mb-3 md:mb-6 transform hover:rotate-6 transition-transform duration-300">
                    <service.icon className="text-white w-5 h-5 md:w-8 md:h-8" />
                  </div>
                  <h3 className="font-display text-sm md:text-xl font-semibold text-wedding-charcoal mb-2 md:mb-4">{service.title}</h3>
                  <p className="text-wedding-gray leading-relaxed text-xs md:text-base">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* Portfolio Section */}
      <section id="portfolio" className="py-10 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-6 md:mb-16 slide-in-top">
            <h2 className="font-display text-xl md:text-4xl lg:text-5xl font-bold text-wedding-charcoal mb-2 md:mb-4">
              Наше <span className="text-green-600">портфоліо</span>
            </h2>
            <p className="hidden md:block text-base md:text-lg text-wedding-gray max-w-2xl mx-auto mb-4">
              Перегляньте приклади наших робіт та переконайтеся в якості наших послуг
            </p>

            {/* Filter buttons */}
            <div className="flex justify-center gap-2 md:gap-4 mb-6">
              <Button
                variant={portfolioFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setPortfolioFilter('all')}
                className="text-xs md:text-sm px-3 md:px-4 py-1 md:py-2"
              >
                Всі
              </Button>
              <Button
                variant={portfolioFilter === 'video' ? 'default' : 'outline'}
                onClick={() => setPortfolioFilter('video')}
                className="text-xs md:text-sm px-3 md:px-4 py-1 md:py-2"
              >
                Відео
              </Button>
              <Button
                variant={portfolioFilter === 'photo' ? 'default' : 'outline'}
                onClick={() => setPortfolioFilter('photo')}
                className="text-xs md:text-sm px-3 md:px-4 py-1 md:py-2"
              >
                Фото
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-8">
            {portfolioItems
            .filter(item => portfolioFilter === 'all' || item.type === portfolioFilter)
            .slice(0, 3)
            .map((item, index) => (
              <Card 
                key={item.id} 
                className={`bg-gradient-to-br from-green-50 to-white rounded-lg md:rounded-2xl overflow-hidden shadow-md md:shadow-xl hover:shadow-lg md:hover:shadow-2xl transition-all duration-500 transform hover:scale-105 slide-in-bottom delay-${(index + 1) * 100} cursor-pointer`}
                onClick={() => openPortfolioItem(item)}
              >
                <div className="relative h-24 md:h-48 group overflow-hidden">
                  {item.thumbnail ? (
                    <>
                      <img
                        src={item.thumbnail}
                        alt={`${item.title} - превью`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                        {item.type === 'video' ? (
                          <Play className="text-white text-xl md:text-5xl drop-shadow-lg group-hover:scale-125 transition-transform duration-300" size={24} />
                        ) : (
                          <Camera className="text-white text-xl md:text-5xl drop-shadow-lg group-hover:scale-125 transition-transform duration-300" size={24} />
                        )}
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white font-semibold text-xs md:text-sm drop-shadow-lg">{item.category}</p>
                        <p className="hidden md:block text-white/90 text-xs drop-shadow-lg">({item.couple})</p>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-green-50 group relative">
                      <div className="text-center z-10">
                        {item.type === 'video' ? (
                          <Play className="text-green-600 text-xl md:text-5xl mb-1 md:mb-3 mx-auto group-hover:scale-125 transition-transform duration-300" size={24} />
                        ) : (
                          <Camera className="text-green-600 text-xl md:text-5xl mb-1 md:mb-3 mx-auto group-hover:scale-125 transition-transform duration-300" size={24} />
                        )}
                        <p className="text-wedding-charcoal font-semibold text-xs md:text-base">{item.category}</p>
                        <p className="hidden md:block text-xs md:text-sm text-wedding-gray">({item.couple})</p>
                      </div>
                      <div className="absolute inset-0 bg-green-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                    </div>
                  )}
                </div>
                <CardContent className="p-2 md:p-6">
                  <h3 className="font-display text-sm md:text-lg font-semibold text-wedding-charcoal mb-1 md:mb-2">{item.title}</h3>
                  <p className="hidden md:block text-wedding-gray text-sm leading-relaxed">{item.description}</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              { title: "Ваше звернення", description: "Зв'яжіться з нами зручним способом - через форму, телефон або соцмережі", icon: MessageCircle, delay: "delay-100" },
              { title: "Обговорення деталей", description: "Детально обговорюємо ваші побажання, дату, локацію та формат зйомки", icon: Users, delay: "delay-200" },
              { title: "Підписання договору", description: "Оформляємо всі умови в договорі для вашого спокою", icon: FileText, delay: "delay-300" },
              { title: "День зйомки", description: "Професійно знімаємо ваше весілля, не заважаючи насолоджуватись днем", icon: Video, delay: "delay-400" },
              { title: "Монтаж відео", description: "Створюємо емоційний фільм з вашими найкращими моментами", icon: Film, delay: "delay-500" },
              { title: "Готове відео", description: "Отримуєте готовий фільм у високій якості для зберігання спогадів", icon: Gift, delay: "delay-600" },
            ].map((item, index) => (
              <div key={index} className={`parallax-slide ${item.delay} relative`}>
                {/* Mobile card design */}
                <Card className={`md:hidden bg-white p-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-500 transform hover:scale-105 slide-in-bottom`}>
                  <CardContent className="p-0">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mb-3 transform hover:rotate-6 transition-transform duration-300">
                      <item.icon className="text-white" size={20} />
                    </div>
                    <h3 className="font-display text-sm font-semibold text-wedding-charcoal mb-2">{item.title}</h3>
                    <p className="text-wedding-gray leading-relaxed text-xs">{item.description}</p>
                  </CardContent>
                </Card>

                {/* Desktop design */}
                <div className="hidden md:block text-center">
                  <div className="relative mb-4 md:mb-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-green-600 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 transform hover:rotate-6 transition-transform duration-300 shadow-lg md:shadow-xl">
                      <item.icon className="text-white" size={28} />
                    </div>
                    {/* Desktop horizontal arrow */}
                    {index < 5 && (
                      <div className="absolute top-8 md:top-10 left-1/2 transform translate-x-10 md:translate-x-12 hidden lg:block">
                        <ArrowRight className="text-green-400" size={28} />
                      </div>
                    )}
                  </div>
                  <h3 className="font-display text-lg md:text-xl font-semibold text-wedding-charcoal mb-2 md:mb-3">{item.title}</h3>
                  <p className="text-wedding-gray leading-relaxed text-sm md:text-base">{item.description}</p>
                </div>

                {/* Mobile arrow */}
                {index < 5 && (
                  <div className="md:hidden flex justify-center mt-3">
                    <ArrowRight className="text-green-400 rotate-90" size={20} />
                  </div>
                )}
              </div>
            ))}
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
                onClick={() => window.open('https://www.instagram.com/kubenko_production_studio', '_blank')}
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
                        <label className="block text-sm font-medium text-wedding-charcoal mb-2">
                          Ім'я нареченої *
                        </label>
                        <Input
                          {...form.register("brideName")}
                          placeholder="Анна"
                          className="transition-all duration-300 focus:ring-2 focus:ring-green-500 border-green-200"
                        />
                        {form.formState.errors.brideName && (
                          <p className="text-red-500 text-sm mt-1">{form.formState.errors.brideName.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-wedding-charcoal mb-2">
                          Ім'я нареченого *
                        </label>
                        <Input
                          {...form.register("groomName")}
                          placeholder="Олексій"
                          className="transition-all duration-300 focus:ring-2 focus:ring-green-500 border-green-200"
                        />
                        {form.formState.errors.groomName && (
                          <p className="text-red-500 text-sm mt-1">{form.formState.errors.groomName.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-wedding-charcoal mb-2">
                          Телефон *
                        </label>
                        <Input
                          {...form.register("phone")}
                          placeholder="+380 XX XXX XX XX"
                          type="tel"
                          className="transition-all duration-300 focus:ring-2 focus:ring-green-500 border-green-200"
                        />
                        {form.formState.errors.phone && (
                          <p className="text-red-500 text-sm mt-1">{form.formState.errors.phone.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-wedding-charcoal mb-2">
                          Email *
                        </label>
                        <Input
                          {...form.register("email")}
                          placeholder="your@email.com"
                          type="email"
                          className="transition-all duration-300 focus:ring-2 focus:ring-green-500 border-green-200"
                        />
                        {form.formState.errors.email && (
                          <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-wedding-charcoal mb-2">
                          Дата весілля *
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal transition-all duration-300 focus:ring-2 focus:ring-green-500 border-green-200 hover:bg-green-50"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              <span className={weddingDate ? "text-foreground" : "text-muted-foreground"}>
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
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        {form.formState.errors.weddingDate && (
                          <p className="text-red-500 text-sm mt-1">{form.formState.errors.weddingDate.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-wedding-charcoal mb-2">
                          Локація весілля *
                        </label>
                        <Input
                          {...form.register("location")}
                          placeholder="Київ, ресторан..."
                          className="transition-all duration-300 focus:ring-2 focus:ring-green-500 border-green-200"
                        />
                        {form.formState.errors.location && (
                          <p className="text-red-500 text-sm mt-1">{form.formState.errors.location.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-wedding-charcoal mb-3">
                        Які послуги вас цікавлять? *
                      </label>
                      <div className="grid grid-cols-1 gap-3">
                        {Object.entries(servicePrices).map(([service, price]) => (
                          <div key={service} className="flex items-center justify-between p-3 border border-green-200 rounded-lg hover:bg-green-50 transition-colors">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id={service}
                                onCheckedChange={(checked) => handleServiceChange(service, checked as boolean)}
                                className="transition-all duration-300 border-green-300 data-[state=checked]:bg-green-600"
                              />
                              <label htmlFor={service} className="text-sm text-wedding-gray cursor-pointer">
                                {service}
                              </label>
                            </div>
                            <div className="text-sm font-semibold text-green-600">
                              {price.toLocaleString()} грн
                            </div>
                          </div>
                        ))}
                      </div>
                      {form.formState.errors.services && (
                        <p className="text-red-500 text-sm mt-2">{form.formState.errors.services.message}</p>
                      )}

                      {/* Total Price Calculator */}
                      {calculateTotalPrice() > 0 && (
                        <div className="mt-4 p-4 bg-green-100 rounded-lg border-l-4 border-green-500">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-wedding-charcoal">
                              Загальна вартість:
                            </span>
                            <span className="text-lg font-bold text-green-600">
                              {calculateTotalPrice().toLocaleString()} грн
                            </span>
                          </div>
                          <p className="text-xs text-wedding-gray mt-1">
                            * Остаточна ціна може відрізнятися залежно від ваших побажань
                          </p>
                        </div>
                      )}
                    </div>

                    {/* File Upload Section - Mobile simplified */}
                    <div>
                      <label className="block text-sm font-medium text-wedding-charcoal mb-3">
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
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <Upload className="text-green-600 mx-auto mb-2" size={24} />
                          <p className="text-wedding-gray text-sm">Натисніть для вибору файлів</p>
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
                      <label className="block text-sm font-medium text-wedding-charcoal mb-2">
                        Додаткова інформація
                      </label>
                      <Textarea
                        {...form.register("additionalInfo")}
                        placeholder="Розкажіть більше про ваші побажання..."
                        rows={3}
                        className="transition-all duration-300 focus:ring-2 focus:ring-green-500 border-green-200"
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
                <div className="w-8 h-8 md:w-10 md:h-10 bg-green-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-pointer">
                  <Instagram className="text-white" size={16} />
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 bg-green-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-pointer">
                  <SiTelegram className="text-white" size={16} />
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 bg-green-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-pointer">
                  <SiViber className="text-white" size={16} />
                </div>
              </div>
            </div>

            <div className="slide-in-bottom delay-200 text-center md:text-left">
              <h3 className="font-display text-base md:text-lg font-semibold mb-4">Послуги</h3>
              <ul className="space-y-2 text-gray-300 text-sm md:text-base">
                <li className="hover:text-green-400 transition-colors duration-300 cursor-pointer">Повнометражний фільм</li>
                <li className="hover:text-green-400 transition-colors duration-300 cursor-pointer">Емоційний кліп</li>
                <li className="hover:text-green-400 transition-colors duration-300 cursor-pointer">Ранок нареченої</li>
                <li className="hover:text-green-400 transition-colors duration-300 cursor-pointer">Фотопослуги</li>
                <li className="hover:text-green-400 transition-colors duration-300 cursor-pointer">Love Story</li>
              </ul>
            </div>

            <div className="slide-in-right delay-400 text-center md:text-left">
              <h3 className="font-display text-base md:text-lg font-semibold mb-4">Контакти</h3>
              <div className="space-y-2 text-gray-300 text-sm md:text-base">
                <p className="flex items-center justify-center md:justify-start space-x-2">
                  <Phone size={14} />
                  <span>+380 97 205 6022</span>
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
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-bold text-wedding-charcoal">
              {selectedPortfolioItem?.category} ({selectedPortfolioItem?.couple})
            </DialogTitle>
            <DialogDescription>
              Переглянути повну роботу з портфоліо
            </DialogDescription>
          </DialogHeader>

          {selectedPortfolioItem && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2 text-wedding-charcoal">
                {selectedPortfolioItem.title}
              </h3>
              <p className="text-wedding-gray mb-4">
                {selectedPortfolioItem.description}
              </p>

              {selectedPortfolioItem.type === 'video' ? (
                // Video player
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
                // Photo gallery
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
        <DialogContent className="max-w-5xl w-full h-[90vh] bg-black/95 border-none p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Перегляд фотографії</DialogTitle>
            <DialogDescription>Повноекранний перегляд фотографії з портфоліо</DialogDescription>
          </DialogHeader>
          <div className="relative w-full h-full flex items-center justify-center">
            {selectedPortfolioItem?.photos && selectedImageIndex !== null && (
              <>
                {/* Close button */}
                <button
                  onClick={closeImageViewer}
                  className="absolute top-4 right-4 z-50 text-white hover:text-gray-300 transition-colors"
                >
                  <X size={32} />
                </button>

                {/* Navigation buttons */}
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

                {/* Main image */}
                <img
                  src={selectedPortfolioItem.photos[selectedImageIndex]}
                  alt={`${selectedPortfolioItem.title} - фото ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />

                {/* Image counter */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black/50 rounded-full px-4 py-2">
                  {selectedImageIndex + 1} / {selectedPortfolioItem.photos.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}