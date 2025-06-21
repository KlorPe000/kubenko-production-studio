import { useState, useEffect } from "react";
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
import { insertPortfolioItemSchema, type InsertPortfolioItem, type PortfolioItem } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Plus, 
  Edit, 
  Trash2, 
  LogOut, 
  Video, 
  Image, 
  Eye, 
  EyeOff,
  ArrowUp,
  ArrowDown
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check admin authentication
  const { data: authData, isLoading: authLoading } = useQuery<AuthResponse>({
    queryKey: ["/api/admin/check"],
    retry: false,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && (!authData || !authData.authenticated)) {
      setLocation("/admin/login");
    }
  }, [authData, authLoading, setLocation]);

  // Fetch portfolio items
  const { data: portfolioItems = [], isLoading: portfolioLoading } = useQuery<PortfolioItem[]>({
    queryKey: ["/api/admin/portfolio"],
    enabled: authData?.authenticated,
  });

  // Create form
  const createForm = useForm<InsertPortfolioItem>({
    resolver: zodResolver(insertPortfolioItemSchema),
    defaultValues: {
      type: "video",
      category: "",
      couple: "",
      title: "",
      description: "",
      videoUrl: "",
      thumbnail: "",
      photos: [],
      isPublished: true,
      orderIndex: 0,
    },
  });

  // Edit form
  const editForm = useForm<InsertPortfolioItem>({
    resolver: zodResolver(insertPortfolioItemSchema),
    defaultValues: {
      type: "video",
      category: "",
      couple: "",
      title: "",
      description: "",
      videoUrl: "",
      thumbnail: "",
      photos: [],
      isPublished: true,
      orderIndex: 0,
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
      setLocation("/admin/login");
      toast({ title: "Успішно", description: "Ви вийшли з системи" });
    },
  });

  const onCreateSubmit = (data: InsertPortfolioItem) => {
    console.log("Form data before processing:", data);
    const processedData = {
      ...data,
      photos: data.type === "photo" && data.photos?.length ? data.photos : undefined,
      videoUrl: data.type === "video" && data.videoUrl ? data.videoUrl : undefined,
      thumbnail: data.thumbnail || undefined,
    };
    console.log("Processed data for API:", processedData);
    createMutation.mutate(processedData);
  };

  const onEditSubmit = (data: InsertPortfolioItem) => {
    if (!editingItem) return;
    const processedData = {
      ...data,
      photos: data.type === "photo" && data.photos?.length ? data.photos : undefined,
      videoUrl: data.type === "video" ? data.videoUrl : undefined,
    };
    updateMutation.mutate({ id: editingItem.id, data: processedData });
  };

  const handleEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    editForm.reset({
      type: item.type as "video" | "photo",
      category: item.category,
      couple: item.couple,
      title: item.title,
      description: item.description,
      videoUrl: item.videoUrl || "",
      thumbnail: item.thumbnail || "",
      photos: item.photos || [],
      isPublished: item.isPublished ?? true,
      orderIndex: item.orderIndex ?? 0,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цей елемент?")) {
      deleteMutation.mutate(id);
    }
  };

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

  if (!authData?.authenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Адміністрування Портфоліо
              </h1>
              <p className="text-sm text-gray-500">
                Вітаємо, {authData.admin?.username}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                className="text-sm"
              >
                Переглянути сайт
              </Button>
              <Button
                variant="outline"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="text-sm"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Вийти
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Управління портфоліо
            </h2>
            <p className="text-gray-600">
              Всього елементів: {portfolioItems.length}
            </p>
          </div>
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Додати елемент
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Створити новий елемент портфоліо</DialogTitle>
              </DialogHeader>
              <PortfolioForm
                form={createForm}
                onSubmit={onCreateSubmit}
                isSubmitting={createMutation.isPending}
                submitButtonText="Створити"
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Portfolio Items Grid */}
        {portfolioLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Завантаження портфоліо...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {item.type === "video" ? (
                        <Video className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Image className="w-5 h-5 text-purple-500" />
                      )}
                      <span className="text-sm font-medium text-gray-600">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {item.isPublished ? (
                        <Eye className="w-4 h-4 text-green-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-xs text-gray-500">
                        #{item.orderIndex}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="text-lg leading-tight">
                    {item.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{item.couple}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                    {item.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Редагувати елемент портфоліо</DialogTitle>
            </DialogHeader>
            <PortfolioForm
              form={editForm}
              onSubmit={onEditSubmit}
              isSubmitting={updateMutation.isPending}
              submitButtonText="Оновити"
            />
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

// Portfolio Form Component
interface PortfolioFormProps {
  form: any;
  onSubmit: (data: InsertPortfolioItem) => void;
  isSubmitting: boolean;
  submitButtonText: string;
}

function PortfolioForm({ form, onSubmit, isSubmitting, submitButtonText }: PortfolioFormProps) {
  const watchType = form.watch("type");

  const handleSubmit = (data: InsertPortfolioItem) => {
    console.log("Form submission data:", data);
    console.log("Form errors:", form.formState.errors);
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Тип</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть тип" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="video">Відео</SelectItem>
                    <SelectItem value="photo">Фото</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Категорія</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Весільний кліп" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="couple"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Пара</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Анна та Олексій" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="orderIndex"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Порядок</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Заголовок</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Романтична історія кохання" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Опис</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Емоційний кліп з найяскравішими моментами весільного дня"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchType === "video" && (
          <FormField
            control={form.control}
            name="videoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL відео</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://www.youtube.com/embed/..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="thumbnail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL превью</FormLabel>
              <FormControl>
                <Input {...field} placeholder="https://example.com/image.jpg" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchType === "photo" && (
          <FormField
            control={form.control}
            name="photos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URLs фото (по одному на рядок)</FormLabel>
                <FormControl>
                  <Textarea
                    value={field.value?.join('\n') || ''}
                    onChange={(e) => {
                      const urls = e.target.value.split('\n').filter(url => url.trim());
                      field.onChange(urls);
                    }}
                    placeholder="https://example.com/photo1.jpg"
                    rows={5}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="isPublished"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Опубліковано</FormLabel>
                <div className="text-sm text-gray-600">
                  Елемент буде відображатися на сайті
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "Збереження..." : submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  );
}