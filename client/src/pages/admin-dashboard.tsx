import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import type { User, PostWithDetails } from "@shared/schema";

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      toast({
        title: "Acesso Negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      window.location.href = "/";
    }
  }, [user, isLoading, toast]);

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: user?.role === 'admin',
  });

  const { data: posts, isLoading: postsLoading } = useQuery<PostWithDetails[]>({
    queryKey: ["/api/posts"],
    enabled: user?.role === 'admin',
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await apiRequest("PATCH", `/api/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Sucesso",
        description: "Cargo do usuário atualizado com sucesso.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Falha ao atualizar cargo do usuário.",
        variant: "destructive",
      });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("PATCH", `/api/users/${userId}/ban`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Sucesso",
        description: "Usuário banido com sucesso.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Falha ao banir usuário.",
        variant: "destructive",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      await apiRequest("DELETE", `/api/posts/${postId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Sucesso",
        description: "Post removido com sucesso.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Falha ao remover post.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} />
      
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-foreground">Dashboard Administrativo</h1>
            <Button 
              onClick={() => window.location.href = "/"}
              variant="outline"
              data-testid="button-back-home"
            >
              Voltar ao Fórum
            </Button>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* User Management */}
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg animate-pulse">
                        <div className="flex-1">
                          <div className="h-4 bg-background rounded mb-2"></div>
                          <div className="h-3 bg-background rounded w-3/4"></div>
                        </div>
                        <div className="flex gap-2">
                          <div className="h-8 w-20 bg-background rounded"></div>
                          <div className="h-8 w-16 bg-background rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {users?.map((userItem) => (
                      <div key={userItem.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-foreground">
                            {userItem.firstName || userItem.email}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {userItem.email}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span 
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                userItem.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                userItem.role === 'moderador' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                userItem.role === 'vip' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                              }`}
                            >
                              {userItem.role.charAt(0).toUpperCase() + userItem.role.slice(1)}
                            </span>
                            {userItem.banned && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                Banido
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            defaultValue={userItem.role}
                            onValueChange={(role) => updateRoleMutation.mutate({ userId: userItem.id, role })}
                            disabled={updateRoleMutation.isPending}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="membro">Membro</SelectItem>
                              <SelectItem value="vip">VIP</SelectItem>
                              <SelectItem value="moderador">Moderador</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          {!userItem.banned && userItem.id !== user.id && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => banUserMutation.mutate(userItem.id)}
                              disabled={banUserMutation.isPending}
                              data-testid={`button-ban-${userItem.id}`}
                            >
                              Banir
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Post Management */}
            <Card>
              <CardHeader>
                <CardTitle>Posts Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {postsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg animate-pulse">
                        <div className="flex-1">
                          <div className="h-4 bg-background rounded mb-2"></div>
                          <div className="h-3 bg-background rounded w-1/2"></div>
                        </div>
                        <div className="flex gap-2">
                          <div className="h-8 w-16 bg-background rounded"></div>
                          <div className="h-8 w-16 bg-background rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {posts?.slice(0, 10).map((post) => (
                      <div key={post.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-foreground line-clamp-1">
                            {post.title}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Por: {post.author.firstName || post.author.email}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {post.forum.name} • {post.createdAt ? new Date(post.createdAt).toLocaleDateString('pt-BR') : 'Data desconhecida'}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deletePostMutation.mutate(post.id)}
                            disabled={deletePostMutation.isPending}
                            data-testid={`button-delete-post-${post.id}`}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Estatísticas do Fórum</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold text-foreground mb-2">
                      {users?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Usuários Totais</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold text-foreground mb-2">
                      {posts?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Posts Totais</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold text-foreground mb-2">
                      {users?.filter(u => u.role === 'vip').length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Usuários VIP</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold text-foreground mb-2">
                      {users?.filter(u => u.banned).length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Usuários Banidos</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
