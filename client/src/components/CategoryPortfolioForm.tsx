import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { InsertPortfolioItem } from "@shared/schema";

interface CategoryPortfolioFormProps {
  form: any;
  onSubmit: (data: InsertPortfolioItem) => void;
  isSubmitting: boolean;
  submitButtonText: string;
}

export function CategoryPortfolioForm({ form, onSubmit, isSubmitting, submitButtonText }: CategoryPortfolioFormProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>(form.getValues("photos") || []);
  const [photoUrlsText, setPhotoUrlsText] = useState<string>('');
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const currentPhotos = form.getValues("photos") || [];
    setUploadedPhotos(currentPhotos);
    if (photoUrlsText === '') {
      setPhotoUrlsText(currentPhotos.join('\n'));
    }
  }, [form.watch("photos")]);

  const handleSubmit = (data: InsertPortfolioItem) => {
    console.log("Form submission data:", data);
    onSubmit(data);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch('/api/admin/upload', { method: 'POST', body: formData });
    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return data.url;
  };

  const uploadThumbnail = async (event: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const imageUrl = await uploadImage(file);
      form.setValue(fieldName, imageUrl);
      toast({ title: "Успішно завантажено", description: "Зображення було завантажено на сервер" });
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      toast({ title: "Помилка завантаження", description: "Не вдалося завантажити зображення", variant: "destructive" });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const uploadMultipleImages = async (files: FileList): Promise<string[]> => {
    const uploadPromises = Array.from(files).map(file => uploadImage(file));
    return Promise.all(uploadPromises);
  };

  const handlePhotosUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    try {
      setUploading(true);
      const imageUrls = await uploadMultipleImages(files);
      const newPhotos = [...uploadedPhotos, ...imageUrls];
      setUploadedPhotos(newPhotos);
      form.setValue("photos", newPhotos);
      // Update the textarea to show the new URLs
      setPhotoUrlsText(newPhotos.join('\n'));
      toast({ title: "Успішно завантажено", description: `${imageUrls.length} фото було завантажено` });
    } catch (error) {
      console.error('Photos upload error:', error);
      toast({ title: "Помилка завантаження", description: "Не вдалося завантажити фото", variant: "destructive" });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handlePhotoUrlsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setPhotoUrlsText(value);
    
    // Auto-update photos array when URLs are entered
    const urls = value.split('\n').map(url => url.trim()).filter(url => url.length > 0);
    setUploadedPhotos(urls);
    form.setValue("photos", urls);
  };

  const removePhoto = (index: number) => {
    const newPhotos = uploadedPhotos.filter((_, i) => i !== index);
    setUploadedPhotos(newPhotos);
    form.setValue("photos", newPhotos);
    // Update the textarea to reflect the removed photo
    setPhotoUrlsText(newPhotos.join('\n'));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          
          {/* БЛОК 1: Основна інформація */}
          <Card className="border-2 border-green-300 bg-gradient-to-r from-green-50 to-green-100">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-green-200">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">1</div>
                <h2 className="text-2xl font-bold text-gray-900">📝 Основна інформація</h2>
              </div>
              
              <FormField
                control={form.control}
                name="categoryName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-green-800">Назва категорії</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Приклад: Весілля Анни та Олексія" className="h-12 text-base border-green-300 focus:border-green-500" />
                    </FormControl>
                    <p className="text-sm text-green-700">Це буде відображатися як заголовок блоку на сайті</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryPreview"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-green-800">Превью блоку категорії</FormLabel>
                    <div className="space-y-4">
                      {field.value && (
                        <div className="relative inline-block">
                          <img src={field.value} alt="Category preview" className="w-32 h-32 object-cover rounded-lg border-2 border-green-300" />
                          <Button type="button" variant="destructive" size="sm" className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0" onClick={() => field.onChange("")}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border-2 border-dashed border-green-400 rounded-lg bg-green-25">
                          <label className="text-sm font-semibold text-green-800 mb-3 block">🔼 Завантажити файл</label>
                          <Button type="button" variant="outline" disabled={uploading} onClick={() => document.getElementById('category-preview-upload')?.click()} className="w-full h-10 border-green-400 text-green-700 hover:bg-green-100">
                            <Upload className="h-4 w-4 mr-2" />
                            {uploading ? "Завантажується..." : "Вибрати файл"}
                          </Button>
                          <input id="category-preview-upload" type="file" accept="image/*" onChange={(e) => uploadThumbnail(e, 'categoryPreview')} className="hidden" />
                        </div>
                        
                        <div className="p-4 border-2 border-dashed border-blue-400 rounded-lg bg-blue-25">
                          <label className="text-sm font-semibold text-blue-800 mb-3 block">🔗 Або вставити посилання</label>
                          <Input {...field} placeholder="https://example.com/image.jpg" className="h-10 border-blue-400 focus:border-blue-500" />
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">💡 <strong>Що це:</strong> Це зображення буде відображатися як превью блоку на головній сторінці сайту</p>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* БЛОК 2: Фото */}
          <Card className="border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-purple-100">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-purple-200">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">2</div>
                <h2 className="text-2xl font-bold text-gray-900">📸 Фото секція</h2>
              </div>

              <FormField
                control={form.control}
                name="photoThumbnail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-purple-800">Обкладинка фото</FormLabel>
                    <div className="space-y-4">
                      {field.value && (
                        <div className="relative inline-block">
                          <img src={field.value} alt="Photo thumbnail" className="w-32 h-32 object-cover rounded-lg border-2 border-purple-300" />
                          <Button type="button" variant="destructive" size="sm" className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0" onClick={() => field.onChange("")}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border-2 border-dashed border-purple-400 rounded-lg">
                          <label className="text-sm font-semibold text-purple-800 mb-3 block">🔼 Завантажити файл</label>
                          <Button type="button" variant="outline" disabled={uploading} onClick={() => document.getElementById('photo-thumbnail-upload')?.click()} className="w-full h-10 border-purple-400 text-purple-700 hover:bg-purple-100">
                            <Upload className="h-4 w-4 mr-2" />
                            {uploading ? "Завантажується..." : "Вибрати файл"}
                          </Button>
                          <input id="photo-thumbnail-upload" type="file" accept="image/*" onChange={(e) => uploadThumbnail(e, 'photoThumbnail')} className="hidden" />
                        </div>
                        
                        <div className="p-4 border-2 border-dashed border-blue-400 rounded-lg">
                          <label className="text-sm font-semibold text-blue-800 mb-3 block">🔗 Або вставити посилання</label>
                          <Input {...field} placeholder="https://example.com/thumbnail.jpg" className="h-10 border-blue-400 focus:border-blue-500" />
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <p className="text-sm text-purple-800">💡 <strong>Що це:</strong> Це зображення буде показуватися як обкладинка фото секції</p>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="photos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-purple-800">Фотографії</FormLabel>
                    <div className="space-y-4">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border-2 border-dashed border-purple-400 rounded-lg">
                          <label className="text-sm font-semibold text-purple-800 mb-3 block">🔼 Завантажити файли</label>
                          <Button type="button" variant="outline" disabled={uploading} onClick={() => document.getElementById('photos-upload')?.click()} className="w-full h-10 border-purple-400 text-purple-700 hover:bg-purple-100">
                            <Upload className="h-4 w-4 mr-2" />
                            {uploading ? "Завантажується..." : "Вибрати фото"}
                          </Button>
                          <input id="photos-upload" type="file" accept="image/*" multiple onChange={handlePhotosUpload} className="hidden" />
                        </div>
                        
                        <div className="p-4 border-2 border-dashed border-blue-400 rounded-lg">
                          <label className="text-sm font-semibold text-blue-800 mb-3 block">🔗 Або вставити посилання</label>
                          <Textarea 
                            ref={textareaRef} 
                            value={photoUrlsText} 
                            onChange={handlePhotoUrlsChange} 
                            placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg&#10;(кожне посилання на новому рядку)" 
                            className="min-h-20 text-sm resize-y border-blue-400 focus:border-blue-500" 
                          />
                        </div>
                      </div>

                      {uploadedPhotos.length > 0 && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Додані фото ({uploadedPhotos.length}):</h4>
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                            {uploadedPhotos.map((photo, index) => (
                              <div key={index} className="relative group">
                                <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-16 object-cover rounded border" />
                                <Button type="button" variant="destructive" size="sm" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removePhoto(index)}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <p className="text-sm text-purple-800">💡 <strong>Що це:</strong> Ці фотографії будуть показуватися в галереї фото</p>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* БЛОК 3: Відео */}
          <Card className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-blue-200">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">3</div>
                <h2 className="text-2xl font-bold text-gray-900">🎬 Відео секція</h2>
              </div>

              <FormField
                control={form.control}
                name="videoThumbnail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-blue-800">Обкладинка відео (необов'язково)</FormLabel>
                    <div className="space-y-4">
                      {field.value && (
                        <div className="relative inline-block">
                          <img src={field.value} alt="Video thumbnail" className="w-32 h-32 object-cover rounded-lg border-2 border-blue-300" />
                          <Button type="button" variant="destructive" size="sm" className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0" onClick={() => field.onChange("")}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border-2 border-dashed border-blue-400 rounded-lg">
                          <label className="text-sm font-semibold text-blue-800 mb-3 block">🔼 Завантажити файл</label>
                          <Button type="button" variant="outline" disabled={uploading} onClick={() => document.getElementById('video-thumbnail-upload')?.click()} className="w-full h-10 border-blue-400 text-blue-700 hover:bg-blue-100">
                            <Upload className="h-4 w-4 mr-2" />
                            {uploading ? "Завантажується..." : "Вибрати файл"}
                          </Button>
                          <input id="video-thumbnail-upload" type="file" accept="image/*" onChange={(e) => uploadThumbnail(e, 'videoThumbnail')} className="hidden" />
                        </div>
                        
                        <div className="p-4 border-2 border-dashed border-blue-400 rounded-lg">
                          <label className="text-sm font-semibold text-blue-800 mb-3 block">🔗 Або вставити посилання</label>
                          <Input {...field} placeholder="https://example.com/video-thumb.jpg" className="h-10 border-blue-400 focus:border-blue-500" />
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">💡 <strong>Що це:</strong> Якщо не вказано, буде автоматично взято превью з YouTube</p>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-blue-800">Посилання на відео</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://youtu.be/..." className="h-12 text-base border-blue-300 focus:border-blue-500" />
                    </FormControl>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">💡 <strong>Що це:</strong> Вставте посилання на YouTube відео</p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* БЛОК 4: Налаштування */}
          <Card className="border-2 border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold text-lg">4</div>
                <h2 className="text-2xl font-bold text-gray-900">⚙️ Налаштування</h2>
              </div>

              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border-2 border-gray-300 p-4 bg-white">
                    <div className="space-y-0.5">
                      <FormLabel className="text-lg font-semibold text-gray-800">✅ Опублікувати на сайті</FormLabel>
                      <p className="text-sm text-gray-600">Елемент буде видно відвідувачам сайту</p>
                    </div>
                    <FormControl>
                      <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-6 w-6 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orderIndex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-gray-800">📋 Порядок відображення</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="0" className="h-12 w-32 border-gray-300 focus:border-gray-500" onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                    </FormControl>
                    <p className="text-sm text-gray-600">Менше число = вище в списку</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-center pt-8">
            <Button type="submit" disabled={isSubmitting} className="px-12 py-4 text-xl font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg">
              {isSubmitting ? "⏳ Збереження..." : `💾 ${submitButtonText}`}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}