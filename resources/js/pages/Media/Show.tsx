// resources/js/pages/Media/Show.tsx

import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { 
    Edit, Trash2, ArrowLeft, ExternalLink, 
    Upload, Database, Link as LinkIcon, 
    Image, Video, Star, StarOff, Eye, EyeOff 
} from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';

interface Media {
    id: number;
    media_id: string;
    type: 'image' | 'video';
    source_type: 'upload' | 'google_drive' | 'external_link';
    file_path?: string;
    google_drive_id?: string;
    external_url?: string;
    thumbnail_path?: string;
    title_key: string;
    description_key?: string;
    source_url?: string;
    is_active: boolean;
    featured_on_home: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
    translated_content: {
        id: string;
        type: string;
        source_type: string;
        url: string;
        sourceUrl?: string;
        thumbnail?: string;
        title?: { en: string; ar: string };
        description?: { en: string; ar: string };
    };
    testimonies?: any[];
    cases?: any[];
}

interface Props {
    media: Media;
}

export default function MediaShow({ media }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Media', href: '/media' },
        { title: media.translated_content?.title?.en || 'View Media', href: `/media/${media.id}` },
    ];

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const handleDelete = () => {
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        router.delete(`/media/${media.id}`);
        setDeleteDialogOpen(false);
    };

    const toggleFeatured = () => {
        router.patch(`/media/${media.id}/toggle-featured`, {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getSourceIcon = (sourceType: string) => {
        switch (sourceType) {
            case 'upload': return <Upload className="w-4 h-4" />;
            case 'google_drive': return <Database className="w-4 h-4" />;
            case 'external_link': return <LinkIcon className="w-4 h-4" />;
            default: return null;
        }
    };

    const getSourceBadgeColor = (sourceType: string) => {
        switch (sourceType) {
            case 'upload': return 'default';
            case 'google_drive': return 'secondary';
            case 'external_link': return 'outline';
            default: return 'default';
        }
    };

    const getSourceTypeDisplay = (sourceType?: string) => {
        if (!sourceType) return 'Unknown';
        return sourceType.replace('_', ' ');
    };

    const getMediaUrl = () => {
        return media.translated_content?.url || null;
    };

    const getThumbnailUrl = () => {
        return media.translated_content?.thumbnail || media.translated_content?.url || null;
    };

    // Safe fallbacks for potentially undefined values
    const safeMedia = {
        ...media,
        type: media.type || 'image',
        source_type: media.source_type || 'upload',
        is_active: media.is_active ?? true,
        featured_on_home: media.featured_on_home ?? false,
        sort_order: media.sort_order ?? 0,
        testimonies: media.testimonies || [],
        cases: media.cases || [],
        translated_content: media.translated_content || {
            id: media.media_id || '',
            type: media.type || 'image',
            source_type: media.source_type || 'upload',
            url: '',
            title: { en: '', ar: '' },
            description: { en: '', ar: '' }
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${safeMedia.translated_content.title?.en || 'Media'} - View`} />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <Link href="/media">
                                <Button variant="outline" size="sm" className="gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Media
                                </Button>
                            </Link>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {safeMedia.translated_content.title?.en || 'Untitled Media'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            View and manage media details
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleFeatured}
                            className="gap-2"
                        >
                            {safeMedia.featured_on_home ? (
                                <>
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    Featured
                                </>
                            ) : (
                                <>
                                    <StarOff className="w-4 h-4" />
                                    Feature
                                </>
                            )}
                        </Button>
                        <Link href={`/media/${safeMedia.id}/edit`}>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Edit className="w-4 h-4" />
                                Edit
                            </Button>
                        </Link>
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={handleDelete}
                            className="gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Media Display */}
                        <Card className="overflow-hidden">
                            <CardHeader className="px-6 py-4 border-b">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-semibold">Media Preview</CardTitle>
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className="gap-1">
                                            {safeMedia.type === 'video' ? <Video className="w-3 h-3" /> : <Image className="w-3 h-3" />}
                                            {safeMedia.type}
                                        </Badge>
                                        <Badge variant={getSourceBadgeColor(safeMedia.source_type)} className="gap-1">
                                            {getSourceIcon(safeMedia.source_type)}
                                            {getSourceTypeDisplay(safeMedia.source_type)}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {/* Media Container */}
                                    <div className="relative">
                                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                                            {getThumbnailUrl() ? (
                                                <>
                                                    <img
                                                        src={getThumbnailUrl()!}
                                                        alt={safeMedia.translated_content.title?.en || 'Media'}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {/* Video Play Overlay for Videos */}
                                                    {safeMedia.type === 'video' && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                            <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center">
                                                                <Video className="w-8 h-8 text-white ml-1" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-center text-muted-foreground">
                                                    {safeMedia.type === 'video' ? (
                                                        <Video className="mx-auto w-12 h-12 mb-4" />
                                                    ) : (
                                                        <Image className="mx-auto w-12 h-12 mb-4" />
                                                    )}
                                                    <p>No preview available</p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Status Badges */}
                                        <div className="absolute top-3 right-3 flex gap-2">
                                            {safeMedia.featured_on_home && (
                                                <Badge variant="default" className="gap-1">
                                                    <Star className="w-3 h-3 fill-current" />
                                                    Featured
                                                </Badge>
                                            )}
                                            <Badge variant={safeMedia.is_active ? 'default' : 'secondary'} className="gap-1">
                                                {safeMedia.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                {safeMedia.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 pt-2">
                                        {getMediaUrl() && (
                                            <a
                                                href={getMediaUrl()!}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1"
                                            >
                                                <Button variant="outline" className="w-full gap-2">
                                                    <ExternalLink className="w-4 h-4" />
                                                    View Original
                                                </Button>
                                            </a>
                                        )}
                                        {safeMedia.source_url && (
                                            <a
                                                href={safeMedia.source_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1"
                                            >
                                                <Button variant="outline" className="w-full gap-2">
                                                    <LinkIcon className="w-4 h-4" />
                                                    Source
                                                </Button>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Content Details */}
                        <Card className="overflow-hidden">
                            <CardHeader className="px-6 py-4 border-b">
                                <CardTitle className="text-lg font-semibold">Content</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* English Content */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                            English Content
                                        </h3>
                                        
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Title</label>
                                                <p className="text-sm mt-1">
                                                    {safeMedia.translated_content.title?.en || 'No title provided'}
                                                </p>
                                            </div>
                                            
                                            {safeMedia.translated_content.description?.en && (
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                                                    <p className="text-sm mt-1 leading-relaxed">
                                                        {safeMedia.translated_content.description.en}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Arabic Content */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                            Arabic Content
                                        </h3>
                                        
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Title</label>
                                                <p className="text-sm mt-1" dir="rtl">
                                                    {safeMedia.translated_content.title?.ar || 'لم يتم توفير عنوان'}
                                                </p>
                                            </div>
                                            
                                            {safeMedia.translated_content.description?.ar && (
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                                                    <p className="text-sm mt-1 leading-relaxed" dir="rtl">
                                                        {safeMedia.translated_content.description.ar}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Related Content */}
                        {(safeMedia.testimonies.length > 0 || safeMedia.cases.length > 0) && (
                            <Card className="overflow-hidden">
                                <CardHeader className="px-6 py-4 border-b">
                                    <CardTitle className="text-lg font-semibold">Related Content</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        {safeMedia.testimonies.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                                                    Used in Testimonies ({safeMedia.testimonies.length})
                                                </h4>
                                                <div className="text-sm text-muted-foreground">
                                                    This media is used in {safeMedia.testimonies.length} testimonies.
                                                </div>
                                            </div>
                                        )}
                                        
                                        {safeMedia.cases.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                                                    Used in Cases ({safeMedia.cases.length})
                                                </h4>
                                                <div className="text-sm text-muted-foreground">
                                                    This media is used in {safeMedia.cases.length} cases.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Media Information */}
                        <Card>
                            <CardHeader className="px-6 py-4 border-b">
                                <CardTitle className="text-lg font-semibold">Media Information</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Media ID:</span>
                                        <span className="font-mono">{safeMedia.media_id || 'N/A'}</span>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Type:</span>
                                        <span className="capitalize">{safeMedia.type}</span>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Source:</span>
                                        <span className="capitalize">{getSourceTypeDisplay(safeMedia.source_type)}</span>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Status:</span>
                                        <Badge variant={safeMedia.is_active ? 'default' : 'secondary'}>
                                            {safeMedia.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Featured:</span>
                                        <Badge variant={safeMedia.featured_on_home ? 'default' : 'outline'}>
                                            {safeMedia.featured_on_home ? 'Yes' : 'No'}
                                        </Badge>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Sort Order:</span>
                                        <span>{safeMedia.sort_order}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Technical Details */}
                        <Card>
                            <CardHeader className="px-6 py-4 border-b">
                                <CardTitle className="text-lg font-semibold">Technical Details</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4 text-sm">
                                    {safeMedia.file_path && (
                                        <div>
                                            <span className="text-muted-foreground block mb-1">File Path:</span>
                                            <span className="font-mono text-xs bg-muted p-2 rounded block break-all">
                                                {safeMedia.file_path}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {safeMedia.google_drive_id && (
                                        <div>
                                            <span className="text-muted-foreground block mb-1">Google Drive ID:</span>
                                            <span className="font-mono text-xs bg-muted p-2 rounded block break-all">
                                                {safeMedia.google_drive_id}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {safeMedia.external_url && (
                                        <div>
                                            <span className="text-muted-foreground block mb-1">External URL:</span>
                                            <span className="font-mono text-xs bg-muted p-2 rounded block break-all">
                                                {safeMedia.external_url}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {safeMedia.thumbnail_path && (
                                        <div>
                                            <span className="text-muted-foreground block mb-1">Thumbnail:</span>
                                            <span className="font-mono text-xs bg-muted p-2 rounded block break-all">
                                                {safeMedia.thumbnail_path}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {!safeMedia.file_path && !safeMedia.google_drive_id && !safeMedia.external_url && (
                                        <div className="text-muted-foreground text-center py-4">
                                            No technical details available
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Timestamps */}
                        <Card>
                            <CardHeader className="px-6 py-4 border-b">
                                <CardTitle className="text-lg font-semibold">Timestamps</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Created:</span>
                                        <span>{safeMedia.created_at ? new Date(safeMedia.created_at).toLocaleString() : 'N/A'}</span>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Updated:</span>
                                        <span>{safeMedia.updated_at ? new Date(safeMedia.updated_at).toLocaleString() : 'N/A'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader className="px-6 py-4 border-b">
                                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-2">
                                    <Link href={`/media/${safeMedia.id}/edit`} className="block">
                                        <Button variant="outline" className="w-full gap-2">
                                            <Edit className="w-4 h-4" />
                                            Edit Media
                                        </Button>
                                    </Link>
                                    
                                    <Button 
                                        variant="outline" 
                                        onClick={toggleFeatured}
                                        className="w-full gap-2"
                                    >
                                        {safeMedia.featured_on_home ? (
                                            <>
                                                <StarOff className="w-4 h-4" />
                                                Remove from Featured
                                            </>
                                        ) : (
                                            <>
                                                <Star className="w-4 h-4" />
                                                Add to Featured
                                            </>
                                        )}
                                    </Button>
                                    
                                    <Button 
                                        variant="destructive" 
                                        onClick={handleDelete}
                                        className="w-full gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete Media
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the media item 
                            "{safeMedia.translated_content.title?.en || 'Untitled'}" and all associated files.
                            {(safeMedia.testimonies.length > 0 || safeMedia.cases.length > 0) && (
                                <span className="block mt-2 font-medium text-destructive">
                                    Warning: This media is currently being used in other content.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDelete} 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
