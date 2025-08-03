// resources/js/pages/Stories/Show.tsx

import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, ExternalLink, Heart, Image, Video, Upload
} from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

interface MediaItem {
  id: number;
  media_id: string;
  type: 'image' | 'video';
  source_type: 'upload' | 'google_drive' | 'external_link';
  translated_content: {
    title?: { en: string; ar: string };
    description?: { en: string; ar: string };
    url: string;
    thumbnail?: string;
  };
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
  translated_content: {
    title: { en: string; ar: string };
    description: { en: string; ar: string };
    backgroundImage?: string;
    url: string;
  };
}

interface Props {
  story: Story;
  attachedMedia: MediaItem[];
}

export default function StoriesShow({ story, attachedMedia }: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Stories of Hope', href: '/stories' },
    { title: 'View', href: `/stories/${story.id}` },
  ];

  const getMediaIcon = (type: string, sourceType: string) => {
    if (type === 'video') return <Video className="w-4 h-4" />;
    if (sourceType === 'upload') return <Upload className="w-4 h-4" />;
    if (sourceType === 'external_link') return <ExternalLink className="w-4 h-4" />;
    return <Image className="w-4 h-4" />;
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Story - ${story.translated_content.title.en || 'Untitled'}`} />
      
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500" />
              {story.translated_content.title.en || 'Untitled Story'}
            </h1>
            <p className="text-sm text-muted-foreground" dir="rtl">
              {story.translated_content.title.ar || 'قصة بدون عنوان'}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="font-mono">
              #{story.story_id}
            </Badge>
            <Badge variant="secondary">
              Hope Story
            </Badge>
            {story.is_featured && (
              <Badge variant="default">Featured</Badge>
            )}
            {!story.is_active && (
              <Badge variant="destructive">Inactive</Badge>
            )}
            <Link href={`/stories/${story.id}/edit`}>
              <Button size="sm" className="gap-2">
                <Edit className="w-4 h-4" />
                Edit Story
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl">
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            {story.translated_content.backgroundImage && (
              <Card className="overflow-hidden">
                <div className="aspect-[16/9] bg-muted">
                  <img
                    src={story.translated_content.backgroundImage}
                    alt={story.translated_content.title.en}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Card>
            )}

            {/* Story Content */}
            <Card className="overflow-hidden">
              <CardHeader className="px-6 py-4 border-b">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Story of Hope
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* English Description */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-base">Story (English)</h3>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {story.translated_content.description.en || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  {/* Arabic Description */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-base" dir="rtl">القصة (العربية)</h3>
                    <div className="p-4 bg-muted/50 rounded-lg" dir="rtl">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {story.translated_content.description.ar || 'لا يوجد وصف متاح.'}
                      </p>
                    </div>
                  </div>

                  {/* External URL */}
                  {story.external_url && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-2">External Source</p>
                      <a
                        href={story.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Read Full Story
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Attached Media */}
            {attachedMedia.length > 0 && (
              <Card className="overflow-hidden">
                <CardHeader className="px-6 py-4 border-b">
                  <CardTitle className="text-lg font-semibold">
                    Supporting Media ({attachedMedia.length} items)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {attachedMedia.map((media) => (
                      <div key={media.id} className="border rounded-lg overflow-hidden">
                        <div className="aspect-video bg-muted flex items-center justify-center">
                          {media.translated_content.thumbnail || media.translated_content.url ? (
                            <img
                              src={media.translated_content.thumbnail || media.translated_content.url}
                              alt={media.translated_content.title?.en || 'Media'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              {getMediaIcon(media.type, media.source_type)}
                              <span className="text-xs">No preview</span>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="text-xs">
                              {media.type}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {media.source_type}
                            </Badge>
                          </div>
                          {media.translated_content.title && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium truncate">
                                {media.translated_content.title.en}
                              </p>
                              <p className="text-xs text-muted-foreground truncate" dir="rtl">
                                {media.translated_content.title.ar}
                              </p>
                            </div>
                          )}
                          {media.translated_content.url && (
                            <a
                              href={media.translated_content.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-2"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View Media
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Story Information */}
            <Card>
              <CardHeader className="px-6 py-4 border-b">
                <CardTitle className="text-lg font-semibold">Story Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Story ID</p>
                    <p className="text-sm font-mono">{story.story_id}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">URL Slug</p>
                    <p className="text-sm font-mono">{story.url_slug}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant={story.is_active ? 'default' : 'secondary'}>
                        {story.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {story.is_featured && (
                        <Badge variant="default">Featured</Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p className="text-sm">
                      {new Date(story.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                    <p className="text-sm">
                      {new Date(story.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader className="px-6 py-4 border-b">
                <CardTitle className="text-lg font-semibold">Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Link href={`/stories/${story.id}/edit`} className="w-full">
                    <Button className="w-full gap-2">
                      <Edit className="w-4 h-4" />
                      Edit Story
                    </Button>
                  </Link>
                  
                  <Link href="/stories" className="w-full">
                    <Button variant="outline" className="w-full">
                      ← Back to Stories
                    </Button>
                  </Link>

                  {story.external_url && (
                    <a
                      href={story.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button variant="outline" className="w-full gap-2">
                        <ExternalLink className="w-4 h-4" />
                        View External Source
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Impact Stats */}
            <Card>
              <CardHeader className="px-6 py-4 border-b">
                <CardTitle className="text-lg font-semibold">Impact</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Media Items</span>
                    <Badge variant="secondary">{attachedMedia.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Featured</span>
                    <Badge variant={story.is_featured ? 'default' : 'secondary'}>
                      {story.is_featured ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">External Link</span>
                    <Badge variant={story.external_url ? 'default' : 'secondary'}>
                      {story.external_url ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
