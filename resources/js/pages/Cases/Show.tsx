// resources/js/pages/Cases/Show.tsx

import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, ExternalLink, Calendar, MapPin, Image, Video, Upload
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
  translated_content: {
    title: { en: string; ar: string };
    description?: { en: string; ar: string } | null;
    details: Array<{
      key: { en: string; ar: string };
      value: { en: string; ar: string };
      sort_order: number;
    }>;
  };
}

interface Props {
  case: Case;
  attachedMedia: MediaItem[];
  caseTypes: Record<string, { en: string; ar: string }>;
}

export default function CasesShow({ case: caseData, attachedMedia, caseTypes }: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Cases', href: '/cases' },
    { title: 'View', href: `/cases/${caseData.id}` },
  ];

  const getMediaIcon = (type: string, sourceType: string) => {
    if (type === 'video') return <Video className="w-4 h-4" />;
    if (sourceType === 'upload') return <Upload className="w-4 h-4" />;
    if (sourceType === 'external_link') return <ExternalLink className="w-4 h-4" />;
    return <Image className="w-4 h-4" />;
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Case - ${caseData.translated_content.title.en || 'Untitled'}`} />
      
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {caseData.translated_content.title.en || 'Untitled Case'}
            </h1>
            <p className="text-sm text-muted-foreground" dir="rtl">
              {caseData.translated_content.title.ar || 'قضية بدون عنوان'}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="font-mono">
              #{caseData.case_id}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {caseTypes[caseData.type]?.en || caseData.type}
            </Badge>
            {caseData.is_featured && (
              <Badge variant="default">Featured</Badge>
            )}
            {!caseData.is_active && (
              <Badge variant="destructive">Inactive</Badge>
            )}
            <Link href={`/cases/${caseData.id}/edit`}>
              <Button size="sm" className="gap-2">
                <Edit className="w-4 h-4" />
                Edit Case
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl">
          <div className="lg:col-span-2 space-y-6">
            {/* Case Overview */}
            <Card className="overflow-hidden">
              <CardHeader className="px-6 py-4 border-b">
                <CardTitle className="text-lg font-semibold">Case Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Description */}
                  {(caseData.translated_content.description?.en || caseData.translated_content.description?.ar) && (
                    <div className="space-y-4">
                      <h3 className="font-medium">Description</h3>
                      <div className="space-y-3">
                        {caseData.translated_content.description?.en && (
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm">{caseData.translated_content.description.en}</p>
                          </div>
                        )}
                        {caseData.translated_content.description?.ar && (
                          <div className="p-4 bg-muted/50 rounded-lg" dir="rtl">
                            <p className="text-sm">{caseData.translated_content.description.ar}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Case Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {caseData.incident_date && (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Incident Date</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(caseData.incident_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {caseData.location && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Location</p>
                          <p className="text-sm text-muted-foreground">{caseData.location}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* External URL */}
                  {caseData.external_url && (
                    <div>
                      <p className="text-sm font-medium mb-2">External Documentation</p>
                      <a
                        href={caseData.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View External Source
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Case Details */}
            {caseData.translated_content.details.length > 0 && (
              <Card className="overflow-hidden">
                <CardHeader className="px-6 py-4 border-b">
                  <CardTitle className="text-lg font-semibold">Case Details</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {caseData.translated_content.details.map((detail, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-muted-foreground">
                            {detail.key.en}
                          </p>
                          <p className="text-sm font-medium text-muted-foreground" dir="rtl">
                            {detail.key.ar}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm">{detail.value.en}</p>
                          <p className="text-sm text-muted-foreground" dir="rtl">
                            {detail.value.ar}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Attached Media */}
            {attachedMedia.length > 0 && (
              <Card className="overflow-hidden">
                <CardHeader className="px-6 py-4 border-b">
                  <CardTitle className="text-lg font-semibold">
                    Attached Media ({attachedMedia.length} items)
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
                            <div>
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
            {/* Case Info */}
            <Card>
              <CardHeader className="px-6 py-4 border-b">
                <CardTitle className="text-lg font-semibold">Case Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Case ID</p>
                    <p className="text-sm font-mono">{caseData.case_id}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="capitalize">
                        {caseTypes[caseData.type]?.en || caseData.type}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant={caseData.is_active ? 'default' : 'secondary'}>
                        {caseData.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {caseData.is_featured && (
                        <Badge variant="default">Featured</Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">URL Slug</p>
                    <p className="text-sm font-mono">{caseData.url_slug}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p className="text-sm">
                      {new Date(caseData.created_at).toLocaleDateString('en-US', {
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
                      {new Date(caseData.updated_at).toLocaleDateString('en-US', {
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
                  <Link href={`/cases/${caseData.id}/edit`} className="w-full">
                    <Button className="w-full gap-2">
                      <Edit className="w-4 h-4" />
                      Edit Case
                    </Button>
                  </Link>
                  
                  <Link href="/cases" className="w-full">
                    <Button variant="outline" className="w-full">
                      ← Back to Cases
                    </Button>
                  </Link>

                  {caseData.external_url && (
                    <a
                      href={caseData.external_url}
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
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
