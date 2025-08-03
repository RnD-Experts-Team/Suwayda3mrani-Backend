// resources/js/pages/Testimonies/Edit.tsx

import { useState, useEffect } from 'react';
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
import { Upload, User, Calendar, MapPin, Image, Video, X, ExternalLink } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

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
    created_at: string;
    updated_at: string;
}

interface MediaItem {
    id: number;
    media_id: string;
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
    title: string;
}

interface Props {
    testimony: Testimony;
    translations: {
        category_en: string;
        category_ar: string;
        title_en: string;
        title_ar: string;
        description_en: string;
        description_ar: string;
    };
    availableMedia: MediaItem[];
    attachedMedia: number[];
}

export default function TestimonyEdit({ testimony, translations, availableMedia, attachedMedia }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Testimonies', href: '/testimonies' },
        { title: 'Edit', href: `/testimonies/${testimony.id}/edit` },
    ];

    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        category_en: translations.category_en || '',
        category_ar: translations.category_ar || '',
        title_en: translations.title_en || '',
        title_ar: translations.title_ar || '',
        description_en: translations.description_en || '',
        description_ar: translations.description_ar || '',
        survivor_name: testimony.survivor_name || '',
        survivor_age: testimony.survivor_age?.toString() || '',
        survivor_location: testimony.survivor_location || '',
        date_of_incident: testimony.date_of_incident || '',
        background_image: null as File | null,
        url_slug: testimony.url_slug,
        is_featured: testimony.is_featured,
        is_active: testimony.is_active,
        media_ids: attachedMedia,
    });

    const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
    const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);

    useEffect(() => {
        // Set initial background preview
        if (testimony.background_image_path) {
            setBackgroundPreview(`/storage/${testimony.background_image_path}`);
        }

        // Set initially selected media
        const initialSelected = availableMedia.filter(media => attachedMedia.includes(media.id));
        setSelectedMedia(initialSelected);
    }, [testimony, availableMedia, attachedMedia]);

    const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('background_image', file);
            
            const reader = new FileReader();
            reader.onload = (e) => setBackgroundPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleMediaSelect = (media: MediaItem, checked: boolean) => {
        if (checked) {
            setSelectedMedia(prev => [...prev, media]);
            setData('media_ids', [...data.media_ids, media.id]);
        } else {
            setSelectedMedia(prev => prev.filter(m => m.id !== media.id));
            setData('media_ids', data.media_ids.filter(id => id !== media.id));
        }
    };

    const removeSelectedMedia = (mediaId: number) => {
        setSelectedMedia(prev => prev.filter(m => m.id !== mediaId));
        setData('media_ids', data.media_ids.filter(id => id !== mediaId));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/testimonies/${testimony.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Testimony - ${translations.title_en || 'Untitled'}`} />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">Edit Testimony</h1>
                        <p className="text-sm text-muted-foreground">
                            Update testimony details and content
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="outline">{testimony.testimony_id}</Badge>
                        {testimony.is_featured && (
                            <Badge variant="default">Featured</Badge>
                        )}
                        {!testimony.is_active && (
                            <Badge variant="destructive">Inactive</Badge>
                        )}
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl">
                    <div className="lg:col-span-2">
                        <Card className="overflow-hidden">
                            <CardHeader className="px-6 py-4 border-b">
                                <CardTitle className="text-lg font-semibold">Testimony Details</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Survivor Information */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                            Survivor Information
                                        </h3>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="survivor_name">Name (Optional)</Label>
                                                <Input
                                                    id="survivor_name"
                                                    type="text"
                                                    placeholder="Survivor's name"
                                                    value={data.survivor_name}
                                                    onChange={(e) => setData('survivor_name', e.target.value)}
                                                    className={errors.survivor_name ? 'border-destructive' : ''}
                                                />
                                                {errors.survivor_name && (
                                                    <p className="text-sm text-destructive">{errors.survivor_name}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="survivor_age">Age (Optional)</Label>
                                                <Input
                                                    id="survivor_age"
                                                    type="number"
                                                    placeholder="Age"
                                                    min="1"
                                                    max="150"
                                                    value={data.survivor_age}
                                                    onChange={(e) => setData('survivor_age', e.target.value)}
                                                    className={errors.survivor_age ? 'border-destructive' : ''}
                                                />
                                                {errors.survivor_age && (
                                                    <p className="text-sm text-destructive">{errors.survivor_age}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="survivor_location">Location (Optional)</Label>
                                                <Input
                                                    id="survivor_location"
                                                    type="text"
                                                    placeholder="Location"
                                                    value={data.survivor_location}
                                                    onChange={(e) => setData('survivor_location', e.target.value)}
                                                    className={errors.survivor_location ? 'border-destructive' : ''}
                                                />
                                                {errors.survivor_location && (
                                                    <p className="text-sm text-destructive">{errors.survivor_location}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="date_of_incident">Incident Date (Optional)</Label>
                                            <Input
                                                id="date_of_incident"
                                                type="date"
                                                value={data.date_of_incident}
                                                onChange={(e) => setData('date_of_incident', e.target.value)}
                                                className={errors.date_of_incident ? 'border-destructive' : ''}
                                            />
                                            {errors.date_of_incident && (
                                                <p className="text-sm text-destructive">{errors.date_of_incident}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Current Background Image */}
                                    {testimony.background_image_path && (
                                        <div className="space-y-3">
                                            <Label>Current Background Image</Label>
                                            <div className="border rounded-lg p-4 bg-muted/30">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-16 h-16 bg-muted rounded overflow-hidden">
                                                        <img
                                                            src={`/storage/${testimony.background_image_path}`}
                                                            alt="Current background"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">Current background image</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {testimony.background_image_path}
                                                        </p>
                                                    </div>
                                                    <a
                                                        href={`/storage/${testimony.background_image_path}`}
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

                                    {/* Background Image Upload */}
                                    <div className="space-y-3">
                                        <Label>
                                            {testimony.background_image_path ? 'Replace Background Image' : 'Background Image'} (Optional)
                                        </Label>
                                        <div className="border-2 border-dashed border-border rounded-lg p-6">
                                            <div className="text-center space-y-4">
                                                {backgroundPreview && data.background_image ? (
                                                    <div className="space-y-3">
                                                        <img 
                                                            src={backgroundPreview} 
                                                            alt="New background preview" 
                                                            className="mx-auto max-h-32 rounded"
                                                        />
                                                        <p className="text-sm text-muted-foreground">
                                                            New: {data.background_image?.name}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                                                        <p className="text-sm">
                                                            {testimony.background_image_path 
                                                                ? 'Upload a new background image to replace the current one'
                                                                : 'Upload a background image'
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    onChange={handleBackgroundChange}
                                                    accept="image/*"
                                                    className="sr-only"
                                                    id="background-upload"
                                                />
                                                <Label 
                                                    htmlFor="background-upload" 
                                                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                                                >
                                                    <Upload className="w-4 h-4" />
                                                    {testimony.background_image_path ? 'Replace Background' : 'Choose Background'}
                                                </Label>
                                            </div>
                                        </div>
                                        {errors.background_image && (
                                            <p className="text-sm text-destructive">{errors.background_image}</p>
                                        )}
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
                                                    <Label htmlFor="category_en">Category (Optional)</Label>
                                                    <Input
                                                        id="category_en"
                                                        type="text"
                                                        placeholder="e.g., Survivor Story"
                                                        value={data.category_en}
                                                        onChange={(e) => setData('category_en', e.target.value)}
                                                        className={errors.category_en ? 'border-destructive' : ''}
                                                    />
                                                    {errors.category_en && (
                                                        <p className="text-sm text-destructive">{errors.category_en}</p>
                                                    )}
                                                </div>

                                                <div className="space-y-3">
                                                    <Label htmlFor="title_en">Title *</Label>
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
                                                    <Label htmlFor="description_en">Description *</Label>
                                                    <Textarea
                                                        id="description_en"
                                                        placeholder="Enter English description"
                                                        value={data.description_en}
                                                        onChange={(e) => setData('description_en', e.target.value)}
                                                        rows={6}
                                                        className={errors.description_en ? 'border-destructive' : ''}
                                                    />
                                                    {errors.description_en && (
                                                        <p className="text-sm text-destructive">{errors.description_en}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Arabic Content */}
                                            <div className="space-y-4">
                                                <h4 className="font-medium text-sm text-muted-foreground">Arabic Content</h4>
                                                
                                                <div className="space-y-3">
                                                    <Label htmlFor="category_ar">Category (Optional)</Label>
                                                    <Input
                                                        id="category_ar"
                                                        type="text"
                                                        placeholder="مثال: قصة ناجي"
                                                        value={data.category_ar}
                                                        onChange={(e) => setData('category_ar', e.target.value)}
                                                        className={errors.category_ar ? 'border-destructive' : ''}
                                                        dir="rtl"
                                                    />
                                                    {errors.category_ar && (
                                                        <p className="text-sm text-destructive">{errors.category_ar}</p>
                                                    )}
                                                </div>

                                                <div className="space-y-3">
                                                    <Label htmlFor="title_ar">Title *</Label>
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
                                                    <Label htmlFor="description_ar">Description *</Label>
                                                    <Textarea
                                                        id="description_ar"
                                                        placeholder="أدخل الوصف بالعربية"
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
                                        </div>
                                    </div>

                                    {/* URL Slug */}
                                    <div className="space-y-3">
                                        <Label htmlFor="url_slug">URL Slug *</Label>
                                        <Input
                                            id="url_slug"
                                            type="text"
                                            placeholder="testimony-url-slug"
                                            value={data.url_slug}
                                            onChange={(e) => setData('url_slug', e.target.value)}
                                            className={`font-mono ${errors.url_slug ? 'border-destructive' : ''}`}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            URL: /testimonies/{data.url_slug}
                                        </p>
                                        {errors.url_slug && (
                                            <p className="text-sm text-destructive">{errors.url_slug}</p>
                                        )}
                                    </div>

                                    {/* Status Toggles */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 py-2">
                                            <Switch
                                                checked={data.is_featured}
                                                onCheckedChange={(checked) => setData('is_featured', checked)}
                                            />
                                            <div>
                                                <Label className="text-sm font-medium leading-none">
                                                    Featured Testimony
                                                </Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Show this testimony on the home page
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
                                                    Make this testimony visible on the site
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
                                            {processing ? 'Updating...' : 'Update Testimony'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Media Selection & Preview Panel */}
                    <div className="space-y-4">
                        {/* Preview */}
                        <Card>
                            <CardHeader className="px-6 py-4 border-b">
                                <CardTitle className="text-lg font-semibold">Preview</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {/* Background Preview */}
                                    <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
                                        {backgroundPreview ? (
                                            <img
                                                src={backgroundPreview}
                                                alt="Background preview"
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="text-center text-muted-foreground">
                                                <User className="mx-auto w-8 h-8 mb-2" />
                                                <p className="text-sm">No background image</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Preview */}
                                    <div className="space-y-2">
                                        {data.category_en && (
                                            <Badge variant="outline" className="text-xs">
                                                {data.category_en}
                                            </Badge>
                                        )}
                                        <h3 className="font-medium text-sm">
                                            {data.title_en || 'Title will appear here'}
                                        </h3>
                                        {data.description_en && (
                                            <p className="text-xs text-muted-foreground line-clamp-3">
                                                {data.description_en}
                                            </p>
                                        )}
                                    </div>

                                    {/* Survivor Info Preview */}
                                    {(data.survivor_name || data.survivor_location || data.date_of_incident) && (
                                        <div className="space-y-1 pt-2 border-t">
                                            {data.survivor_name && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <User className="w-3 h-3" />
                                                    {data.survivor_name}
                                                    {data.survivor_age && `, ${data.survivor_age} years old`}
                                                </div>
                                            )}
                                            {data.survivor_location && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <MapPin className="w-3 h-3" />
                                                    {data.survivor_location}
                                                </div>
                                            )}
                                            {data.date_of_incident && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(data.date_of_incident).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Metadata */}
                                    <div className="space-y-2 pt-2 border-t">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Featured:</span>
                                            <span>{data.is_featured ? 'Yes' : 'No'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Active:</span>
                                            <span>{data.is_active ? 'Yes' : 'No'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Media:</span>
                                            <span>{selectedMedia.length} item{selectedMedia.length !== 1 ? 's' : ''}</span>
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
                                    <div className="space-y-3">
                                        {selectedMedia.map((media) => (
                                            <div key={media.id} className="flex items-center gap-3 p-2 border rounded">
                                                <div className="w-12 h-12 bg-muted rounded overflow-hidden">
                                                    {media.thumbnail || media.url ? (
                                                        <img
                                                            src={media.thumbnail || media.url}
                                                            alt={media.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            {media.type === 'video' ? (
                                                                <Video className="w-4 h-4 text-muted-foreground" />
                                                            ) : (
                                                                <Image className="w-4 h-4 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{media.title}</p>
                                                    <p className="text-xs text-muted-foreground capitalize">{media.type}</p>
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
                                <CardTitle className="text-lg font-semibold">Media Gallery</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Select media to attach to this testimony
                                </p>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="max-h-96 overflow-y-auto space-y-3">
                                    {availableMedia.length > 0 ? (
                                        availableMedia.map((media) => (
                                            <div key={media.id} className="flex items-center gap-3 p-2">
                                                <Checkbox
                                                    checked={data.media_ids.includes(media.id)}
                                                    onCheckedChange={(checked) => handleMediaSelect(media, Boolean(checked))}
                                                />
                                                <div className="w-12 h-12 bg-muted rounded overflow-hidden">
                                                    {media.thumbnail || media.url ? (
                                                        <img
                                                            src={media.thumbnail || media.url}
                                                            alt={media.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            {media.type === 'video' ? (
                                                                <Video className="w-4 h-4 text-muted-foreground" />
                                                            ) : (
                                                                <Image className="w-4 h-4 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{media.title}</p>
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
                                                No media available. Create some media first.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Testimony Info */}
                        <Card>
                            <CardHeader className="px-6 py-4 border-b">
                                <CardTitle className="text-lg font-semibold">Testimony Info</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">ID:</span>
                                        <span className="font-mono">{testimony.testimony_id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Created:</span>
                                        <span>{new Date(testimony.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Updated:</span>
                                        <span>{new Date(testimony.updated_at).toLocaleDateString()}</span>
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
