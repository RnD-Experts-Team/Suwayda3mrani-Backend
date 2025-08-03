// resources/js/pages/Stories/Edit.tsx

import { useState, useEffect } from 'react';
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

interface Story {
  id: number;
  story_id: string;
  url_slug: string;
  external_url?: string;
  background_image_path?: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

interface Props {
  story: Story;
  translations: {
    title_en: string;
    title_ar: string;
    description_en: string;
    description_ar: string;
  };
  mediaItems: MediaItem[];
  attachedMediaIds: number[];
}

export default function StoriesEdit({ 
  story, 
  translations, 
  mediaItems, 
  attachedMediaIds 
}: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Stories of Hope', href: '/stories' },
    { title: 'Edit', href: `/stories/${story.id}/edit` },
  ];

  const { data, setData, post, processing, errors } = useForm({
    _method: 'PUT',
    title_en: translations.title_en || '',
    title_ar: translations.title_ar || '',
    description_en: translations.description_en || '',
    description_ar: translations.description_ar || '',
    background_image: null as File | null,
    external_url: story.external_url || '',
    is_active: story.is_active,
    is_featured: story.is_featured,
    media_ids: attachedMediaIds,
  });

  const [selectedMediaItems, setSelectedMediaItems] = useState<MediaItem[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentBackgroundImage, setCurrentBackgroundImage] = useState<string | null>(
    story.background_image_path ? `/storage/${story.background_image_path}` : null
  );

  useEffect(() => {
    // Initialize selected media items
    const selected = mediaItems.filter(item => attachedMediaIds.includes(item.id));
    setSelectedMediaItems(selected);
  }, [mediaItems, attachedMediaIds]);

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
        setCurrentBackgroundImage(null); // Hide current image when new one is selected
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setData('background_image', null);
    setImagePreview(null);
    setCurrentBackgroundImage(story.background_image_path ? `/storage/${story.background_image_path}` : null);
    // Reset file input
    const fileInput = document.getElementById('background_image') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(`/stories/${story.id}`);
  };

  const getMediaIcon = (type: string, sourceType: string) => {
    if (type === 'video') return <Video className="w-4 h-4" />;
    if (sourceType === 'upload') return <Upload className="w-4 h-4" />;
    if (sourceType === 'external_link') return <ExternalLink className="w-4 h-4" />;
    return <Image className="w-4 h-4" />;
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit Story - ${translations.title_en || 'Untitled'}`} />
      
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Edit Story of Hope</h1>
            <p className="text-sm text-muted-foreground">
              Update story details and settings
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="font-mono">#{story.story_id}</Badge>
            <Badge variant={data.is_active ? 'default' : 'secondary'}>
              {data.is_active ? 'Active' : 'Inactive'}
            </Badge>
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
                      
                      {/* Current Background Image */}
                      {currentBackgroundImage && !imagePreview && (
                        <div className="relative">
                          <img
                            src={currentBackgroundImage}
                            alt="Current background"
                            className="w-full h-48 object-cover rounded-lg border"
                          />
                          <Badge variant="secondary" className="absolute top-2 left-2">
                            Current Image
                          </Badge>
                        </div>
                      )}
                      
                      {/* New Image Preview */}
                      {imagePreview && (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="New background preview"
                            className="w-full h-48 object-cover rounded-lg border"
                          />
                          <Badge variant="default" className="absolute top-2 left-2">
                            New Image
                          </Badge>
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

                  {/* Status Toggles */}
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-3 py-2">
                      <Switch
                        checked={data.is_active}
                        onCheckedChange={(checked) => setData('is_active', checked)}
                      />
                      <div>
                        <Label className="text-sm font-medium leading-none">
                          Active Story
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Make this story visible in the system
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
                          Featured Story
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Make this story featured on the aid efforts page
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
                      {processing ? 'Updating...' : 'Update Story'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Story Info */}
            <Card>
              <CardHeader className="px-6 py-4 border-b">
                <CardTitle className="text-lg font-semibold">Story Info</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Story ID:</span>
                    <span className="font-mono">{story.story_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">URL Slug:</span>
                    <span className="font-mono text-xs">{story.url_slug}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(story.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Updated:</span>
                    <span>{new Date(story.updated_at).toLocaleDateString()}</span>
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
