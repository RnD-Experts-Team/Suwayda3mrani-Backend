// resources/js/pages/Media/Create.tsx

import { useState } from 'react';
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
import { Upload, Image, Video, Database, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Media', href: '/media' },
    { title: 'Create', href: '/media/create' },
];

export default function MediaCreate() {
    const { data, setData, post, processing, errors } = useForm({
        type: '',
        source_type: '',
        file: null as File | null,
        google_drive_id: '',
        external_url: '',
        thumbnail: null as File | null,
        title_en: '',
        title_ar: '',
        description_en: '',
        description_ar: '',
        source_url: '',
        featured_on_home: false,
    });

    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('file', file);
            
            // Create preview for images
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
        post('/media');
    };

    const getSourceIcon = (sourceType: string) => {
        switch (sourceType) {
            case 'upload': return <Upload className="w-5 h-5" />;
            case 'google_drive': return <Database className="w-5 h-5" />;
            case 'external_link': return <LinkIcon className="w-5 h-5" />;
            default: return null;
        }
    };

    const getSourceDescription = (sourceType: string) => {
        switch (sourceType) {
            case 'upload': return 'Upload files directly to the server';
            case 'google_drive': return 'Use Google Drive file ID for sharing';
            case 'external_link': return 'Link to external media sources';
            default: return '';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Media" />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">Add New Media</h1>
                        <p className="text-sm text-muted-foreground">Upload images or videos to your media library</p>
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
                                                        <div>
                                                            <div className="font-medium text-sm capitalize">
                                                                {sourceType.replace('_', ' ')}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {getSourceDescription(sourceType)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                        {errors.source_type && (
                                            <p className="text-sm text-destructive">{errors.source_type}</p>
                                        )}
                                    </div>

                                    {/* File Upload */}
                                    {data.source_type === 'upload' && (
                                        <div className="space-y-3">
                                            <Label>Upload File</Label>
                                            <div className="border-2 border-dashed border-border rounded-lg p-6">
                                                <div className="text-center space-y-4">
                                                    {filePreview ? (
                                                        <div className="space-y-3">
                                                            <img 
                                                                src={filePreview} 
                                                                alt="Preview" 
                                                                className="mx-auto max-h-32 rounded"
                                                            />
                                                            <p className="text-sm text-muted-foreground">
                                                                {data.file?.name}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                                                            <div>
                                                                <p className="text-sm font-medium">
                                                                    Click to upload or drag and drop
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Images: JPG, PNG, GIF (max 50MB)<br />
                                                                    Videos: MP4, AVI, MOV (max 50MB)
                                                                </p>
                                                            </div>
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
                                                        Choose File
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
                                            <Alert>
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>
                                                    Extract the file ID from the Google Drive share URL. 
                                                    Make sure the file is publicly accessible.
                                                </AlertDescription>
                                            </Alert>
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
                                    {(data.type === 'video' || data.source_type !== 'upload') && (
                                        <div className="space-y-3">
                                            <Label>Thumbnail (Optional)</Label>
                                            <div className="border border-border rounded-lg p-4">
                                                <div className="text-center space-y-3">
                                                    {thumbnailPreview ? (
                                                        <div className="space-y-2">
                                                            <img 
                                                                src={thumbnailPreview} 
                                                                alt="Thumbnail Preview" 
                                                                className="mx-auto max-h-20 rounded"
                                                            />
                                                            <p className="text-xs text-muted-foreground">
                                                                {data.thumbnail?.name}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <Image className="mx-auto h-6 w-6 text-muted-foreground" />
                                                            <p className="text-xs text-muted-foreground">
                                                                Upload a thumbnail image
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
                                                        Choose Thumbnail
                                                    </Label>
                                                </div>
                                            </div>
                                            {errors.thumbnail && (
                                                <p className="text-sm text-destructive">{errors.thumbnail}</p>
                                            )}
                                        </div>
                                    )}

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
                                        <p className="text-xs text-muted-foreground">
                                            Link to the original source for attribution purposes
                                        </p>
                                    </div>

                                    {/* Featured Toggle */}
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
                                            {processing ? 'Creating...' : 'Create Media'}
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
                                            <span className="capitalize">{data.type || 'Not selected'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Source:</span>
                                            <span className="capitalize">
                                                {data.source_type?.replace('_', ' ') || 'Not selected'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Featured:</span>
                                            <span>{data.featured_on_home ? 'Yes' : 'No'}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Help Card */}
                        <Card>
                            <CardHeader className="px-6 py-4 border-b">
                                <CardTitle className="text-lg font-semibold">Tips</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-3 text-sm text-muted-foreground">
                                    <p>• Use descriptive titles in both languages</p>
                                    <p>• For Google Drive files, ensure they're publicly accessible</p>
                                    <p>• Upload thumbnails for videos for better previews</p>
                                    <p>• Featured media appears on the home page</p>
                                    <p>• Include source URLs for proper attribution</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
