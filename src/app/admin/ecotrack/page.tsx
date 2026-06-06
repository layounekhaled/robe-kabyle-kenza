'use client';

import { useEffect, useState } from 'react';
import {
  Settings,
  Globe,
  Key,
  CheckCircle,
  XCircle,
  Loader2,
  Wifi,
  MapPin,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface EcotrackSettings {
  id?: string;
  apiUrl: string;
  apiToken: string;
  hasToken: boolean;
  active: boolean;
}

export default function EcotrackPage() {
  const [settings, setSettings] = useState<EcotrackSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [wilayasCount, setWilayasCount] = useState<number | null>(null);

  // Form state
  const [formApiUrl, setFormApiUrl] = useState('https://fret.ecotrack.dz');
  const [formApiToken, setFormApiToken] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [tokenChanged, setTokenChanged] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ecotrack');
      if (res.ok) {
        const data = await res.json();
        if (data.configured && data.settings) {
          setSettings(data.settings);
          setFormApiUrl(data.settings.apiUrl || 'https://fret.ecotrack.dz');
          setFormApiToken(''); // Never pre-fill token
          setFormActive(data.settings.active);
        }
      }
    } catch (error) {
      console.error('Error fetching ecotrack settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: Record<string, unknown> = {
        apiUrl: formApiUrl,
        active: formActive,
      };

      // Only send token if it was changed
      if (tokenChanged && formApiToken) {
        payload.apiToken = formApiToken;
      }

      const res = await fetch('/api/ecotrack', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setTokenChanged(false);
        setFormApiToken('');
        toast.success('Paramètres Ecotrack mis à jour avec succès');
        fetchSettings();
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

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const res = await fetch('/api/ecotrack?action=wilayas');
      if (res.ok) {
        const data = await res.json();
        const count = data.wilayas?.length || 0;
        setWilayasCount(count);
        setTestResult({
          success: true,
          message: `Connexion réussie ! ${count} wilayas chargées.`,
        });
        toast.success(`Connexion Ecotrack réussie - ${count} wilayas`);
      } else {
        const data = await res.json();
        setTestResult({
          success: false,
          message: data.error || 'Erreur de connexion à l\'API Ecotrack',
        });
        toast.error('Échec de la connexion à Ecotrack');
      }
    } catch {
      setTestResult({
        success: false,
        message: 'Impossible de se connecter au serveur Ecotrack',
      });
      toast.error('Impossible de se connecter à Ecotrack');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Paramètres Ecotrack</h2>
        <p className="text-muted-foreground">Configuration de l&apos;intégration Ecotrack pour la livraison</p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            État de la connexion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {settings?.hasToken ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Configuré
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  <XCircle className="mr-1 h-3 w-3" />
                  Non configuré
                </Badge>
              )}
            </div>
            {settings?.active ? (
              <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                Actif
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                Inactif
              </Badge>
            )}
            {wilayasCount !== null && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {wilayasCount} wilayas chargées
              </div>
            )}
          </div>

          {testResult && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm ${
                testResult.success
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {testResult.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration API
          </CardTitle>
          <CardDescription>
            Entrez vos identifiants API Ecotrack pour activer la livraison
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API URL */}
          <div className="space-y-2">
            <Label htmlFor="apiUrl" className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              URL de l&apos;API
            </Label>
            <Input
              id="apiUrl"
              placeholder="https://fret.ecotrack.dz"
              value={formApiUrl}
              onChange={(e) => setFormApiUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              L&apos;URL de base de l&apos;API Ecotrack
            </p>
          </div>

          {/* API Token */}
          <div className="space-y-2">
            <Label htmlFor="apiToken" className="flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              Token API
            </Label>
            <Input
              id="apiToken"
              type="password"
              placeholder={settings?.hasToken ? '•••••••••••• (laisser vide pour conserver)' : 'Entrez votre token API'}
              value={formApiToken}
              onChange={(e) => {
                setFormApiToken(e.target.value);
                setTokenChanged(true);
              }}
            />
            <p className="text-xs text-muted-foreground">
              {settings?.hasToken
                ? 'Un token est déjà configuré. Laissez vide pour le conserver.'
                : 'Votre clé API Ecotrack'}
            </p>
          </div>

          <Separator />

          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Activer l&apos;intégration Ecotrack</Label>
              <p className="text-xs text-muted-foreground">
                Active ou désactive la création automatique d&apos;expéditions
              </p>
            </div>
            <Switch checked={formActive} onCheckedChange={setFormActive} />
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-primary/90"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer les paramètres'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing}
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Test en cours...
                </>
              ) : (
                <>
                  <Wifi className="mr-2 h-4 w-4" />
                  Tester la connexion
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Ecotrack</strong> est un service de livraison en Algérie qui permet d&apos;expédier
            des colis vers toutes les wilayas.
          </p>
          <p>
            Lorsqu&apos;une commande passe au statut &quot;Confirmée&quot;, une expédition Ecotrack est
            automatiquement créée si l&apos;intégration est active et configurée.
          </p>
          <p>
            Le numéro de suivi sera automatiquement renseigné dans les détails de la commande.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
