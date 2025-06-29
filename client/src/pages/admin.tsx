import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertPortfolioItemSchema, insertBookedDateSchema, type InsertPortfolioItem, type PortfolioItem, type BookedDate, type InsertBookedDate } from "@shared/schema";
import { CategoryPortfolioForm } from "@/components/CategoryPortfolioForm";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

import { 
  Plus, 
  Edit, 
  Trash2,
  Upload,
  X,
  LogOut, 
  Video, 
  Image, 
  Eye, 
  EyeOff,
  ArrowUp,
  ArrowDown,
  CalendarIcon,
  Calendar as CalendarIconLucide
} from "lucide-react";

interface AdminUser {
  id: number;
  username: string;
  email: string;
}

interface AuthResponse {
  authenticated: boolean;
  admin?: AdminUser;
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [isBookedDateModalOpen, setIsBookedDateModalOpen] = useState(false);
  const [selectedBookingDate, setSelectedBookingDate] = useState<Date>();
  const [activeTab, setActiveTab] = useState<'portfolio' | 'calendar'>('portfolio');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check admin authentication with better error handling
  const { data: authData, isLoading: authLoading, error: authError } = useQuery<AuthResponse>({
    queryKey: ["/api/admin/check"],
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 30000, // 30 seconds
  });

  // Comprehensive authentication check and redirect
  useEffect(() => {
    const isAuthenticated = authData?.authenticated === true;
    const hasAuthData = !authLoading && authData !== undefined;
    
    if (hasAuthData && !isAuthenticated) {
      // Clear any cached data and redirect to login
      queryClient.clear();
      setLocation("/admin");
      toast({
        title: "Доступ заборонено",
        description: "Необхідно увійти в систему",
        variant: "destructive",
      });
    }
  }, [authData, authLoading, setLocation, queryClient, toast]);

  // Fetch portfolio items
  const { data: portfolioItems = [], isLoading: portfolioLoading } = useQuery<PortfolioItem[]>({
    queryKey: ["/api/admin/portfolio"],
    enabled: authData?.authenticated,
  });

  // Fetch booked dates
  const { data: bookedDates = [], isLoading: bookedDatesLoading } = useQuery<BookedDate[]>({
    queryKey: ["/api/booked-dates"],
    enabled: authData?.authenticated,
  });

  // Create form
  const createForm = useForm<InsertPortfolioItem>({
    resolver: zodResolver(insertPortfolioItemSchema),
    defaultValues: {
      categoryName: "",
      categoryPreview: "",
      photoThumbnail: "",
      photos: [],
      videoThumbnail: "",
      videoUrl: "",
      isPublished: true,
      orderIndex: 0,
    },
  });

  // Edit form
  const editForm = useForm<InsertPortfolioItem>({
    resolver: zodResolver(insertPortfolioItemSchema),
    defaultValues: {
      categoryName: "",
      categoryPreview: "",
      photoThumbnail: "",
      photos: [],
      videoThumbnail: "",
      videoUrl: "",
      isPublished: true,
      orderIndex: 0,
    },
  });

