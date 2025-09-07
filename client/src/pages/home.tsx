import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/sidebar";
import HeroBanner from "@/components/layout/hero-banner";
import ForumCard from "@/components/forum/forum-card";
import PostCreateModal from "@/components/forum/post-create-modal";
import { useState } from "react";
import type { ForumWithStats } from "@shared/schema";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: forums, isLoading: forumsLoading } = useQuery<ForumWithStats[]>({
    queryKey: ["/api/forums"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} />
      
      <main className="flex-1 overflow-auto">
        <HeroBanner />
        
        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-foreground">Fóruns</h2>
            <div className="flex gap-4">
              {user && user.role === 'admin' && (
                <Button 
                  onClick={() => window.location.href = '/admin-dashboard'}
                  variant="destructive"
                  data-testid="button-admin-dashboard"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Dashboard Admin
                </Button>
              )}
              
              {/* Debug: Mostrar role atual temporariamente */}
              {user && (
                <div className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                  Role: {user.role}
                </div>
              )}
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
          </div>

          {forumsLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-6 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-muted rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-6 bg-muted rounded mb-2"></div>
                      <div className="h-4 bg-muted rounded mb-4"></div>
                      <div className="flex gap-4">
                        <div className="h-4 w-16 bg-muted rounded"></div>
                        <div className="h-4 w-16 bg-muted rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {/* Sobre o Fórum BlackByte */}
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Sobre o Fórum BlackByte</h3>
                <div className="grid gap-6">
                  {forums?.filter(forum => ['comece-por-aqui', 'administracao', 'apresente-se'].includes(forum.slug)).map((forum) => (
                    <ForumCard key={forum.id} forum={forum} />
                  ))}
                </div>
              </div>

              {/* Fórum Free */}
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Fórum Free</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {forums?.filter(forum => !['comece-por-aqui', 'administracao', 'apresente-se'].includes(forum.slug)).map((forum) => (
                    <ForumCard key={forum.id} forum={forum} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showCreateModal && (
        <PostCreateModal 
          onClose={() => setShowCreateModal(false)}
          forums={forums || []}
        />
      )}
    </div>
  );
}
