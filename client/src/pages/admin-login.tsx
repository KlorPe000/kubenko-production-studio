import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { adminLoginSchema, type AdminLogin } from "@shared/schema";
import { Lock, User } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<AdminLogin>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: AdminLogin) => {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Помилка входу");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Успішно",
        description: "Ви увійшли в систему",
      });
      setLocation("/admin");
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Невірні дані для входу",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AdminLogin) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-wedding-cream flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-wedding-charcoal">
            Вход в админ-панель
          </CardTitle>
          <p className="text-wedding-gray">
            Кубенко Production Studio
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ім'я користувача</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-wedding-gray" />
                        <Input
                          {...field}
                          type="text"
                          placeholder="Введіть ім'я користувача"
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пароль</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-wedding-gray" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="Введіть пароль"
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Входжу..." : "Увійти"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Тестові дані для входу:</p>
            <p className="text-sm text-blue-600">Логін: admin</p>
            <p className="text-sm text-blue-600">Пароль: admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}