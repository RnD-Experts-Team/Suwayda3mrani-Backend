// resources/js/pages/Testimonies/Show.tsx

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
    User, Calendar, MapPin, Star, StarOff, 
    Eye, EyeOff, Image, Video, Play,
    Upload, Database, Link as LinkIcon  // Add these
} from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';

interface Testimony {
    id: number;
    testimony_id: string;
    survivor_name?: string;
    survivor_age?: number;
    survivor_location?: string;
    date_of_incident?: string;
    background_image_path?: string;
    url_slug: string;
    is_active: boolean;
    is_featured: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
    translated_content: {
        id: string;
        url: string;
        survivor_name?: string;
        survivor_age?: number;
        survivor_location?: string;
        date_of_incident?: string;
        category?: { en: string; ar: string };
        title?: { en: string; ar: string };
        description?: { en: string; ar: string };
        imageUrl?: string;
    };
    media?: Array<{
        id: number;
        media_id: string;
        type: 'image' | 'video';
        source_type: 'upload' | 'google_drive' | 'external_link';
        file_path?: string;
        google_drive_id?: string;
        external_url?: string;
        thumbnail_path?: string;
        title?: { en: string; ar: string };
        description?: { en: string; ar: string };
        source_url?: string;
        is_active: boolean;
        featured_on_home: boolean;
        sort_order: number;
    }>;
}


interface Props {
    testimony: Testimony;
}

