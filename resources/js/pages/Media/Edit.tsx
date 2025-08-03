// resources/js/pages/Media/Edit.tsx

import { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, Image, Video, Database, Link as LinkIcon, AlertCircle, ExternalLink } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

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
}

interface Props {
    media: Media;
    translations: {
        title_en: string;
        title_ar: string;
        description_en: string;
        description_ar: string;
    };
}

export default function MediaEdit({ media, translations }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Media', href: '/media' },
        { title: 'Edit', href: `/media/${media.id}/edit` },
    ];

    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        type: media.type,
        source_type: media.source_type,
        file: null as File | null,
        google_drive_id: media.google_drive_id || '',
        external_url: media.external_url || '',
        thumbnail: null as File | null,
        title_en: translations.title_en || '',
        title_ar: translations.title_ar || '',
        description_en: translations.description_en || '',
        description_ar: translations.description_ar || '',
        source_url: media.source_url || '',
        featured_on_home: media.featured_on_home,
        is_active: media.is_active,
    });

    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

    useEffect(() => {
        // Set initial previews
        if (media.file_path) {
            setFilePreview(`/storage/${media.file_path}`);
        } else if (media.source_type === 'google_drive' && media.google_drive_id) {
            setFilePreview(`https://drive.google.com/uc?id=${media.google_drive_id}`);
        } else if (media.external_url) {
            setFilePreview(media.external_url);
        }

        if (media.thumbnail_path) {
            setThumbnailPreview(`/storage/${media.thumbnail_path}`);
        }
    }, [media]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('file', file);
            
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => setFilePreview(e.target?.result as string);
                reader.readAsDataURL(file);
            } else {
                setFilePreview(null);
            }
        }
    };

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('thumbnail', file);
            
            const reader = new FileReader();
            reader.onload = (e) => setThumbnailPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/media/${media.id}`);
    };

    const getSourceIcon = (sourceType: string) => {
        switch (sourceType) {
            case 'upload': return <Upload className="w-5 h-5" />;
            case 'google_drive': return <Database className="w-5 h-5" />;
            case 'external_link': return <LinkIcon className="w-5 h-5" />;
            default: return null;
        }
    };

    const getCurrentMediaUrl = () => {
        if (media.file_path) return `/storage/${media.file_path}`;
        if (media.source_type === 'google_drive' && data.google_drive_id) {
            return `https://drive.google.com/uc?id=${data.google_drive_id}`;
        }
        if (data.external_url) return data.external_url;
        return null;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Media - ${translations.title_en || 'Untitled'}`} />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">Edit Media</h1>
                        <p className="text-sm text-muted-foreground">
                            Update media details and content
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="gap-1">
                            {media.type === 'video' ? <Video className="w-3 h-3" /> : <Image className="w-3 h-3" />}
                            {media.type}
                        </Badge>
                        <Badge variant="secondary" className="gap-1">
                            {getSourceIcon(media.source_type)}
                            {media.source_type.replace('_', ' ')}
                        </Badge>
                        {media.featured_on_home && (
                            <Badge variant="default">Featured</Badge>
                        )}
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">
                    <div className="lg:col-span-2">
                        <Card className="overflow-hidden">
                            <CardHeader className="px-6 py-4 border-b">
                                <CardTitle className="text-lg font-semibold">Media Details</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Media Type */}
                                    <div className="space-y-3">
                                        <Label>Media Type</Label>
                                        <Select value={data.type} onValueChange={(value) => setData('type', value)}>
                                            <SelectTrigger className={errors.type ? 'border-destructive' : ''}>
                                                <SelectValue placeholder="Select media type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="image">
                                                    <div className="flex items-center gap-2">
                                                        <Image className="w-4 h-4" />
                                                        Image
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="video">
                                                    <div className="flex items-center gap-2">
                                                        <Video className="w-4 h-4" />
                                                        Video
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.type && (
                                            <p className="text-sm text-destructive">{errors.type}</p>
                                        )}
                                    </div>

                                    {/* Source Type */}
                                    <div className="space-y-3">
                                        <Label>Source Type</Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {['upload', 'google_drive', 'external_link'].map((sourceType) => (
                                                <button
                                                    key={sourceType}
                                                    type="button"
                                                    onClick={() => setData('source_type', sourceType)}
                                                    className={`p-4 border rounded-lg transition-colors ${
                                                        data.source_type === sourceType
                                                            ? 'border-primary bg-primary/5'
                                                            : 'border-border hover:border-primary/50'
                                                    }`}
                                                >
                                                    <div className="flex flex-col items-center gap-2 text-center">
                                                        {getSourceIcon(sourceType)}
                                                        <div className="font-medium text-sm capitalize">
                                                            {sourceType.replace('_', ' ')}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Current Media Display */}
                                    {getCurrentMediaUrl() && (
                                        <div className="space-y-3">
                                            <Label>Current Media</Label>
                                            <div className="border rounded-lg p-4 bg-muted/30">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-16 h-16 bg-muted rounded overflow-hidden">
                                                        {filePreview && (
                                                            <img
                                                                src={filePreview}
                                                                alt="Current media"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">
                                                            {media.source_type === 'upload' ? 'Uploaded file' : 
                                                             media.source_type === 'google_drive' ? 'Google Drive file' : 
                                                             'External link'}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {getCurrentMediaUrl()}
                                                        </p>
                                                    </div>
                                                    <a
                                                        href={getCurrentMediaUrl()!}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 rounded hover:bg-muted"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* File Upload */}
                                    {data.source_type === 'upload' && (
                                        <div className="space-y-3">
                                            <Label>Replace File (Optional)</Label>
                                            <div className="border-2 border-dashed border-border rounded-lg p-6">
                                                <div className="text-center space-y-4">
                                                    {filePreview && data.file ? (
                                                        <div className="space-y-3">
                                                            <img 
                                                                src={filePreview} 
                                                                alt="New preview" 
                                                                className="mx-auto max-h-32 rounded"
                                                            />
                                                            <p className="text-sm text-muted-foreground">
                                                                New file: {data.file?.name}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                                                            <p className="text-sm">Upload a new file to replace the current one</p>
                                                        </div>
                                                    )}
                                                    <input
                                                        type="file"
                                                        onChange={handleFileChange}
                                                        accept={data.type === 'image' ? 'image/*' : 'video/*'}
                                                        className="sr-only"
                                                        id="file-upload"
                                                    />
                                                    <Label 
                                                        htmlFor="file-upload" 
                                                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                                                    >
                                                        <Upload className="w-4 h-4" />
                                                        Choose New File
                                                    </Label>
                                                </div>
                                            </div>
                                            {errors.file && (
                                                <p className="text-sm text-destructive">{errors.file}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Google Drive ID */}
                                    {data.source_type === 'google_drive' && (
                                        <div className="space-y-3">
                                            <Label htmlFor="google_drive_id">Google Drive File ID</Label>
                                            <Input
                                                id="google_drive_id"
                                                type="text"
                                                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                                                value={data.google_drive_id}
                                                onChange={(e) => setData('google_drive_id', e.target.value)}
                                                className={errors.google_drive_id ? 'border-destructive' : ''}
                                            />
                                            {errors.google_drive_id && (
                                                <p className="text-sm text-destructive">{errors.google_drive_id}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* External URL */}
                                    {data.source_type === 'external_link' && (
                                        <div className="space-y-3">
                                            <Label htmlFor="external_url">External URL</Label>
                                            <Input
                                                id="external_url"
                                                type="url"
                                                placeholder="https://example.com/image.jpg"
                                                value={data.external_url}
                                                onChange={(e) => setData('external_url', e.target.value)}
                                                className={errors.external_url ? 'border-destructive' : ''}
                                            />
                                            {errors.external_url && (
                                                <p className="text-sm text-destructive">{errors.external_url}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Thumbnail Upload */}
                                    <div className="space-y-3">
                                        <Label>Thumbnail</Label>
                                        <div className="border border-border rounded-lg p-4">
                                            <div className="text-center space-y-3">
                                                {thumbnailPreview ? (
                                                    <div className="space-y-2">
                                                        <img 
                                                            src={thumbnailPreview} 
                                                            alt="Thumbnail" 
                                                            className="mx-auto max-h-20 rounded"
                                                        />
                                                        <p className="text-xs text-muted-foreground">
                                                            {data.thumbnail?.name || 'Current thumbnail'}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <Image className="mx-auto h-6 w-6 text-muted-foreground" />
                                                        <p className="text-xs text-muted-foreground">
                                                            No thumbnail set
                                                        </p>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    onChange={handleThumbnailChange}
                                                    accept="image/*"
                                                    className="sr-only"
                                                    id="thumbnail-upload"
                                                />
                                                <Label 
                                                    htmlFor="thumbnail-upload" 
                                                    className="cursor-pointer inline-flex items-center gap-2 px-3 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 text-sm"
                                                >
                                                    <Upload className="w-3 h-3" />
                                                    {thumbnailPreview ? 'Change Thumbnail' : 'Add Thumbnail'}
                                                </Label>
                                            </div>
                                        </div>
                                        {errors.thumbnail && (
                                            <p className="text-sm text-destructive">{errors.thumbnail}</p>
                                        )}
                                    </div>

                                    {/* Multilingual Content */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* English Content */}
                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                                English Content
                                            </h3>
                                            
                                            <div className="space-y-3">
                                                <Label htmlFor="title_en">Title</Label>
                                                <Input
                                                    id="title_en"
                                                    type="text"
                                                    placeholder="Enter English title"
                                                    value={data.title_en}
                                                    onChange={(e) => setData('title_en', e.target.value)}
                                                    className={errors.title_en ? 'border-destructive' : ''}
                                                />
                                                {errors.title_en && (
                                                    <p className="text-sm text-destructive">{errors.title_en}</p>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                <Label htmlFor="description_en">Description (Optional)</Label>
                                                <Textarea
                                                    id="description_en"
                                                    placeholder="Enter English description"
                                                    value={data.description_en}
                                                    onChange={(e) => setData('description_en', e.target.value)}
                                                    rows={3}
                                                />
                                            </div>
                                        </div>

                                        {/* Arabic Content */}
                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                                Arabic Content
                                            </h3>
                                            
                                            <div className="space-y-3">
                                                <Label htmlFor="title_ar">Title</Label>
                                                <Input
                                                    id="title_ar"
                                                    type="text"
                                                    placeholder="أدخل العنوان بالعربية"
                                                    value={data.title_ar}
                                                    onChange={(e) => setData('title_ar', e.target.value)}
                                                    className={errors.title_ar ? 'border-destructive' : ''}
                                                    dir="rtl"
                                                />
                                                {errors.title_ar && (
                                                    <p className="text-sm text-destructive">{errors.title_ar}</p>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                <Label htmlFor="description_ar">Description (Optional)</Label>
                                                <Textarea
                                                    id="description_ar"
                                                    placeholder="أدخل الوصف بالعربية"
                                                    value={data.description_ar}
                                                    onChange={(e) => setData('description_ar', e.target.value)}
                                                    rows={3}
                                                    dir="rtl"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Source Attribution */}
                                    <div className="space-y-3">
                                        <Label htmlFor="source_url">Source URL (Optional)</Label>
                                        <Input
                                            id="source_url"
                                            type="url"
                                            placeholder="https://example.com/original-source"
                                            value={data.source_url}
                                            onChange={(e) => setData('source_url', e.target.value)}
                                        />
                                    </div>

                                    {/* Status Toggles */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 py-2">
                                            <Switch
                                                checked={data.featured_on_home}
                                                onCheckedChange={(checked) => setData('featured_on_home', checked)}
                                            />
                                            <div>
                                                <Label className="text-sm font-medium leading-none">
                                                    Featured on Home
                                                </Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Show this media in the home page gallery
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 py-2">
                                            <Switch
                                                checked={data.is_active}
                                                onCheckedChange={(checked) => setData('is_active', checked)}
                                            />
                                            <div>
                                                <Label className="text-sm font-medium leading-none">
                                                    Active
                                                </Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Make this media visible throughout the site
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
                                            {processing ? 'Updating...' : 'Update Media'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Preview Panel */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="px-6 py-4 border-b">
                                <CardTitle className="text-lg font-semibold">Preview</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {/* Media Preview */}
                                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                                        {filePreview || thumbnailPreview ? (
                                            <img
                                                src={filePreview || thumbnailPreview || ''}
                                                alt="Preview"
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="text-center text-muted-foreground">
                                                {data.type === 'video' ? (
                                                    <Video className="mx-auto w-8 h-8 mb-2" />
                                                ) : (
                                                    <Image className="mx-auto w-8 h-8 mb-2" />
                                                )}
                                                <p className="text-sm">No preview available</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Preview */}
                                    <div className="space-y-2">
                                        <h3 className="font-medium text-sm">
                                            {data.title_en || 'Title will appear here'}
                                        </h3>
                                        {data.description_en && (
                                            <p className="text-xs text-muted-foreground">
                                                {data.description_en}
                                            </p>
                                        )}
                                    </div>

                                    {/* Metadata */}
                                    <div className="space-y-2 pt-2 border-t">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Type:</span>
                                            <span className="capitalize">{data.type}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Source:</span>
                                            <span className="capitalize">{data.source_type.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Featured:</span>
                                            <span>{data.featured_on_home ? 'Yes' : 'No'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Active:</span>
                                            <span>{data.is_active ? 'Yes' : 'No'}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Media Info */}
                        <Card>
                            <CardHeader className="px-6 py-4 border-b">
                                <CardTitle className="text-lg font-semibold">Media Info</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">ID:</span>
                                        <span className="font-mono">{media.media_id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Created:</span>
                                        <span>{new Date(media.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Updated:</span>
                                        <span>{new Date(media.updated_at).toLocaleDateString()}</span>
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
