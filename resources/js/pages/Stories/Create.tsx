// resources/js/pages/Stories/Create.tsx

import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Heart, Image, Video, ExternalLink, Upload
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

interface Props {
  mediaItems: MediaItem[];
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Stories of Hope', href: '/stories' },
  { title: 'Create', href: '/stories/create' },
];

export default function StoriesCreate({ mediaItems }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    title_en: '',
    title_ar: '',
    description_en: '',
    description_ar: '',
    background_image: null as File | null,
    external_url: '',
    is_featured: false,
    media_ids: [] as number[],
  });

  const [selectedMediaItems, setSelectedMediaItems] = useState<MediaItem[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleMediaToggle = (mediaItem: MediaItem, checked: boolean) => {
    if (checked) {
      setSelectedMediaItems(prev => [...prev, mediaItem]);
      setData('media_ids', [...data.media_ids, mediaItem.id]);
    } else {
      setSelectedMediaItems(prev => prev.filter(item => item.id !== mediaItem.id));
      setData('media_ids', data.media_ids.filter(id => id !== mediaItem.id));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setData('background_image', file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setData('background_image', null);
    setImagePreview(null);
    // Reset file input
    const fileInput = document.getElementById('background_image') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/stories');
  };

  const getMediaIcon = (type: string, sourceType: string) => {
    if (type === 'video') return <Video className="w-4 h-4" />;
    if (sourceType === 'upload') return <Upload className="w-4 h-4" />;
    if (sourceType === 'external_link') return <ExternalLink className="w-4 h-4" />;
    return <Image className="w-4 h-4" />;
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Story of Hope" />
      
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Create New Story of Hope</h1>
            <p className="text-sm text-muted-foreground">Share inspiring stories of resilience and hope</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="px-6 py-4 border-b">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Story Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Multilingual Titles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="title_en">Title (English) *</Label>
                      <Input
                        id="title_en"
                        type="text"
                        placeholder="Story title in English"
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
                        placeholder="عنوان القصة بالعربية"
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
                      <Label htmlFor="description_en">Description (English) *</Label>
                      <Textarea
                        id="description_en"
                        placeholder="Tell the inspiring story in English"
                        value={data.description_en}
                        onChange={(e) => setData('description_en', e.target.value)}
                        rows={6}
                        className={errors.description_en ? 'border-destructive' : ''}
                      />
                      {errors.description_en && (
                        <p className="text-sm text-destructive">{errors.description_en}</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="description_ar">Description (Arabic) *</Label>
                      <Textarea
                        id="description_ar"
                        placeholder="احكِ القصة الملهمة بالعربية"
                        value={data.description_ar}
                        onChange={(e) => setData('description_ar', e.target.value)}
                        rows={6}
                        className={errors.description_ar ? 'border-destructive' : ''}
                        dir="rtl"
                      />
                      {errors.description_ar && (
                        <p className="text-sm text-destructive">{errors.description_ar}</p>
                      )}
                    </div>
                  </div>

                  {/* Background Image Upload */}
                  <div className="space-y-3">
                    <Label htmlFor="background_image">Background Image</Label>
                    <div className="space-y-4">
                      <Input
                        id="background_image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className={errors.background_image ? 'border-destructive' : ''}
                      />
                      {errors.background_image && (
                        <p className="text-sm text-destructive">{errors.background_image}</p>
                      )}
                      
                      {imagePreview && (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Background preview"
                            className="w-full h-48 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            onClick={removeImage}
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* External URL */}
                  <div className="space-y-3">
                    <Label htmlFor="external_url">External URL (Optional)</Label>
                    <Input
                      id="external_url"
                      type="url"
                      placeholder="https://example.com/full-story"
                      value={data.external_url}
                      onChange={(e) => setData('external_url', e.target.value)}
                      className={errors.external_url ? 'border-destructive' : ''}
                    />
                    {errors.external_url && (
                      <p className="text-sm text-destructive">{errors.external_url}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Link to the full story or external source
                    </p>
                  </div>

                  {/* Featured Toggle */}
                  <div className="flex items-center gap-3 py-4 border-t">
                    <Switch
                      checked={data.is_featured}
                      onCheckedChange={(checked) => setData('is_featured', checked)}
                    />
                    <div>
                      <Label className="text-sm font-medium leading-none">
                        Featured Story
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Make this story featured on the aid efforts page
                      </p>
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
                      {processing ? 'Creating...' : 'Create Story'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Preview */}
            <Card>
              <CardHeader className="px-6 py-4 border-b">
                <CardTitle className="text-lg font-semibold">Preview</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Background Image Preview */}
                  <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Story preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <Heart className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-xs">No image selected</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="font-medium text-sm">
                      {data.title_en || 'Story title'}
                    </h3>
                    <p className="text-xs text-muted-foreground" dir="rtl">
                      {data.title_ar || 'عنوان القصة'}
                    </p>
                  </div>

                  {/* Description */}
                  {(data.description_en || data.description_ar) && (
                    <div className="space-y-2">
                      {data.description_en && (
                        <p className="text-xs text-muted-foreground line-clamp-4">
                          {data.description_en}
                        </p>
                      )}
                      {data.description_ar && (
                        <p className="text-xs text-muted-foreground line-clamp-4" dir="rtl">
                          {data.description_ar}
                        </p>
                      )}
                    </div>
                  )}

                  {/* External URL */}
                  {data.external_url && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">External Link:</p>
                      <a
                        href={data.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 break-all"
                      >
                        {data.external_url}
                      </a>
                    </div>
                  )}

                  {/* Featured Status */}
                  {data.is_featured && (
                    <Badge variant="default" className="text-xs">
                      Featured
                    </Badge>
                  )}
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
