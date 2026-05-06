'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMusicJournal, MusicEntry } from '@/hooks/useMusicJournal';
import { useMyBlog, SpecialSong } from '@/hooks/useMyBlog';
import { ImagePlus, Camera, Edit3, Save, X, Star, User, Trash2, Plus, Heart, Search, Link, ExternalLink, Pencil } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { toast } from 'sonner';

// ---------- Special Song Card Component ----------
function SpecialSongCard({
  song,
  isOwner,
  onEdit,
  onDelete,
}: {
  song: SpecialSong;
  isOwner: boolean;
  onEdit: (song: SpecialSong) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="overflow-hidden border-border hover:border-primary/30 transition-all duration-300 group">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Left Side: Song Info */}
          <div className="md:w-80 lg:w-96 flex-shrink-0 p-6 bg-gradient-to-br from-secondary to-secondary/50 border-b md:border-b-0 md:border-r border-border">
            <div className="space-y-4">
              <div className="aspect-square rounded-xl overflow-hidden bg-muted shadow-lg">
                <img
                  src={song.song_cover_url || '/placeholder.jpg'}
                  alt={song.song_title || ''}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }}
                />
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="text-lg font-bold text-foreground leading-tight">{song.song_title}</h4>
                  <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span className="text-sm">{song.song_artist}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Star className="h-6 w-6 fill-yellow-500 text-yellow-500" />
                  <span className="text-2xl font-bold text-foreground">{song.song_rating?.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">/10</span>
                </div>
                {song.song_url && (
                  <div className="pt-2 border-t border-border/50">
                    <a href={song.song_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors group/link">
                      <Link className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[200px]">{song.song_url}</span>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Super Review */}
          <div className="flex-1 p-6 bg-background relative">
            {isOwner && (
              <div className="absolute top-3 right-3 flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onEdit(song)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onDelete(song.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                <h4 className="font-semibold text-foreground">Super Reseña</h4>
              </div>
              <div className="flex-1">
                <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap text-base">{song.super_review}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                {new Date(song.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Loading Skeleton ----------
function BlogSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="aspect-[21/9] md:aspect-[3/1] rounded-2xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

// ---------- Main MyBlogView Component ----------
export function MyBlogView() {
  const { isAuthenticated } = useAuth();
  const { entries } = useMusicJournal();
  const { blogPost, specialSongs, isLoading, saveBio, saveBanner, createSpecialSong, updateSpecialSong, deleteSpecialSong } = useMyBlog();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bannerImage, setBannerImage] = useState<string | null>('/banner.png');
  const [bioText, setBioText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [tempBio, setTempBio] = useState('');
  const [isSavingBio, setIsSavingBio] = useState(false);

  const [showForm, setShowForm] = useState<'create' | 'edit' | null>(null);
  const [editingSong, setEditingSong] = useState<SpecialSong | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<MusicEntry | null>(null);
  const [superReviewText, setSuperReviewText] = useState('');
  const [songLink, setSongLink] = useState('');
  const [isSavingSong, setIsSavingSong] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSongQuery, setSearchSongQuery] = useState('');

  // Sincronizar datos desde Supabase
  useEffect(() => {
    if (blogPost) {
      setBioText(blogPost.bio || '');
      if (blogPost.banner_url) {
        setBannerImage(blogPost.banner_url);
      }
    }
  }, [blogPost]);

  // Filtrar special songs (buscador general)
  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) return specialSongs;
    const q = searchQuery.toLowerCase();
    return specialSongs.filter(
      (s) =>
        s.song_title?.toLowerCase().includes(q) ||
        s.song_artist?.toLowerCase().includes(q) ||
        s.super_review?.toLowerCase().includes(q)
    );
  }, [specialSongs, searchQuery]);

  // Filtrar canciones disponibles en el selector
  const filteredAvailableSongs = useMemo(() => {
    const songs = entries.filter((e) => e.type === 'song');
    if (!searchSongQuery.trim()) return songs;
    const q = searchSongQuery.toLowerCase();
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q)
    );
  }, [entries, searchSongQuery]);

  // Banner
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('La imagen no puede superar los 5MB'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imagenes'); return; }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setBannerImage(dataUrl);
      const success = await saveBanner(dataUrl);
      if (success) toast.success('Portada guardada');
      else toast.error('Error al guardar la portada');
    };
    reader.onerror = () => toast.error('Error al cargar la imagen');
    reader.readAsDataURL(file);
  };

  // Bio
  const handleEditBio = () => { setTempBio(bioText); setIsEditing(true); };
  const handleSaveBio = async () => {
    setIsSavingBio(true);
    const success = await saveBio(tempBio);
    setIsSavingBio(false);
    if (success) { setBioText(tempBio); setIsEditing(false); toast.success('Biografia guardada'); }
    else toast.error('Error al guardar la biografia');
  };
  const handleCancelEdit = () => { setTempBio(bioText); setIsEditing(false); };

  // Abrir formulario de crear
  const handleOpenCreate = () => {
    setShowForm('create');
    setEditingSong(null);
    setSelectedEntry(null);
    setSuperReviewText('');
    setSongLink('');
    setSearchSongQuery('');
  };

  // Abrir formulario de editar
  const handleOpenEdit = (song: SpecialSong) => {
    setShowForm('edit');
    setEditingSong(song);
    setSelectedEntry(null);
    setSuperReviewText(song.super_review);
    setSongLink(song.song_url || '');
    setSearchSongQuery('');
  };

  // Cerrar formulario
  const handleCloseForm = () => {
    setShowForm(null);
    setEditingSong(null);
    setSelectedEntry(null);
    setSuperReviewText('');
    setSongLink('');
    setSearchSongQuery('');
  };

  // Special Songs - Crear
  const handleSelectSong = (entry: MusicEntry) => setSelectedEntry(entry);

  const handleCreateSpecialSong = async () => {
    if (!selectedEntry || !superReviewText.trim()) {
      toast.error('Selecciona una cancion y escribe tu super reseña');
      return;
    }
    setIsSavingSong(true);
    const success = await createSpecialSong(selectedEntry.id, superReviewText.trim(), songLink.trim() || undefined);
    setIsSavingSong(false);
    if (success) {
      handleCloseForm();
      toast.success('Super reseña creada');
    } else toast.error('Error al crear la super reseña');
  };

  // Special Songs - Editar
  const handleUpdateSpecialSong = async () => {
    if (!editingSong || !superReviewText.trim()) {
      toast.error('La super reseña no puede estar vacia');
      return;
    }
    setIsSavingSong(true);
    const success = await updateSpecialSong(editingSong.id, superReviewText.trim(), songLink.trim() || undefined);
    setIsSavingSong(false);
    if (success) {
      handleCloseForm();
      toast.success('Super reseña actualizada');
    } else toast.error('Error al actualizar la super reseña');
  };

  // Special Songs - Eliminar
  const handleDeleteSpecialSong = async (id: string) => {
    const success = await deleteSpecialSong(id);
    if (success) toast.success('Super reseña eliminada');
    else toast.error('Error al eliminar la super reseña');
  };

  if (isLoading) return <BlogSkeleton />;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-secondary border border-border">
        <div className="aspect-[21/9] md:aspect-[3/1] relative bg-gradient-to-br from-primary/10 to-secondary">
          {bannerImage ? (
            <img src={bannerImage} alt="Portada del blog" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Camera className="h-16 w-16 mx-auto mb-3 opacity-40" />
                <p className="text-lg font-medium">Tu portada aqui</p>
                <p className="text-sm">Sube una imagen para personalizar tu blog</p>
              </div>
            </div>
          )}
          {isAuthenticated && (
            <div className="absolute bottom-4 right-4">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <Button variant="secondary" size="sm" className="gap-2 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                onClick={() => fileInputRef.current?.click()}>
                <ImagePlus className="h-4 w-4" />
                {bannerImage && bannerImage !== '/banner.png' ? 'Cambiar portada' : 'Subir portada'}
              </Button>
            </div>
          )}
        </div>
        <div className="px-6 pb-6 -mt-12 relative z-10 flex items-end gap-4">
          <div className="w-24 h-24 rounded-xl border-4 border-background overflow-hidden shadow-lg flex-shrink-0 bg-muted">
            <img src="/apple-icon.png" alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="pb-1">
            <h3 className="text-xl font-bold text-foreground">{isAuthenticated ? 'ImDashie' : "Dashie's Blog"}</h3>
            <p className="text-sm text-muted-foreground">Bitacora Musical Personal</p>
          </div>
        </div>
      </div>

      {/* Biografia */}
      <div className="rounded-xl border border-border bg-secondary p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Algunas Palabras...</h3>
          </div>
          {isAuthenticated && !isEditing && (
            <Button variant="outline" size="sm" className="gap-2" onClick={handleEditBio}>
              <Edit3 className="h-4 w-4" /> Editar
            </Button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1" onClick={handleCancelEdit}>
                <X className="h-4 w-4" /> Cancelar
              </Button>
              <Button variant="default" size="sm" className="gap-1" onClick={handleSaveBio} disabled={isSavingBio}>
                <Save className="h-4 w-4" /> {isSavingBio ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          )}
        </div>
        {isEditing ? (
          <Textarea value={tempBio} onChange={(e) => setTempBio(e.target.value)}
            placeholder="Escribe algo sobre ti, tu viaje musical, tus gustos..." className="min-h-[150px] bg-background resize-y" />
        ) : bioText ? (
          <div className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{bioText}</div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Edit3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium mb-1">Aun no hay nada escrito</p>
            <p className="text-sm">{isAuthenticated ? 'Haz clic en "Editar" para compartir tu historia musical' : 'El usuario aun no ha escrito su biografia'}</p>
          </div>
        )}
      </div>

      {/* Special Songs */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center">
              <Heart className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Special Songs</h3>
              <p className="text-sm text-muted-foreground">Canciones que merecen una super reseña</p>
            </div>
          </div>
          {isAuthenticated && !showForm && (
            <Button variant="default" className="gap-2" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4" /> Nueva Super Reseña
            </Button>
          )}
        </div>

        {/* Buscador de Special Songs */}
        {specialSongs.length > 0 && !showForm && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar en Special Songs por titulo, artista o texto..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        )}

        {/* Formulario de crear/editar */}
        {showForm && isAuthenticated && (
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/50">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground">
                  {showForm === 'create' ? 'Crear Super Reseña' : 'Editar Super Reseña'}
                </h4>
                <Button variant="ghost" size="sm" onClick={handleCloseForm}>
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
              </div>

              {showForm === 'create' && !selectedEntry ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Selecciona una cancion de tu bitacora:</p>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar cancion por titulo o artista..." value={searchSongQuery}
                      onChange={(e) => setSearchSongQuery(e.target.value)} className="pl-10" />
                  </div>
                  {filteredAvailableSongs.length === 0 ? (
                    <p className="text-center py-6 text-muted-foreground">
                      {searchSongQuery ? 'No se encontraron canciones' : 'No hay canciones en tu bitacora.'}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                      {filteredAvailableSongs.map((entry) => (
                        <button key={entry.id} onClick={() => handleSelectSong(entry)}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/80 transition-all text-left">
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                            <img src={entry.coverUrl} alt={entry.title} className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate text-sm">{entry.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{entry.artist}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                              <span className="text-xs font-medium text-foreground">{entry.rating.toFixed(1)}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="md:w-64 flex-shrink-0 p-4 rounded-lg bg-secondary/80 space-y-3">
                    {selectedEntry ? (
                      <>
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                          <img src={selectedEntry.coverUrl} alt={selectedEntry.title} className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }} />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{selectedEntry.title}</p>
                          <p className="text-sm text-muted-foreground">{selectedEntry.artist}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          <span className="font-bold text-foreground">{selectedEntry.rating.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">/10</span>
                        </div>
                        <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setSelectedEntry(null)}>Cambiar cancion</Button>
                      </>
                    ) : editingSong && showForm === 'edit' ? (
                      <>
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                          <img src={editingSong.song_cover_url || '/placeholder.jpg'} alt={editingSong.song_title || ''}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }} />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{editingSong.song_title}</p>
                          <p className="text-sm text-muted-foreground">{editingSong.song_artist}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          <span className="font-bold text-foreground">{editingSong.song_rating?.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">/10</span>
                        </div>
                      </>
                    ) : null}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                        <Link className="h-3.5 w-3.5" />
                        Link de la cancion (Spotify, YouTube, etc.)
                      </label>
                      <Input value={songLink} onChange={(e) => setSongLink(e.target.value)}
                        placeholder="https://open.spotify.com/track/..." className="bg-background" />
                    </div>
                    <Textarea value={superReviewText} onChange={(e) => setSuperReviewText(e.target.value)}
                      placeholder="Escribe tu super reseña para esta cancion..." className="min-h-[180px] bg-background resize-y" />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={handleCloseForm}>Cancelar</Button>
                      {showForm === 'create' ? (
                        <Button variant="default" size="sm" className="gap-2" onClick={handleCreateSpecialSong}
                          disabled={!selectedEntry || !superReviewText.trim() || isSavingSong}>
                          {isSavingSong ? <>Guardando...</> : <><Heart className="h-4 w-4" /> Publicar Super Reseña</>}
                        </Button>
                      ) : (
                        <Button variant="default" size="sm" className="gap-2" onClick={handleUpdateSpecialSong}
                          disabled={!superReviewText.trim() || isSavingSong}>
                          {isSavingSong ? <>Guardando...</> : <><Save className="h-4 w-4" /> Guardar cambios</>}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Lista de Special Songs */}
        {filteredSongs.length === 0 && !showForm ? (
          <div className="text-center py-16 text-muted-foreground">
            <Heart className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-xl font-medium mb-2">{searchQuery ? 'Sin resultados' : 'Aun no hay Special Songs'}</p>
            <p className="text-sm">
              {searchQuery ? 'Intenta con otros terminos de busqueda' :
                isAuthenticated ? 'Crea tu primera super reseña' : 'El usuario aun no ha creado super reseñas'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredSongs.map((song) => (
              <SpecialSongCard key={song.id} song={song} isOwner={isAuthenticated}
                onEdit={handleOpenEdit} onDelete={handleDeleteSpecialSong} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
