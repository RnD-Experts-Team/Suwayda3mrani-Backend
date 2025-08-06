// resources/js/pages/Cases/Edit.tsx

import { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar, Plus, Trash2, Image, Video, ExternalLink, Upload
} from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

interface MediaItem {
  id: number;
  media_id: string;
  type: 'image' | 'video';
  source_type: 'upload' | 'google_drive' | 'external_link';
  title: { en: string; ar: string };
  url: string;
  thumbnail?: string;
}

interface Detail {
  id?: number;
  key_en: string;
  key_ar: string;
  value_en: string;
  value_ar: string;
}

interface Case {
  id: number;
  case_id: string;
  type: string;
  url_slug: string;
  external_url?: string;
  incident_date: string;
  location: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

interface Props {
  case: Case;
  translations: {
    title_en: string;
    title_ar: string;
    description_en?: string;
    description_ar?: string;
  };
  details: Detail[];
  caseTypes: Record<string, { en: string; ar: string }>;
  mediaItems: MediaItem[];
  attachedMediaIds: number[];
}

export default function CasesEdit({ 
  case: caseData, 
  translations, 
  details, 
  caseTypes, 
  mediaItems, 
  attachedMediaIds 
}: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Cases', href: '/cases' },
    { title: 'Edit', href: `/cases/${caseData.id}/edit` },
  ];

  const { data, setData, post, processing, errors } = useForm({
    _method: 'PUT',
    title_en: translations.title_en || '',
    title_ar: translations.title_ar || '',
    description_en: translations.description_en || '',
    description_ar: translations.description_ar || '',
    type: caseData.type,
    incident_date: caseData.incident_date,
    location: caseData.location || '',
    external_url: caseData.external_url || '',
    is_active: caseData.is_active,
    is_featured: caseData.is_featured,
    media_ids: attachedMediaIds,
    details: details,
  });

