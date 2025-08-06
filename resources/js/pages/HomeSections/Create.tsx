// resources/js/pages/HomeSections/Create.tsx

import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Home, Layout, Image } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Home Sections', href: '/home-sections' },
    { title: 'Create', href: '/home-sections/create' },
];

export default function HomeSectionCreate() {
    const { data, setData, post, processing, errors } = useForm({
        type: 'hero' as 'hero' | 'suggestion',
        title_en: '',
        title_ar: '',
        description_en: '',
        description_ar: '',
        button_text_en: '',
        button_text_ar: '',
        button_variant: '',
        action_key: '',
        image: null as File | null,
        sort_order: 0,
    });

    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('image', file);
            
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/home-sections');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Home Section" />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">Create Home Section</h1>
                        <p className="text-sm text-muted-foreground">Add a new section to your homepage</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl">
                    <div className="lg:col-span-2">
                        <Card className="overflow-hidden">
                            <CardHeader className="px-6 py-4 border-b">
                                <CardTitle className="text-lg font-semibold">Section Details</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Section Type */}
                                    <div className="space-y-3">
                                        <Label>Section Type</Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setData('type', 'hero')}
                                                className={`p-4 border rounded-lg transition-colors ${
                                                    data.type === 'hero'
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-border hover:border-primary/50'
                                                }`}
                                            >
                                                <div className="flex flex-col items-center gap-2 text-center">
                                                    <Home className="w-6 h-6" />
                                                    <div>
                                                        <div className="font-medium text-sm">Hero</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Main banner section
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setData('type', 'suggestion')}
                                                className={`p-4 border rounded-lg transition-colors ${
                                                    data.type === 'suggestion'
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-border hover:border-primary/50'
                                                }`}
                                            >
                                                <div className="flex flex-col items-center gap-2 text-center">
                                                    <Layout className="w-6 h-6" />
                                                    <div>
                                                        <div className="font-medium text-sm">Suggestion</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Content suggestion block
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                        {errors.type && (
                                            <p className="text-sm text-destructive">{errors.type}</p>
                                        )}
                                    </div>

                                    {/* Image Upload */}
                                    <div className="space-y-3">
                                        <Label>Section Image (Optional)</Label>
                                        <div className="border-2 border-dashed border-border rounded-lg p-6">
                                            <div className="text-center space-y-4">
                                                {imagePreview ? (
                                                    <div className="space-y-3">
                                                        <img 
                                                            src={imagePreview} 
                                                            alt="Image preview" 
                                                            className="mx-auto max-h-32 rounded"
                                                        />
                                                        <p className="text-sm text-muted-foreground">
                                                            {data.image?.name}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm font-medium">
                                                                Click to upload section image
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                JPG, PNG, GIF (max 5MB)
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    onChange={handleImageChange}
                                                    accept="image/*"
                                                    className="sr-only"
                                                    id="image-upload"
                                                />
                                                <Label 
                                                    htmlFor="image-upload" 
                                                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                                                >
                                                    <Upload className="w-4 h-4" />
                                                    Choose Image
                                                </Label>
                                            </div>
                                        </div>
                                        {errors.image && (
                                            <p className="text-sm text-destructive">{errors.image}</p>
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

                                                <div className="space-y-3">
                                                    <Label htmlFor="button_text_en">Button Text (Optional)</Label>
                                                    <Input
                                                        id="button_text_en"
                                                        type="text"
                                                        placeholder="Enter English button text"
                                                        value={data.button_text_en}
                                                        onChange={(e) => setData('button_text_en', e.target.value)}
                                                        className={errors.button_text_en ? 'border-destructive' : ''}
                                                    />
                                                    {errors.button_text_en && (
                                                        <p className="text-sm text-destructive">{errors.button_text_en}</p>
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

                                                <div className="space-y-3">
                                                    <Label htmlFor="button_text_ar">Button Text (Optional)</Label>
                                                    <Input
                                                        id="button_text_ar"
                                                        type="text"
                                                        placeholder="أدخل نص الزر بالعربية"
                                                        value={data.button_text_ar}
                                                        onChange={(e) => setData('button_text_ar', e.target.value)}
                                                        className={errors.button_text_ar ? 'border-destructive' : ''}
                                                        dir="rtl"
                                                    />
                                                    {errors.button_text_ar && (
                                                        <p className="text-sm text-destructive">{errors.button_text_ar}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Button Configuration */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                            Button Configuration
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <Label htmlFor="button_variant">Button Variant (Optional)</Label>
                                                <Select value={data.button_variant || '__none'} onValueChange={(value) => setData('button_variant', value === '__none' ? '' : value)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select button style" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="__none">Default (No variant)</SelectItem>
                                                        <SelectItem value="outline">Outline</SelectItem>
                                                        <SelectItem value="secondary">Secondary</SelectItem>
                                                        <SelectItem value="destructive">Destructive</SelectItem>
                                                        <SelectItem value="ghost">Ghost</SelectItem>
                                                        <SelectItem value="link">Link</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {errors.button_variant && (
                                                    <p className="text-sm text-destructive">{errors.button_variant}</p>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                <Label htmlFor="action_key">Action Key (Optional)</Label>
                                                <Input
                                                    id="action_key"
                                                    type="text"
                                                    placeholder="e.g., takeAction, shareTestimony"
                                                    value={data.action_key}
                                                    onChange={(e) => setData('action_key', e.target.value)}
                                                    className={errors.action_key ? 'border-destructive' : ''}
                                                />
                                                {errors.action_key && (
                                                    <p className="text-sm text-destructive">{errors.action_key}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sort Order */}
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
                                            {processing ? 'Creating...' : 'Create Section'}
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
                                    {/* Image Preview */}
                                    <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Section preview"
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="text-center text-muted-foreground">
                                                {data.type === 'hero' ? (
                                                    <Home className="mx-auto w-8 h-8 mb-2" />
                                                ) : (
                                                    <Layout className="mx-auto w-8 h-8 mb-2" />
                                                )}
                                                <p className="text-sm">No image selected</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Preview */}
                                    <div className="space-y-2">
                                        <Badge variant="outline" className="text-xs capitalize">
                                            {data.type}
                                        </Badge>
                                        <h3 className="font-medium text-sm">
                                            {data.title_en || 'Section title will appear here'}
                                        </h3>
                                        {data.description_en && (
                                            <p className="text-xs text-muted-foreground line-clamp-3">
                                                {data.description_en}
                                            </p>
                                        )}
                                        {data.button_text_en && (
                                            <div className="pt-2">
                                                <Badge variant="secondary" className="text-xs">
                                                    Button: {data.button_text_en}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>

                                    {/* Metadata */}
                                    <div className="space-y-2 pt-2 border-t">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Type:</span>
                                            <span className="capitalize">{data.type}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Sort Order:</span>
                                            <span>{data.sort_order}</span>
                                        </div>
                                        {data.button_variant && data.button_variant !== '__none' && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">Button Style:</span>
                                                <span className="capitalize">{data.button_variant}</span>
                                            </div>
                                        )}
                                        {data.action_key && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">Action:</span>
                                                <span>{data.action_key}</span>
                                            </div>
                                        )}
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
