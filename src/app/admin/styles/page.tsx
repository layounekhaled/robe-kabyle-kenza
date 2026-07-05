'use client';

import { useEffect, useState, useCallback } from 'react';
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

const COLOR_OPTIONS = [
  { from: 'from-kabyle-red/80', to: 'to-kabyle-terracotta/80', label: 'Rouge / Terracotta' },
  { from: 'from-kabyle-terracotta/80', to: 'to-kabyle-gold/80', label: 'Terracotta / Or' },
  { from: 'from-kabyle-gold/80', to: 'to-kabyle-olive/80', label: 'Or / Olive' },
  { from: 'from-kabyle-olive/80', to: 'to-kabyle-dark/60', label: 'Olive / Sombre' },
  { from: 'from-kabyle-terracotta/80', to: 'to-kabyle-red/80', label: 'Terracotta / Rouge' },
  { from: 'from-kabyle-gold/80', to: 'to-kabyle-terracotta/80', label: 'Or / Terracotta' },
];

export default function StylesPage() {
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
    fetchStyles();
  }, [fetchStyles]);

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

  const selectedColorOption = COLOR_OPTIONS.find(
    (c) => c.from === formColorFrom && c.to === formColorTo
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Styles Accueil</h2>
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

      {/* Create/Edit Dialog */}
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

      {/* Delete Confirmation */}
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