  const [selectedMediaItems, setSelectedMediaItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    // Initialize selected media items
    const selected = mediaItems.filter(item => attachedMediaIds.includes(item.id));
    setSelectedMediaItems(selected);
  }, [mediaItems, attachedMediaIds]);

  const handleAddDetail = () => {
    setData('details', [...data.details, {
      key_en: '',
      key_ar: '',
      value_en: '',
      value_ar: '',
    }]);
  };

  const handleRemoveDetail = (index: number) => {
    const newDetails = data.details.filter((_, i) => i !== index);
    setData('details', newDetails);
  };

  const handleDetailChange = (index: number, field: keyof Detail, value: string) => {
    const newDetails = [...data.details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setData('details', newDetails);
  };

  const handleMediaToggle = (mediaItem: MediaItem, checked: boolean) => {
    if (checked) {
      setSelectedMediaItems(prev => [...prev, mediaItem]);
      setData('media_ids', [...data.media_ids, mediaItem.id]);
    } else {
      setSelectedMediaItems(prev => prev.filter(item => item.id !== mediaItem.id));
      setData('media_ids', data.media_ids.filter(id => id !== mediaItem.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(`/cases/${caseData.id}`);
  };

  const getMediaIcon = (type: string, sourceType: string) => {
    if (type === 'video') return <Video className="w-4 h-4" />;
    if (sourceType === 'upload') return <Upload className="w-4 h-4" />;
    if (sourceType === 'external_link') return <ExternalLink className="w-4 h-4" />;
    return <Image className="w-4 h-4" />;
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit Case - ${translations.title_en || 'Untitled'}`} />
      
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Edit Case</h1>
            <p className="text-sm text-muted-foreground">
              Update case details and settings
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="font-mono">#{caseData.case_id}</Badge>
            <Badge variant={data.is_active ? 'default' : 'secondary'}>
              {data.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="px-6 py-4 border-b">
                <CardTitle className="text-lg font-semibold">Case Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Case Type */}
                  <div className="space-y-3">
                    <Label htmlFor="type">Case Type *</Label>
                    <Select value={data.type} onValueChange={(value) => setData('type', value)}>
                      <SelectTrigger className={errors.type ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select case type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(caseTypes).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label.en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <p className="text-sm text-destructive">{errors.type}</p>
                    )}
                  </div>

                  {/* Multilingual Titles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="title_en">Title (English) *</Label>
                      <Input
                        id="title_en"
                        type="text"
                        placeholder="Case title in English"
                        value={data.title_en}
                        onChange={(e) => setData('title_en', e.target.value)}
                        className={errors.title_en ? 'border-destructive' : ''}
                      />
                      {errors.title_en && (
                        <p className="text-sm text-destructive">{errors.title_en}</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="title_ar">Title (Arabic) *</Label>
                      <Input
                        id="title_ar"
                        type="text"
                        placeholder="عنوان القضية بالعربية"
                        value={data.title_ar}
                        onChange={(e) => setData('title_ar', e.target.value)}
                        className={errors.title_ar ? 'border-destructive' : ''}
                        dir="rtl"
                      />
                      {errors.title_ar && (
                        <p className="text-sm text-destructive">{errors.title_ar}</p>
                      )}
                    </div>
                  </div>

                  {/* Multilingual Descriptions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="description_en">Description (English)</Label>
                      <Textarea
                        id="description_en"
                        placeholder="Case description in English"
                        value={data.description_en}
                        onChange={(e) => setData('description_en', e.target.value)}
                        rows={4}
                        className={errors.description_en ? 'border-destructive' : ''}
                      />
                      {errors.description_en && (
                        <p className="text-sm text-destructive">{errors.description_en}</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="description_ar">Description (Arabic)</Label>
                      <Textarea
                        id="description_ar"
                        placeholder="وصف القضية بالعربية"
                        value={data.description_ar}
                        onChange={(e) => setData('description_ar', e.target.value)}
                        rows={4}
                        className={errors.description_ar ? 'border-destructive' : ''}
                        dir="rtl"
                      />
                      {errors.description_ar && (
                        <p className="text-sm text-destructive">{errors.description_ar}</p>
                      )}
                    </div>
                  </div>

                  {/* Case Details */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="incident_date">Incident Date *</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            id="incident_date"
                            type="date"
                            value={data.incident_date}
                            onChange={(e) => setData('incident_date', e.target.value)}
                            className={`pl-10 ${errors.incident_date ? 'border-destructive' : ''}`}
                          />
                        </div>
                        {errors.incident_date && (
                          <p className="text-sm text-destructive">{errors.incident_date}</p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          type="text"
                          placeholder="Case location"
                          value={data.location}
                          onChange={(e) => setData('location', e.target.value)}
                          className={errors.location ? 'border-destructive' : ''}
                        />
                        {errors.location && (
                          <p className="text-sm text-destructive">{errors.location}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="external_url">External URL</Label>
                      <Input
                        id="external_url"
                        type="url"
                        placeholder="https://example.com/case-documentation"
                        value={data.external_url}
                        onChange={(e) => setData('external_url', e.target.value)}
                        className={errors.external_url ? 'border-destructive' : ''}
                      />
                      {errors.external_url && (
                        <p className="text-sm text-destructive">{errors.external_url}</p>
                      )}
                    </div>
                  </div>

                  {/* Status Toggles */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 py-2">
                      <Switch
                        checked={data.is_active}
                        onCheckedChange={(checked) => setData('is_active', checked)}
                      />
                      <div>
                        <Label className="text-sm font-medium leading-none">
                          Active Case
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Make this case visible in the system
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 py-2">
                      <Switch
                        checked={data.is_featured}
                        onCheckedChange={(checked) => setData('is_featured', checked)}
                      />
                      <div>
                        <Label className="text-sm font-medium leading-none">
                          Featured Case
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Make this case featured on the data overview page
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => window.history.back()}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={processing}
                      className="gap-2"
                    >
                      {processing ? 'Updating...' : 'Update Case'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Case Details Section */}
            <Card className="overflow-hidden">
              <CardHeader className="px-6 py-4 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold">Case Details</CardTitle>
                  <Button 
                    type="button" 
                    onClick={handleAddDetail}
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Detail
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {data.details.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No case details added yet.</p>
                    <p className="text-sm">Click "Add Detail" to add key-value pairs for this case.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.details.map((detail, index) => (
                      <div key={index} className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 border rounded-lg">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Key (English)</Label>
                            <Input
                              placeholder="e.g., Location"
                              value={detail.key_en}
                              onChange={(e) => handleDetailChange(index, 'key_en', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Key (Arabic)</Label>
                            <Input
                              placeholder="مثال: الموقع"
                              value={detail.key_ar}
                              onChange={(e) => handleDetailChange(index, 'key_ar', e.target.value)}
                              dir="rtl"
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Value (English)</Label>
                            <Input
                              placeholder="e.g., Village A"
                              value={detail.value_en}
                              onChange={(e) => handleDetailChange(index, 'value_en', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Value (Arabic)</Label>
                            <Input
                              placeholder="مثال: القرية أ"
                              value={detail.value_ar}
                              onChange={(e) => handleDetailChange(index, 'value_ar', e.target.value)}
                              dir="rtl"
                            />
                          </div>
                        </div>
                        <div className="lg:col-span-2 flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveDetail(index)}
                            className="text-destructive hover:text-destructive gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Case Info */}
            <Card>
              <CardHeader className="px-6 py-4 border-b">
                <CardTitle className="text-lg font-semibold">Case Info</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Case ID:</span>
                    <span className="font-mono">{caseData.case_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="capitalize">{caseTypes[data.type]?.en || data.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(caseData.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Updated:</span>
                    <span>{new Date(caseData.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Media Selection */}
            <Card>
              <CardHeader className="px-6 py-4 border-b">
                <CardTitle className="text-lg font-semibold">
                  Attach Media ({selectedMediaItems.length} selected)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {mediaItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No media items available
                    </p>
                  ) : (
                    mediaItems.map((media) => (
                      <div key={media.id} className="flex items-center space-x-3 p-2 border rounded">
                        <Checkbox
                          checked={data.media_ids.includes(media.id)}
                          onCheckedChange={(checked) => handleMediaToggle(media, Boolean(checked))}
                        />
                        
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center overflow-hidden">
                          {media.thumbnail || media.url ? (
                            <img
                              src={media.thumbnail || media.url}
                              alt={media.title.en}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            getMediaIcon(media.type, media.source_type)
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {media.title.en || media.media_id}
                          </p>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {media.type}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {media.source_type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