export default function TestimonyShow({ testimony }: Props) {
    // Create safe testimony object with fallbacks
    const safeTestimony = {
        ...testimony,
        survivor_name: testimony.survivor_name || '',
        survivor_age: testimony.survivor_age || null,
        survivor_location: testimony.survivor_location || '',
        date_of_incident: testimony.date_of_incident || '',
        background_image_path: testimony.background_image_path || '',
        is_active: testimony.is_active ?? true,
        is_featured: testimony.is_featured ?? false,
        translated_content: testimony.translated_content || {
            id: testimony.testimony_id || '',
            url: '',
            title: { en: '', ar: '' },
            description: { en: '', ar: '' },
            category: { en: '', ar: '' }
        },
        media: testimony.media || []
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Testimonies', href: '/testimonies' },
        { title: safeTestimony.translated_content.title?.en || 'View Testimony', href: `/testimonies/${safeTestimony.id}` },
    ];

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const handleDelete = () => {
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        router.delete(`/testimonies/${safeTestimony.id}`);
        setDeleteDialogOpen(false);
    };

    const toggleFeatured = () => {
        router.patch(`/testimonies/${safeTestimony.id}/toggle-featured`, {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getBackgroundImageUrl = () => {
        if (safeTestimony.background_image_path) {
            return `/storage/${safeTestimony.background_image_path}`;
        }
        return safeTestimony.translated_content.imageUrl || null;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${safeTestimony.translated_content.title?.en || 'Testimony'} - View`} />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <Link href="/testimonies">
                                <Button variant="outline" size="sm" className="gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Testimonies
                                </Button>
                            </Link>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {safeTestimony.translated_content.title?.en || 'Untitled Testimony'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            View and manage testimony details
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleFeatured}
                            className="gap-2"
                        >
                            {safeTestimony.is_featured ? (
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
                        <Link href={`/testimonies/${safeTestimony.id}/edit`}>
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
                        {/* Hero Section */}
                        <Card className="overflow-hidden">
                            <div className="relative">
                                <div className="aspect-[16/9] bg-muted flex items-center justify-center overflow-hidden">
                                    {getBackgroundImageUrl() ? (
                                        <img
                                            src={getBackgroundImageUrl()!}
                                            alt={safeTestimony.translated_content.title?.en || 'Testimony'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-center text-muted-foreground">
                                            <User className="mx-auto w-12 h-12 mb-4" />
                                            <p>No background image</p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Status Badges */}
                                <div className="absolute top-3 right-3 flex gap-2">
                                    {safeTestimony.is_featured && (
                                        <Badge variant="default" className="gap-1">
                                            <Star className="w-3 h-3 fill-current" />
                                            Featured
                                        </Badge>
                                    )}
                                    <Badge variant={safeTestimony.is_active ? 'default' : 'secondary'} className="gap-1">
                                        {safeTestimony.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                        {safeTestimony.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </div>

                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {/* Category */}
                                    {safeTestimony.translated_content.category?.en && (
                                        <Badge variant="outline">
                                            {safeTestimony.translated_content.category.en}
                                        </Badge>
                                    )}

                                    {/* Title */}
                                    <h2 className="text-2xl font-bold">
                                        {safeTestimony.translated_content.title?.en || 'Untitled'}
                                    </h2>

                                    {/* Description */}
                                    {safeTestimony.translated_content.description?.en && (
                                        <div className="prose max-w-none">
                                            <p className="text-muted-foreground leading-relaxed">
                                                {safeTestimony.translated_content.description.en}
                                            </p>
                                        </div>
                                    )}

                                   
                                </div>
                            </CardContent>
                        </Card>

                        {/* Survivor Information */}
                        {(safeTestimony.survivor_name || safeTestimony.survivor_location || safeTestimony.date_of_incident) && (
                            <Card className="overflow-hidden">
                                <CardHeader className="px-6 py-4 border-b">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <User className="w-5 h-5" />
                                        Survivor Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {safeTestimony.survivor_name && (
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Name</label>
                                                <p className="text-sm mt-1 flex items-center gap-2">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                    {safeTestimony.survivor_name}
                                                    {safeTestimony.survivor_age && (
                                                        <span className="text-muted-foreground">
                                                            ({safeTestimony.survivor_age} years old)
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        )}

                                        {safeTestimony.survivor_location && (
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Location</label>
                                                <p className="text-sm mt-1 flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                                    {safeTestimony.survivor_location}
                                                </p>
                                            </div>
                                        )}

                                        {safeTestimony.date_of_incident && (
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Incident Date</label>
                                                <p className="text-sm mt-1 flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                                    {new Date(safeTestimony.date_of_incident).toLocaleDateString()}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Arabic Content */}
                        <Card className="overflow-hidden">
                            <CardHeader className="px-6 py-4 border-b">
                                <CardTitle className="text-lg font-semibold">Arabic Content</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {safeTestimony.translated_content.category?.ar && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Category</label>
                                            <p className="text-sm mt-1" dir="rtl">
                                                {safeTestimony.translated_content.category.ar}
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Title</label>
                                        <h3 className="text-xl font-bold mt-1" dir="rtl">
                                            {safeTestimony.translated_content.title?.ar || 'لا يوجد عنوان'}
                                        </h3>
                                    </div>

                                    {safeTestimony.translated_content.description?.ar && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Description</label>
                                            <div className="prose max-w-none mt-1">
                                                <p className="text-muted-foreground leading-relaxed" dir="rtl">
                                                    {safeTestimony.translated_content.description.ar}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Attached Media */}
{safeTestimony.media && safeTestimony.media.length > 0 && (
    <Card className="overflow-hidden">
        <CardHeader className="px-6 py-4 border-b">
            <CardTitle className="text-lg font-semibold">
                Attached Media ({safeTestimony.media.length})
            </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {safeTestimony.media.map((media) => {
                    // Helper function to get media URL based on source type
                    const getMediaUrl = () => {
                        switch (media.source_type) {
                            case 'upload':
                                return media.file_path ? `/storage/${media.file_path}` : null;
                            case 'google_drive':
                                return media.google_drive_id ? `https://drive.google.com/uc?id=${media.google_drive_id}` : null;
                            case 'external_link':
                                return media.external_url || null;
                            default:
                                return null;
                        }
                    };

                    // Helper function to get thumbnail URL
                    const getThumbnailUrl = () => {
                        if (media.thumbnail_path) {
                            return `/storage/${media.thumbnail_path}`;
                        }
                        
                        // Auto-generate thumbnail for Google Drive images
                        if (media.source_type === 'google_drive' && media.type === 'image' && media.google_drive_id) {
                            return `https://drive.google.com/thumbnail?id=${media.google_drive_id}&sz=w300`;
                        }
                        
                        return null;
                    };

                    const mediaUrl = getMediaUrl();
                    const thumbnailUrl = getThumbnailUrl();
                    const displayUrl = thumbnailUrl || mediaUrl;

                    return (
                        <div key={media.id} className="border rounded-lg overflow-hidden">
                            <div className="aspect-video bg-muted flex items-center justify-center relative">
                                {displayUrl ? (
                                    <>
                                        <img
                                            src={displayUrl}
                                            alt={media.title?.en || 'Media'}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // Fallback if image fails to load
                                                e.currentTarget.style.display = 'none';
                                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                if (fallback) fallback.style.display = 'flex';
                                            }}
                                        />
                                        <div className="hidden flex-col items-center gap-2 text-muted-foreground">
                                            {media.type === 'video' ? (
                                                <Video className="w-8 h-8" />
                                            ) : (
                                                <Image className="w-8 h-8" />
                                            )}
                                            <span className="text-xs">Preview unavailable</span>
                                        </div>
                                        {media.type === 'video' && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center">
                                                    <Play className="w-6 h-6 text-white ml-1" />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        {media.type === 'video' ? (
                                            <Video className="w-8 h-8" />
                                        ) : (
                                            <Image className="w-8 h-8" />
                                        )}
                                        <span className="text-xs">No preview</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-3">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-sm font-medium truncate">
                                        {media.title?.en || 'Untitled'}
                                    </h4>
                                    <div className="flex gap-1">
                                        <Badge variant="outline" className="text-xs capitalize">
                                            {media.type}
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs">
                                            {media.source_type === 'upload' && <Upload className="w-3 h-3 mr-1" />}
                                            {media.source_type === 'google_drive' && <Database className="w-3 h-3 mr-1" />}
                                            {media.source_type === 'external_link' && <LinkIcon className="w-3 h-3 mr-1" />}
                                            {media.source_type.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">
                                    {media.media_id}
                                </p>
                                
                                {/* Source Details */}
                                <div className="text-xs text-muted-foreground mb-2">
                                    {media.source_type === 'upload' && media.file_path && (
                                        <span>File: {media.file_path.split('/').pop()}</span>
                                    )}
                                    {media.source_type === 'google_drive' && media.google_drive_id && (
                                        <span>Drive ID: {media.google_drive_id.substring(0, 8)}...</span>
                                    )}
                                    {media.source_type === 'external_link' && media.external_url && (
                                        <span>External: {new URL(media.external_url).hostname}</span>
                                    )}
                                </div>

                                <div className="flex gap-1">
                                    {mediaUrl && (
                                        <a
                                            href={mediaUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1"
                                        >
                                            <Button variant="outline" size="sm" className="w-full gap-1">
                                                <ExternalLink className="w-3 h-3" />
                                                View
                                            </Button>
                                        </a>
                                    )}
                                    <Link href={`/media/${media.id}`}>
                                        <Button variant="outline" size="sm" className="gap-1">
                                            <Eye className="w-3 h-3" />
                                            Edit
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </CardContent>
    </Card>
)}

                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Testimony Information */}
                        <Card>
                            <CardHeader className="px-6 py-4 border-b">
                                <CardTitle className="text-lg font-semibold">Testimony Information</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">ID:</span>
                                        <span className="font-mono">{safeTestimony.testimony_id}</span>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">URL Slug:</span>
                                        <span className="font-mono">{safeTestimony.url_slug}</span>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Status:</span>
                                        <Badge variant={safeTestimony.is_active ? 'default' : 'secondary'}>
                                            {safeTestimony.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Featured:</span>
                                        <Badge variant={safeTestimony.is_featured ? 'default' : 'outline'}>
                                            {safeTestimony.is_featured ? 'Yes' : 'No'}
                                        </Badge>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Sort Order:</span>
                                        <span>{safeTestimony.sort_order}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Media Count:</span>
                                        <span>{safeTestimony.media?.length || 0}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Technical Details */}
                        {safeTestimony.background_image_path && (
                            <Card>
                                <CardHeader className="px-6 py-4 border-b">
                                    <CardTitle className="text-lg font-semibold">Background Image</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-3">
                                        <div className="aspect-video bg-muted rounded overflow-hidden">
                                            <img
                                                src={`/storage/${safeTestimony.background_image_path}`}
                                                alt="Background"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="text-xs">
                                            <span className="text-muted-foreground block mb-1">Path:</span>
                                            <span className="font-mono text-xs bg-muted p-2 rounded block break-all">
                                                {safeTestimony.background_image_path}
                                            </span>
                                        </div>
                                        <a
                                            href={`/storage/${safeTestimony.background_image_path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button variant="outline" size="sm" className="w-full gap-2">
                                                <ExternalLink className="w-4 h-4" />
                                                View Full Size
                                            </Button>
                                        </a>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Timestamps */}
                        <Card>
                            <CardHeader className="px-6 py-4 border-b">
                                <CardTitle className="text-lg font-semibold">Timestamps</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Created:</span>
                                        <span>{safeTestimony.created_at ? new Date(safeTestimony.created_at).toLocaleString() : 'N/A'}</span>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Updated:</span>
                                        <span>{safeTestimony.updated_at ? new Date(safeTestimony.updated_at).toLocaleString() : 'N/A'}</span>
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
                                    <Link href={`/testimonies/${safeTestimony.id}/edit`} className="block">
                                        <Button variant="outline" className="w-full gap-2">
                                            <Edit className="w-4 h-4" />
                                            Edit Testimony
                                        </Button>
                                    </Link>
                                    
                                    <Button 
                                        variant="outline" 
                                        onClick={toggleFeatured}
                                        className="w-full gap-2"
                                    >
                                        {safeTestimony.is_featured ? (
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
                                        Delete Testimony
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
                            This action cannot be undone. This will permanently delete the testimony 
                            "{safeTestimony.translated_content.title?.en || 'Untitled'}" and all associated content.
                            {(safeTestimony.media && safeTestimony.media.length > 0) && (
                                <span className="block mt-2 font-medium text-destructive">
                                    Warning: This testimony has {safeTestimony.media.length} attached media files.
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
