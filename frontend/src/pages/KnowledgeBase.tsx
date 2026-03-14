import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import { Book, Search, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface Chapter {
  number: bigint;
  title: string;
}

interface ChapterContent {
  number: bigint;
  title: string;
  content: string;
}

export default function KnowledgeBase() {
  const { actor, isFetching: actorFetching } = useActor();
  const [selectedChapter, setSelectedChapter] = useState<bigint | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChapterContent[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch chapter list
  const { data: chapters, isLoading: chaptersLoading } = useQuery<Chapter[]>({
    queryKey: ['knowledgeBaseChapters'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor não disponível');
      const result = await actor.listChapters();
      return result;
    },
    enabled: !!actor && !actorFetching,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch selected chapter content - Convert BigInt to string for query key
  const { data: chapterContent, isLoading: contentLoading } = useQuery<ChapterContent | null>({
    queryKey: ['knowledgeBaseChapter', selectedChapter?.toString()],
    queryFn: async () => {
      if (!actor || !selectedChapter) return null;
      const result = await actor.getChapter(selectedChapter);
      return result;
    },
    enabled: !!actor && !actorFetching && selectedChapter !== null,
    staleTime: 5 * 60 * 1000,
  });

  // Handle search
  const handleSearch = async () => {
    if (!actor || !searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await actor.searchByKeyword(searchQuery.trim());
      setSearchResults(results);
    } catch (error) {
      console.error('Erro ao buscar:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleBackToChapters = () => {
    setSelectedChapter(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Render chapter list
  const renderChapterList = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
          <Book className="w-8 h-8 text-amber-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400">
            Base de Conhecimento
          </h1>
          <p className="text-zinc-400 mt-1">
            Conteúdo educacional premium sobre análise técnica e trading
          </p>
        </div>
      </div>

      {/* Search Section */}
      <Card className="bg-zinc-900/50 border-amber-500/20">
        <CardHeader>
          <CardTitle className="text-amber-400 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Buscar Conteúdo
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Pesquise por palavra-chave em todos os capítulos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Digite uma palavra-chave..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-zinc-800/50 border-amber-500/20 text-white placeholder:text-zinc-500 focus:border-amber-500/50"
            />
            <Button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-semibold"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Pesquisar
                </>
              )}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-3">
              <h3 className="text-sm font-semibold text-amber-400">
                Resultados da Busca ({searchResults.length})
              </h3>
              {searchResults.map((result) => (
                <Card
                  key={Number(result.number)}
                  className="bg-zinc-800/50 border-amber-500/20 hover:border-amber-500/40 cursor-pointer transition-all"
                  onClick={() => setSelectedChapter(result.number)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-amber-400">
                      Capítulo {Number(result.number)}: {result.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-zinc-400 line-clamp-2">
                      {result.content.substring(0, 150)}...
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !isSearching && (
            <div className="mt-4 p-4 rounded-lg bg-zinc-800/50 border border-amber-500/20">
              <p className="text-sm text-zinc-400 text-center">
                Nenhum resultado encontrado para "{searchQuery}"
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="bg-amber-500/20" />

      {/* Chapters List */}
      <div>
        <h2 className="text-xl font-bold text-amber-400 mb-4">Capítulos</h2>
        {chaptersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        ) : chapters && chapters.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {chapters.map((chapter) => (
              <Card
                key={Number(chapter.number)}
                className="bg-zinc-900/50 border-amber-500/20 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10 cursor-pointer transition-all group"
                onClick={() => setSelectedChapter(chapter.number)}
              >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 group-hover:border-amber-500/50 transition-all">
                      <Book className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base text-amber-400 group-hover:text-amber-300 transition-colors">
                        Capítulo {Number(chapter.number)}
                      </CardTitle>
                      <CardDescription className="text-zinc-400 mt-1">
                        {chapter.title}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-zinc-900/50 border-amber-500/20">
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-3 text-center">
                <AlertCircle className="w-12 h-12 text-amber-400/50" />
                <p className="text-zinc-400">Nenhum capítulo disponível no momento</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  // Render chapter content
  const renderChapterContent = () => {
    if (contentLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          <span className="ml-3 text-zinc-400">Carregando conteúdo...</span>
        </div>
      );
    }

    if (!chapterContent) {
      return (
        <Card className="bg-zinc-900/50 border-amber-500/20">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertCircle className="w-12 h-12 text-amber-400/50" />
              <p className="text-zinc-400">Erro ao carregar capítulo</p>
              <Button
                onClick={handleBackToChapters}
                variant="outline"
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                Voltar aos Capítulos
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleBackToChapters}
            variant="outline"
            size="sm"
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar aos Capítulos
          </Button>
        </div>

        <Card className="bg-zinc-900/50 border-amber-500/20">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
                <Book className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400">
                  Capítulo {Number(chapterContent.number)}
                </CardTitle>
                <CardDescription className="text-lg text-zinc-300 mt-1">
                  {chapterContent.title}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator className="bg-amber-500/20" />
          <CardContent className="pt-6">
            <ScrollArea className="h-[600px] pr-4">
              <div className="prose prose-invert prose-amber max-w-none">
                <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {chapterContent.content}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {selectedChapter === null ? renderChapterList() : renderChapterContent()}
    </div>
  );
}