  // Booked date form
  const bookedDateForm = useForm<InsertBookedDate>({
    resolver: zodResolver(insertBookedDateSchema),
    defaultValues: {
      date: "",
      description: "",
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: InsertPortfolioItem) => {
      const response = await fetch("/api/admin/portfolio", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Помилка створення");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      setIsCreateModalOpen(false);
      createForm.reset();
      toast({ title: "Успішно", description: "Елемент портфоліо створено" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Помилка", 
        description: error.message || "Не вдалося створити елемент",
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertPortfolioItem> }) => {
      const response = await fetch(`/api/admin/portfolio/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Помилка оновлення");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      setIsEditModalOpen(false);
      setEditingItem(null);
      editForm.reset();
      toast({ title: "Успішно", description: "Елемент портфоліо оновлено" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Помилка", 
        description: error.message || "Не вдалося оновити елемент",
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/portfolio/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Помилка видалення");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({ title: "Успішно", description: "Елемент портфоліо видалено" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Помилка", 
        description: error.message || "Не вдалося видалити елемент",
        variant: "destructive" 
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Помилка виходу");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/check"] });
      setLocation("/");
      toast({ title: "Успішно", description: "Ви вийшли з системи" });
    },
  });

  // Booked dates mutations
  const createBookedDateMutation = useMutation({
    mutationFn: async (data: InsertBookedDate) => {
      const response = await fetch("/api/admin/booked-dates", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Помилка додавання зайнятої дати");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/booked-dates"] });
      setIsBookedDateModalOpen(false);
      bookedDateForm.reset();
      setSelectedBookingDate(undefined);
      toast({ title: "Успішно", description: "Зайняту дату додано" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Помилка", 
        description: error.message || "Не вдалося додати зайняту дату",
        variant: "destructive" 
      });
    },
  });

  const deleteBookedDateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/booked-dates/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Помилка видалення");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/booked-dates"] });
      toast({ title: "Успішно", description: "Зайняту дату видалено" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Помилка", 
        description: error.message || "Не вдалося видалити зайняту дату",
        variant: "destructive" 
      });
    },
  });

  const onCreateSubmit = (data: InsertPortfolioItem) => {
    console.log("Form data before processing:", data);
    
    // Calculate next order index automatically
    const maxOrderIndex = portfolioItems.reduce((max, item) => 
      Math.max(max, item.orderIndex || 0), 0
    );
    const nextOrderIndex = maxOrderIndex + 1;
    
    const processedData = {
      ...data,
      orderIndex: nextOrderIndex,
    };
    console.log("Processed data for API:", processedData);
    createMutation.mutate(processedData);
  };

  const onEditSubmit = (data: InsertPortfolioItem) => {
    if (!editingItem) return;
    updateMutation.mutate({ id: editingItem.id, data });
  };

  const handleEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    editForm.reset({
      categoryName: item.categoryName,
      categoryPreview: item.categoryPreview || "",
      photoThumbnail: item.photoThumbnail || "",
      photos: item.photos || [],
      videoThumbnail: item.videoThumbnail || "",
      videoUrl: item.videoUrl || "",
      isPublished: item.isPublished ?? true,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цей елемент?")) {
      deleteMutation.mutate(id);
    }
  };

  // Booked dates handlers
  const onBookedDateSubmit = (data: InsertBookedDate) => {
    createBookedDateMutation.mutate(data);
  };

  const handleDeleteBookedDate = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цю зайняту дату?")) {
      deleteBookedDateMutation.mutate(id);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Перевірка авторизації...</p>
        </div>
      </div>
    );
  }

  // Don't render admin panel if not authenticated
  if (!authData?.authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Перенаправлення...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile optimized */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 sm:py-0 sm:h-16 gap-3 sm:gap-0">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                Адмін панель
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                {authData.admin?.username}
              </p>
            </div>
            <div className="flex items-center w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="text-xs sm:text-sm w-full sm:w-auto"
              >
                {logoutMutation.isPending ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></span>
                ) : (
                  <>
                    <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Вийти
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile optimized */}
      <main className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-8">
        {/* Tabs Navigation */}
        <div className="mb-6 md:mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'portfolio'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Video className="w-4 h-4 inline mr-2" />
                Портфоліо
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'calendar'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CalendarIconLucide className="w-4 h-4 inline mr-2" />
                Календар
              </button>
            </nav>
          </div>
        </div>

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <>
            {/* Actions Bar - Mobile stacked */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-3 sm:gap-0">
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Портфоліо
                </h2>
                <p className="text-sm text-gray-600">
                  Всього: {portfolioItems.length}
                </p>
              </div>
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Додати елемент</span>
                <span className="sm:hidden">Додати</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] overflow-y-auto mx-2">
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg">Створити елемент</DialogTitle>
              </DialogHeader>
              <CategoryPortfolioForm
                form={createForm}
                onSubmit={onCreateSubmit}
                isSubmitting={createMutation.isPending}
                submitButtonText="Створити"
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Portfolio Items Grid - Mobile optimized */}
        {portfolioLoading ? (
          <div className="text-center py-8 md:py-12">
            <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-3 md:mt-4 text-sm md:text-base text-gray-600">Завантаження...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {portfolioItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1 md:space-x-2 min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        {item.photos && item.photos.length > 0 && (
                          <Image className="w-4 h-4 md:w-5 md:h-5 text-purple-500 flex-shrink-0" />
                        )}
                        {item.videoUrl && (
                          <Video className="w-4 h-4 md:w-5 md:h-5 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-xs md:text-sm font-medium text-gray-600 truncate">
                        Категорія
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {item.isPublished ? (
                        <Eye className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                      ) : (
                        <EyeOff className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                      )}
                      <span className="text-xs text-gray-500">
                        #{item.orderIndex}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="text-sm md:text-lg leading-tight line-clamp-2">
                    {item.categoryName}
                  </CardTitle>
                  <p className="text-xs md:text-sm text-gray-600 truncate">
                    {item.photos && item.photos.length > 0 && `${item.photos.length} фото`}
                    {item.photos && item.photos.length > 0 && item.videoUrl && " • "}
                    {item.videoUrl && "Відео"}
                  </p>
                </CardHeader>
                <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
                  <div className="mb-3 md:mb-4">
                    {item.photoThumbnail && (
                      <img 
                        src={item.photoThumbnail} 
                        alt="Превью фото" 
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                    )}
                    {item.videoThumbnail && (
                      <img 
                        src={item.videoThumbnail} 
                        alt="Превью відео" 
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                    <div className="flex space-x-1 md:space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                        className="h-7 md:h-8 px-2 md:px-3"
                      >
                        <Edit className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="ml-1 text-xs md:text-sm hidden sm:inline">Змінити</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-700 h-7 md:h-8 px-2 md:px-3"
                      >
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="ml-1 text-xs md:text-sm hidden sm:inline">Видалити</span>
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500 self-end sm:self-auto">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Modal - Mobile optimized */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] overflow-y-auto mx-2">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Редагувати елемент</DialogTitle>
            </DialogHeader>
            <CategoryPortfolioForm
              form={editForm}
              onSubmit={onEditSubmit}
              isSubmitting={updateMutation.isPending}
              submitButtonText="Оновити"
            />
          </DialogContent>
        </Dialog>
          </>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Управління календарем
              </h2>
              <Dialog open={isBookedDateModalOpen} onOpenChange={setIsBookedDateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Додати зайняту дату
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md">
                  <DialogHeader>
                    <DialogTitle>Додати зайняту дату</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={bookedDateForm.handleSubmit(onBookedDateSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Дата *
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedBookingDate ? format(selectedBookingDate, "dd.MM.yyyy") : "Оберіть дату"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={selectedBookingDate}
                            onSelect={(date) => {
                              setSelectedBookingDate(date);
                              if (date) {
                                bookedDateForm.setValue("date", format(date, "yyyy-MM-dd"));
                              }
                            }}
                            disabled={(date) => date < new Date()}
                            locale={uk}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {bookedDateForm.formState.errors.date && (
                        <p className="text-red-500 text-sm mt-1">{bookedDateForm.formState.errors.date.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Опис (необов'язково)
                      </label>
                      <Input
                        {...bookedDateForm.register("description")}
                        placeholder="Весілля Анни та Олексія"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsBookedDateModalOpen(false)}
                      >
                        Скасувати
                      </Button>
                      <Button
                        type="submit"
                        disabled={createBookedDateMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {createBookedDateMutation.isPending ? "Додавання..." : "Додати"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Booked Dates List */}
            {bookedDatesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Завантаження зайнятих дат...</p>
              </div>
            ) : bookedDates.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <CalendarIconLucide className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Немає зайнятих дат</h3>
                <p className="text-gray-600">Додайте зайняті дати для відображення на сайті</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookedDates.map((bookedDate) => (
                  <Card key={bookedDate.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {format(new Date(bookedDate.date), "dd.MM.yyyy")}
                        </h3>
                        {bookedDate.description && (
                          <p className="text-sm text-gray-600">{bookedDate.description}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Створено: {format(new Date(bookedDate.createdAt), "dd.MM.yyyy")}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBookedDate(bookedDate.id)}
                        disabled={deleteBookedDateMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
