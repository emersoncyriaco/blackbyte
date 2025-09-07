import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Sidebar from "@/components/layout/sidebar";
import PostCreateModal from "@/components/forum/post-create-modal";
import { useState } from "react";
import type { Forum, PostWithDetails } from "@shared/schema";

export default function ForumPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: forum } = useQuery<Forum>({
    queryKey: ["/api/forums", slug],
  });

  const { data: posts, isLoading: postsLoading } = useQuery<PostWithDetails[]>({
    queryKey: ["/api/posts", forum?.id],
    enabled: !!forum?.id,
  });

  const { data: forums } = useQuery({
    queryKey: ["/api/forums"],
  });

  if (!forum) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar user={user} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Fórum não encontrado</h1>
            <p className="text-muted-foreground">O fórum que você está procurando não existe.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} />
      
      <main className="flex-1 overflow-auto">
        {/* Forum Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 py-8 px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <div 
                className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl"
                style={{ backgroundColor: forum.color }}
              >
                <i className={forum.icon}></i>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{forum.name}</h1>
                {forum.description && (
                  <p className="text-purple-100 mt-2">{forum.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-purple-100">
              <span>{forum.postCount} posts</span>
              <span>{forum.viewCount} visualizações</span>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Tópicos</h2>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800"
              data-testid="button-new-topic"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Novo Tópico
            </Button>
          </div>

          {postsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-muted rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-6 bg-muted rounded mb-2"></div>
                        <div className="h-4 bg-muted rounded mb-4 w-3/4"></div>
                        <div className="flex gap-4">
                          <div className="h-4 w-16 bg-muted rounded"></div>
                          <div className="h-4 w-16 bg-muted rounded"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {post.author.firstName?.[0] || (post.author.email?.[0] ?? 'U').toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2 hover:text-purple-500 transition-colors">
                          {post.title}
                        </h3>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm text-muted-foreground">
                            Por: {post.author.firstName || post.author.email}
                          </span>
                          <span 
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              post.author.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              post.author.role === 'moderador' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              post.author.role === 'vip' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                            }`}
                          >
                            {post.author.role.charAt(0).toUpperCase() + post.author.role.slice(1)}
                          </span>
                        </div>
                        
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {post.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {post.replyCount} respostas
                          </span>
                          <span>
                            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {post.viewCount} visualizações
                          </span>
                          <span>
                            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {post.createdAt ? new Date(post.createdAt).toLocaleDateString('pt-BR') : 'Data desconhecida'}
                          </span>
                        </div>
                      </div>
                      
                      {post.pinned && (
                        <div className="text-purple-500">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,4V8L15,9V10H12V11H15L16,12V13H12V14H13V21H11V14H10V13H6V12L7,11H10V10H8V9L9,8V4H14Z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum tópico ainda</h3>
                <p className="text-muted-foreground mb-4">
                  Seja o primeiro a criar um tópico neste fórum!
                </p>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800"
                >
                  Criar Primeiro Tópico
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {showCreateModal && (
        <PostCreateModal 
          onClose={() => setShowCreateModal(false)}
          forums={forums || []}
          selectedForumId={forum.id}
        />
      )}
    </div>
  );
}
