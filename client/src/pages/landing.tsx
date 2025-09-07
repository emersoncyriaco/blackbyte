import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Registration Banner */}
      <div className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-3 px-4 text-center">
        <div className="flex items-center justify-center">
          <span className="font-medium text-white">
            FAÇA SEU CADASTRO PARA PODER LER E BAIXAR OS CONTEÚDOS DOS POSTS
          </span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="mb-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center transform rotate-45">
              <div className="transform -rotate-45">
                <svg
                  className="w-12 h-12 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" />
                </svg>
              </div>
            </div>
            
            <h1 className="text-5xl font-bold text-foreground mb-4">
              Fórum <span className="bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-transparent">BlackByte</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              O maior fórum sobre BlackByte e Marketing do Brasil. 
              Conecte-se com uma comunidade de especialistas e compartilhe conhecimento.
            </p>
          </div>

          {/* Auth Section */}
          <Card className="max-w-md mx-auto mb-12">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                Entre na Comunidade
              </h2>
              
              <div className="space-y-4">
                <Button 
                  onClick={() => window.location.href = '/api/login'} 
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white font-semibold py-3"
                  data-testid="button-login"
                >
                  Fazer Login
                </Button>
                
                <div className="text-center text-muted-foreground">
                  <span>Não tem uma conta? </span>
                  <button 
                    onClick={() => window.location.href = '/api/login'}
                    className="text-purple-500 hover:text-purple-600 font-medium"
                    data-testid="link-register"
                  >
                    Cadastre-se aqui
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Conteúdo Exclusivo</h3>
              <p className="text-muted-foreground">Acesse materiais únicos e ferramentas especializadas</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Comunidade Ativa</h3>
              <p className="text-muted-foreground">Conecte-se com profissionais e entusiastas da área</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Recursos Avançados</h3>
              <p className="text-muted-foreground">Ferramentas e técnicas para profissionais</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
