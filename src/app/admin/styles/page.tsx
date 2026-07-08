'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  GripVertical,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Palette,
  Image as ImageIcon,
  Upload,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Monitor,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────────

interface StyleSection {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  colorFrom: string;
  colorTo: string;
  sortOrder: number;
  active: boolean;
}

interface HeroSlide {
  id: string;
  imageUrl: string;
  alt: string;
  sortOrder: number;
  active: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const COLOR_OPTIONS = [
  { from: 'from-kabyle-red/80', to: 'to-kabyle-terracotta/80', label: 'Rouge / Terracotta' },
  { from: 'from-kabyle-terracotta/80', to: 'to-kabyle-gold/80', label: 'Terracotta / Or' },
  { from: 'from-kabyle-gold/80', to: 'to-kabyle-olive/80', label: 'Or / Olive' },
  { from: 'from-kabyle-olive/80', to: 'to-kabyle-dark/60', label: 'Olive / Sombre' },
  { from: 'from-kabyle-terracotta/80', to: 'to-kabyle-red/80', label: 'Terracotta / Rouge' },
  { from: 'from-kabyle-gold/80', to: 'to-kabyle-terracotta/80', label: 'Or / Terracotta' },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function StylesPage() {
  // ── Hero Slides state ──
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [heroLoading, setHeroLoading] = useState(true);
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroEditSlide, setHeroEditSlide] = useState<HeroSlide | null>(null);
  const [heroEditDialogOpen, setHeroEditDialogOpen] = useState(false);
  const [heroEditAlt, setHeroEditAlt] = useState('');
  const [heroEditActive, setHeroEditActive] = useState(true);
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroDeleteSlide, setHeroDeleteSlide] = useState<HeroSlide | null>(null);
  const [heroDeleting, setHeroDeleting] = useState(false);
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  // ── Styles state ──
  const [styles, setStyles] = useState<StyleSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStyle, setEditStyle] = useState<StyleSection | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteStyle, setDeleteStyle] = useState<StyleSection | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formLinkUrl, setFormLinkUrl] = useState('/catalog');
  const [formColorFrom, setFormColorFrom] = useState('from-kabyle-terracotta/80');
  const [formColorTo, setFormColorTo] = useState('to-kabyle-gold/80');
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formActive, setFormActive] = useState(true);

  // ── Fetch Hero Slides ──
  const fetchHeroSlides = useCallback(async () => {
    try {
      setHeroLoading(true);
      const res = await fetch('/api/hero-slides?admin=true');
      if (res.ok) {
        const data = await res.json();
        setHeroSlides(data.slides || []);
      }
    } catch (error) {
      console.error('Error fetching hero slides:', error);
    } finally {
      setHeroLoading(false);
    }
  }, []);

  // ── Fetch Styles ──
  const fetchStyles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/styles?admin=true');
      if (res.ok) {
        const data = await res.json();
        setStyles(data.styles);
      }
    } catch (error) {
      console.error('Error fetching styles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHeroSlides();
    fetchStyles();
  }, [fetchHeroSlides, fetchStyles]);

  // ─── Hero Slide handlers ───────────────────────────────────────────────

  const handleHeroFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setHeroUploading(true);
    let successCount = 0;

    for (const file of fileArray) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch('/api/images', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          toast.error(`Erreur upload: ${err.error || 'Échec'}`);
          continue;
        }

        const uploadData = await uploadRes.json();

        // Create hero slide with uploaded image
        const slideRes = await fetch('/api/hero-slides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: uploadData.url,
            alt: 'Robe Kabyle',
            sortOrder: heroSlides.length + successCount,
            active: true,
          }),
        });

        if (slideRes.ok) {
          successCount++;
        } else {
          const err = await slideRes.json();
          toast.error(`Erreur: ${err.error || 'Échec création slide'}`);
        }
      } catch {
        toast.error('Erreur lors de l\'upload');
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} photo${successCount > 1 ? 's' : ''} ajoutée${successCount > 1 ? 's' : ''} au carrousel`);
      fetchHeroSlides();
    }

    setHeroUploading(false);
  };

  const handleHeroDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleHeroFileUpload(files);
    }
  };

  const handleHeroDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const openHeroEditDialog = (slide: HeroSlide) => {
    setHeroEditSlide(slide);
    setHeroEditAlt(slide.alt);
    setHeroEditActive(slide.active);
    setHeroEditDialogOpen(true);
  };

  const handleHeroEditSave = async () => {
    if (!heroEditSlide) return;
    try {
      setHeroSaving(true);
      const res = await fetch(`/api/hero-slides/${heroEditSlide.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alt: heroEditAlt,
          active: heroEditActive,
        }),
      });
      if (res.ok) {
        toast.success('Slide mis à jour');
        setHeroEditDialogOpen(false);
        fetchHeroSlides();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setHeroSaving(false);
    }
  };

  const toggleHeroActive = async (slide: HeroSlide) => {
    try {
      const res = await fetch(`/api/hero-slides/${slide.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !slide.active }),
      });
      if (res.ok) {
        toast.success(slide.active ? 'Slide masqué' : 'Slide affiché');
        fetchHeroSlides();
      }
    } catch {
      toast.error('Erreur');
    }
  };

  const handleHeroDelete = async () => {
    if (!heroDeleteSlide) return;
    try {
      setHeroDeleting(true);
      const res = await fetch(`/api/hero-slides/${heroDeleteSlide.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Photo supprimée du carrousel');
        setHeroDeleteSlide(null);
        fetchHeroSlides();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setHeroDeleting(false);
    }
  };

  // ─── Styles handlers ──────────────────────────────────────────────────

  const openCreateDialog = () => {
    setEditStyle(null);
    setFormTitle('');
    setFormDescription('');
    setFormImageUrl('');
    setFormLinkUrl('/catalog');
    setFormColorFrom('from-kabyle-terracotta/80');
    setFormColorTo('to-kabyle-gold/80');
    setFormSortOrder(styles.length);
    setFormActive(true);
    setDialogOpen(true);
  };

  const openEditDialog = (style: StyleSection) => {
    setEditStyle(style);
    setFormTitle(style.title);
    setFormDescription(style.description);
    setFormImageUrl(style.imageUrl);
    setFormLinkUrl(style.linkUrl);
    setFormColorFrom(style.colorFrom);
    setFormColorTo(style.colorTo);
    setFormSortOrder(style.sortOrder);
    setFormActive(style.active);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formTitle || !formDescription || !formImageUrl) {
      toast.error('Veuillez remplir le titre, la description et l\'image');
      return;
    }

    const payload = {
      title: formTitle,
      description: formDescription,
      imageUrl: formImageUrl,
      linkUrl: formLinkUrl || '/catalog',
      colorFrom: formColorFrom,
      colorTo: formColorTo,
      sortOrder: formSortOrder,
      active: formActive,
    };

    try {
      setSaving(true);
      let res;
      if (editStyle) {
        res = await fetch(`/api/styles/${editStyle.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/styles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        toast.success(editStyle ? 'Style mis à jour avec succès' : 'Style créé avec succès');
        setDialogOpen(false);
        fetchStyles();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteStyle) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/styles/${deleteStyle.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Style supprimé avec succès');
        setDeleteStyle(null);
        fetchStyles();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de la suppression');
      }
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (style: StyleSection) => {
    try {
      const res = await fetch(`/api/styles/${style.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !style.active }),
      });
      if (res.ok) {
        toast.success(style.active ? 'Style désactivé' : 'Style activé');
        fetchStyles();
      }
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-10">
      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1: HERO CAROUSEL SLIDES
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Monitor className="h-6 w-6 text-primary" />
              Photos du Carrousel Hero
            </h2>
            <p className="text-muted-foreground">
              Ajoutez les photos qui défilent dans le bandeau principal de l&apos;accueil.
              Les photos défilent automatiquement toutes les 4 secondes.
            </p>
          </div>
          <Button
            onClick={() => heroFileInputRef.current?.click()}
            className="bg-primary hover:bg-primary/90"
            disabled={heroUploading}
          >
            {heroUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Ajouter des photos
              </>
            )}
          </Button>
        </div>

        {/* Hidden file input - accepts multiple */}
        <input
          ref={heroFileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleHeroFileUpload(e.target.files)}
          disabled={heroUploading}
        />

        {/* Info card */}
        <Card className="border-dashed">
          <CardContent className="p-4 flex items-center gap-3 text-sm text-muted-foreground">
            <ImageIcon className="h-5 w-5 shrink-0" />
            <span>
              Glissez-déposez ou cliquez sur &quot;Ajouter des photos&quot; pour uploader une ou plusieurs images.
              Format recommandé : portrait (3:4), haute résolution. Les photos défilent automatiquement sur le site.
            </span>
          </CardContent>
        </Card>

        {/* Drop zone + Grid of slides */}
        {heroLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        ) : heroSlides.length === 0 ? (
          /* Drop zone when empty */
          <div
            onDragOver={handleHeroDragOver}
            onDrop={handleHeroDrop}
            onClick={() => !heroUploading && heroFileInputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all cursor-pointer",
              "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
              heroUploading && "opacity-50 cursor-not-allowed"
            )}
          >
            <Upload className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Aucune photo dans le carrousel</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Glissez-déposez des photos ici ou cliquez pour sélectionner
            </p>
          </div>
        ) : (
          <div
            onDragOver={handleHeroDragOver}
            onDrop={handleHeroDrop}
            className="space-y-4"
          >
            {/* Preview banner - mini carousel simulation */}
            <Card className="overflow-hidden">
              <div className="relative aspect-[21/9] bg-muted">
                <Image
                  src={heroSlides.find(s => s.active)?.imageUrl || heroSlides[0]?.imageUrl || '/kabyle-banner.png'}
                  alt="Aperçu carrousel"
                  fill
                  className="object-cover object-center"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 flex items-center gap-2 text-white">
                  <Play className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Aperçu du carrousel • {heroSlides.filter(s => s.active).length} photo{heroSlides.filter(s => s.active).length > 1 ? 's' : ''} active{heroSlides.filter(s => s.active).length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </Card>

            {/* Grid of slide thumbnails */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {heroSlides.map((slide, index) => (
                <Card
                  key={slide.id}
                  className={cn(
                    "group relative overflow-hidden transition-all hover:shadow-lg",
                    !slide.active && 'opacity-50'
                  )}
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image
                      src={slide.imageUrl}
                      alt={slide.alt}
                      fill
                      className="object-cover"
                      unoptimized
                    />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => openHeroEditDialog(slide)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleHeroActive(slide)}
                      >
                        {slide.active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setHeroDeleteSlide(slide)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Order badge */}
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {index + 1}
                    </div>

                    {/* Inactive badge */}
                    {!slide.active && (
                      <div className="absolute top-2 right-2 bg-gray-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                        Masqué
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2">
                    <p className="text-xs text-muted-foreground truncate">{slide.alt}</p>
                  </div>
                </Card>
              ))}

              {/* Add more card */}
              <div
                onClick={() => !heroUploading && heroFileInputRef.current?.click()}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border-2 border-dashed aspect-[3/4] transition-all cursor-pointer",
                  "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30",
                  heroUploading && "opacity-50 cursor-not-allowed"
                )}
              >
                {heroUploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
                ) : (
                  <>
                    <Plus className="h-8 w-8 text-muted-foreground/40" />
                    <span className="text-xs text-muted-foreground/60 mt-2">Ajouter</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2: STYLE SECTIONS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-6">
        {/* Divider */}
        <div className="border-t pt-6" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Sections Styles</h2>
            <p className="text-muted-foreground">
              Gérez les sections &quot;Nos Styles&quot; affichées sur la page d&apos;accueil
            </p>
          </div>
          <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un style
          </Button>
        </div>

        {/* Preview hint */}
        <Card className="border-dashed">
          <CardContent className="p-4 flex items-center gap-3 text-sm text-muted-foreground">
            <Palette className="h-5 w-5 shrink-0" />
            <span>
              Les modifications sont reflétées immédiatement sur la page d&apos;accueil.
              Vous pouvez réorganiser, modifier les images et les textes de chaque style.
            </span>
          </CardContent>
        </Card>

        {/* Styles Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : styles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Aucun style configuré</p>
            <p className="text-sm">Ajoutez des styles pour la section &quot;Nos Styles&quot; de l&apos;accueil</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {styles.map((style) => (
              <Card
                key={style.id}
                className={`group relative overflow-hidden transition-all hover:shadow-lg ${
                  !style.active ? 'opacity-60' : ''
                }`}
              >
                {/* Image */}
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={style.imageUrl}
                    alt={style.title}
                    fill
                    className="object-cover"
                    unoptimized={style.imageUrl.includes('picsum.photos')}
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${style.colorFrom} ${style.colorTo} opacity-60`}
                  />

                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditDialog(style)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toggleActive(style)}
                    >
                      {style.active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteStyle(style)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Order badge */}
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {style.sortOrder + 1}
                  </div>

                  {/* Active/Inactive badge */}
                  {!style.active && (
                    <div className="absolute top-2 right-2 bg-gray-500 text-white text-xs px-2 py-0.5 rounded-full">
                      Inactif
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="font-semibold text-sm">{style.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{style.description}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <LinkIcon className="h-3 w-3" />
                    <span className="truncate">{style.linkUrl}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          DIALOGS
          ═══════════════════════════════════════════════════════════════════ */}

      {/* Hero Slide Edit Dialog */}
      <Dialog open={heroEditDialogOpen} onOpenChange={setHeroEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la photo du carrousel</DialogTitle>
            <DialogDescription>
              Modifiez les informations de cette photo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Preview */}
            {heroEditSlide && (
              <div className="relative w-full h-60 rounded-lg overflow-hidden border">
                <Image
                  src={heroEditSlide.imageUrl}
                  alt={heroEditAlt}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            {/* Alt text */}
            <div className="space-y-2">
              <Label htmlFor="heroAlt">Texte alternatif</Label>
              <Input
                id="heroAlt"
                placeholder="Robe Kabyle - Collection..."
                value={heroEditAlt}
                onChange={(e) => setHeroEditAlt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Description courte pour l&apos;accessibilité et le SEO
              </p>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="heroActive"
                checked={heroEditActive}
                onCheckedChange={setHeroEditActive}
              />
              <Label htmlFor="heroActive">Afficher dans le carrousel</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setHeroEditDialogOpen(false)} disabled={heroSaving}>
              Annuler
            </Button>
            <Button onClick={handleHeroEditSave} disabled={heroSaving} className="bg-primary hover:bg-primary/90">
              {heroSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Mettre à jour'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hero Slide Delete Confirmation */}
      <AlertDialog open={!!heroDeleteSlide} onOpenChange={() => setHeroDeleteSlide(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la photo</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir retirer cette photo du carrousel hero ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={heroDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleHeroDelete}
              disabled={heroDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {heroDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Style Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editStyle ? 'Modifier le style' : 'Ajouter un style'}</DialogTitle>
            <DialogDescription>
              {editStyle
                ? 'Modifiez les informations du style'
                : 'Configurez un nouveau style pour la section "Nos Styles" de l\'accueil'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                placeholder="Cérémonie, Traditionnelle..."
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                placeholder="Robes de fête majestueuses"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL de l&apos;image *</Label>
              <div className="flex gap-2">
                <Input
                  id="imageUrl"
                  placeholder="https://exemple.com/image.jpg"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                />
              </div>
              {formImageUrl && (
                <div className="relative w-full h-40 rounded-lg overflow-hidden border mt-2">
                  <Image
                    src={formImageUrl}
                    alt="Aperçu"
                    fill
                    className="object-cover"
                    unoptimized={formImageUrl.includes('picsum.photos')}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${formColorFrom} ${formColorTo} opacity-50`} />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <h3 className="text-lg font-bold">{formTitle || 'Titre'}</h3>
                    <p className="text-sm text-white/80">{formDescription || 'Description'}</p>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Collez l&apos;URL d&apos;une image (ou utilisez une image Instagram, Facebook, etc.)
              </p>
            </div>

            {/* Link URL */}
            <div className="space-y-2">
              <Label htmlFor="linkUrl">Lien au clic</Label>
              <Input
                id="linkUrl"
                placeholder="/catalog"
                value={formLinkUrl}
                onChange={(e) => setFormLinkUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Page vers laquelle le style redirige (ex: /catalog, /order)
              </p>
            </div>

            {/* Color scheme */}
            <div className="space-y-2">
              <Label>Dégradé de couleurs</Label>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_OPTIONS.map((opt) => (
                  <button
                    key={`${opt.from}-${opt.to}`}
                    type="button"
                    onClick={() => {
                      setFormColorFrom(opt.from);
                      setFormColorTo(opt.to);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-colors ${
                      formColorFrom === opt.from && formColorTo === opt.to
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-md bg-gradient-to-t ${opt.from} ${opt.to} shrink-0`}
                    />
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sort order */}
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Position (ordre)</Label>
              <Input
                id="sortOrder"
                type="number"
                min="0"
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                0 = premier, 1 = deuxième, etc.
              </p>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={formActive}
                onCheckedChange={setFormActive}
              />
              <Label htmlFor="active">Afficher sur le site</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : editStyle ? (
                'Mettre à jour'
              ) : (
                'Créer le style'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Style Delete Confirmation */}
      <AlertDialog open={!!deleteStyle} onOpenChange={() => setDeleteStyle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le style</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le style &quot;{deleteStyle?.title}&quot; ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
