// resources/js/pages/TimelineEvents/Create.tsx

import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, Calendar, Image, Video, FileText, X, Plus } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

interface MediaItem {
  id: number;
  media_id: string;
  type: 'image' | 'video' | 'document';
  title: string;
  url: string;
  thumbnail: string;
}

interface Props {
  mediaItems: MediaItem[];
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Timeline Events', href: '/timeline-events' },
  { title: 'Create', href: '/timeline-events/create' },
];

export default function TimelineEventCreate({ mediaItems }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    period: '',
    is_highlighted: false,
    sort_order: 0,
    media_ids: [] as number[],
    title: {
      en: '',
      ar: '',
    },
    description: {
      en: '',
      ar: '',
    },
  });

  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);

  const handleMediaSelect = (mediaItem: MediaItem, checked: boolean) => {
    if (checked) {
      setSelectedMedia(prev => [...prev, mediaItem]);
      setData('media_ids', [...data.media_ids, mediaItem.id]);
    } else {
      setSelectedMedia(prev => prev.filter(m => m.id !== mediaItem.id));
      setData('media_ids', data.media_ids.filter(id => id !== mediaItem.id));
    }
  };

  const removeSelectedMedia = (mediaId: number) => {
    setSelectedMedia(prev => prev.filter(m => m.id !== mediaId));
    setData('media_ids', data.media_ids.filter(id => id !== mediaId));
  };

  const reorderMedia = (fromIndex: number, toIndex: number) => {
    const newSelectedMedia = [...selectedMedia];
    const [movedMedia] = newSelectedMedia.splice(fromIndex, 1);
    newSelectedMedia.splice(toIndex, 0, movedMedia);
    
    setSelectedMedia(newSelectedMedia);
    setData('media_ids', newSelectedMedia.map(m => m.id));
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/timeline-events');
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Timeline Event" />
      
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Create Timeline Event</h1>
            <p className="text-sm text-muted-foreground">Add a new historical event to the timeline</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardHeader className="px-6 py-4 border-b">
                <CardTitle className="text-lg font-semibold">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Basic Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label htmlFor="period">Period *</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            id="period"
                            type="text"
                            placeholder="e.g., 1980s - 1990, 1994, 2000-2010"
                            value={data.period}
                            onChange={(e) => setData('period', e.target.value)}
                            className={`pl-10 ${errors.period ? 'border-destructive' : ''}`}
                          />
                        </div>
                        {errors.period && (
                          <p className="text-sm text-destructive">{errors.period}</p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="sort_order">Sort Order</Label>
                        <Input
                          id="sort_order"
                          type="number"
                          placeholder="0"
                          value={data.sort_order}
                          onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                          className={errors.sort_order ? 'border-destructive' : ''}
                        />
                        {errors.sort_order && (
                          <p className="text-sm text-destructive">{errors.sort_order}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Multilingual Content */}
                  <div className="space-y-6">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Content
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* English Content */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm text-muted-foreground">English Content</h4>
                        
                        <div className="space-y-3">
                          <Label htmlFor="title_en">Title *</Label>
                          <Input
                            id="title_en"
                            type="text"
                            placeholder="Enter English title"
                            value={data.title.en}
                            onChange={(e) => setData('title', { ...data.title, en: e.target.value })}
                            className={errors['title.en'] ? 'border-destructive' : ''}
                          />
                          {errors['title.en'] && (
                            <p className="text-sm text-destructive">{errors['title.en']}</p>
                          )}
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="description_en">Description *</Label>
                          <Textarea
                            id="description_en"
                            placeholder="Enter English description"
                            value={data.description.en}
                            onChange={(e) => setData('description', { ...data.description, en: e.target.value })}
                            rows={6}
                            className={errors['description.en'] ? 'border-destructive' : ''}
                          />
                          {errors['description.en'] && (
                            <p className="text-sm text-destructive">{errors['description.en']}</p>
                          )}
                        </div>
                      </div>

                      {/* Arabic Content */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm text-muted-foreground">Arabic Content</h4>
                        
                        <div className="space-y-3">
                          <Label htmlFor="title_ar">Title *</Label>
                          <Input
                            id="title_ar"
                            type="text"
                            placeholder="أدخل العنوان بالعربية"
                            value={data.title.ar}
                            onChange={(e) => setData('title', { ...data.title, ar: e.target.value })}
                            className={errors['title.ar'] ? 'border-destructive' : ''}
                            dir="rtl"
                          />
                          {errors['title.ar'] && (
                            <p className="text-sm text-destructive">{errors['title.ar']}</p>
                          )}
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="description_ar">Description *</Label>
                          <Textarea
                            id="description_ar"
                            placeholder="أدخل الوصف بالعربية"
                            value={data.description.ar}
                            onChange={(e) => setData('description', { ...data.description, ar: e.target.value })}
                            rows={6}
                            className={errors['description.ar'] ? 'border-destructive' : ''}
                            dir="rtl"
                          />
                          {errors['description.ar'] && (
                            <p className="text-sm text-destructive">{errors['description.ar']}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 py-2">
                      <Switch
                        checked={data.is_highlighted}
                        onCheckedChange={(checked) => setData('is_highlighted', checked)}
                      />
                      <div>
                        <Label className="text-sm font-medium leading-none">
                          Highlighted Event
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Mark this event as highlighted on the timeline
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
                      {processing ? 'Creating...' : 'Create Timeline Event'}
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
                  {/* Period Display */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {data.period || 'Period not set'}
                    </span>
                  </div>

                  {/* Title Preview */}
                  <div>
                    <h3 className="font-medium text-sm">
                      {data.title.en || 'Event title will appear here'}
                    </h3>
                    {data.title.ar && (
                      <h3 className="font-medium text-sm text-muted-foreground mt-1" dir="rtl">
                        {data.title.ar}
                      </h3>
                    )}
                  </div>

                  {/* Description Preview */}
                  {data.description.en && (
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {data.description.en}
                    </p>
                  )}

                  {/* Status */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Highlighted:</span>
                      <span>{data.is_highlighted ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Sort Order:</span>
                      <span>{data.sort_order}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Media:</span>
                      <span>{selectedMedia.length} selected</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Media */}
            {selectedMedia.length > 0 && (
              <Card>
                <CardHeader className="px-6 py-4 border-b">
                  <CardTitle className="text-lg font-semibold">
                    Selected Media ({selectedMedia.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    {selectedMedia.map((media, index) => (
                      <div key={media.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {getMediaIcon(media.type)}
                            <span className="text-xs text-muted-foreground">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{media.title}</p>
                            <p className="text-xs text-muted-foreground capitalize">{media.type}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSelectedMedia(media.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Media Selection */}
            <Card>
              <CardHeader className="px-6 py-4 border-b">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Media Selection
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select media items for this timeline event
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {mediaItems.length > 0 ? (
                    mediaItems.map((media) => (
                      <div key={media.id} className="flex items-center gap-3 p-2">
                        <Checkbox
                          checked={data.media_ids.includes(media.id)}
                          onCheckedChange={(checked) => handleMediaSelect(media, Boolean(checked))}
                        />
                        <div className="w-12 h-12 bg-muted rounded overflow-hidden">
                          <img
                            src={media.thumbnail}
                            alt={media.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{media.title}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {media.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {media.media_id}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Image className="mx-auto w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No media items available. Upload some media first.
                      </p>
                    </div>
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
