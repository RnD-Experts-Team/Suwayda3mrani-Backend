// resources/js/pages/AidOrganizations/Edit.tsx

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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, Building, Users, ExternalLink, Mail, Tag, X } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

interface AidOrganization {
    id: number;
    organization_id: string;
    website_url?: string;
    contact_url?: string;
    type: 'organizations' | 'initiatives';
    background_image_path?: string;
    is_active: boolean;
    is_featured: boolean;
    created_at: string;
    updated_at: string;
}

interface Category {
    id: number;
    slug: string;
    name: string;
    name_ar: string;
}

interface Props {
    organization: AidOrganization;
    translations: {
        name_en: string;
        name_ar: string;
        description_en: string;
        description_ar: string;
    };
    categories: Category[];
    attachedCategories: number[];
}

export default function AidOrganizationEdit({ organization, translations, categories, attachedCategories }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Aid Organizations', href: '/aid-organizations' },
        { title: 'Edit', href: `/aid-organizations/${organization.id}/edit` },
    ];

    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        name_en: translations.name_en || '',
        name_ar: translations.name_ar || '',
        description_en: translations.description_en || '',
        description_ar: translations.description_ar || '',
        background_image: null as File | null,
        website_url: organization.website_url || '',
        contact_url: organization.contact_url || '',
        type: organization.type,
        is_featured: organization.is_featured,
        is_active: organization.is_active,
        category_ids: attachedCategories,
    });

    const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);

    useEffect(() => {
        // Set initial background preview
        if (organization.background_image_path) {
            setBackgroundPreview(`/storage/${organization.background_image_path}`);
        }

        // Set initially selected categories
        const initialSelected = categories.filter(category => attachedCategories.includes(category.id));
        setSelectedCategories(initialSelected);
    }, [organization, categories, attachedCategories]);

    const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('background_image', file);
            
            const reader = new FileReader();
            reader.onload = (e) => setBackgroundPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleCategorySelect = (category: Category, checked: boolean) => {
        if (checked) {
            setSelectedCategories(prev => [...prev, category]);
            setData('category_ids', [...data.category_ids, category.id]);
        } else {
            setSelectedCategories(prev => prev.filter(c => c.id !== category.id));
            setData('category_ids', data.category_ids.filter(id => id !== category.id));
        }
    };

    const removeSelectedCategory = (categoryId: number) => {
        setSelectedCategories(prev => prev.filter(c => c.id !== categoryId));
        setData('category_ids', data.category_ids.filter(id => id !== categoryId));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/aid-organizations/${organization.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Organization - ${translations.name_en || 'Untitled'}`} />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">Edit Aid Organization</h1>
                        <p className="text-sm text-muted-foreground">
                            Update organization details and content
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="outline">{organization.organization_id}</Badge>
                        <Badge variant="outline" className="capitalize gap-1">
                            {organization.type === 'organizations' ? <Building className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                            {organization.type === 'organizations' ? 'Organization' : 'Initiative'}
                        </Badge>
                        {organization.is_featured && (
                            <Badge variant="default">Featured</Badge>
                        )}
                        {!organization.is_active && (
                            <Badge variant="destructive">Inactive</Badge>
                        )}
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl">
                    <div className="lg:col-span-2">
                        <Card className="overflow-hidden">
                            <CardHeader className="px-6 py-4 border-b">
                                <CardTitle className="text-lg font-semibold">Organization Details</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Organization Type */}
                                    <div className="space-y-3">
                                        <Label>Organization Type</Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setData('type', 'organizations')}
                                                className={`p-4 border rounded-lg transition-colors ${
                                                    data.type === 'organizations'
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-border hover:border-primary/50'
                                                }`}
                                            >
                                                <div className="flex flex-col items-center gap-2 text-center">
                                                    <Building className="w-6 h-6" />
                                                    <div>
                                                        <div className="font-medium text-sm">
                                                            Organizations
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Formal aid organizations
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setData('type', 'initiatives')}
                                                className={`p-4 border rounded-lg transition-colors ${
                                                    data.type === 'initiatives'
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-border hover:border-primary/50'
                                                }`}
                                            >
                                                <div className="flex flex-col items-center gap-2 text-center">
                                                    <Users className="w-6 h-6" />
                                                    <div>
                                                        <div className="font-medium text-sm">
                                                            Initiatives
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Community initiatives
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                        {errors.type && (
                                            <p className="text-sm text-destructive">{errors.type}</p>
                                        )}
                                    </div>

                                    {/* Current Background Image */}
                                    {organization.background_image_path && (
                                        <div className="space-y-3">
                                            <Label>Current Background Image</Label>
                                            <div className="border rounded-lg p-4 bg-muted/30">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-16 h-16 bg-muted rounded overflow-hidden">
                                                        <img
                                                            src={`/storage/${organization.background_image_path}`}
                                                            alt="Current background"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">Current background image</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {organization.background_image_path}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Background Image Upload */}
                                    <div className="space-y-3">
                                        <Label>
                                            {organization.background_image_path ? 'Replace Background Image' : 'Background Image'} (Optional)
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
                                                            {organization.background_image_path 
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
                                                    {organization.background_image_path ? 'Replace Background' : 'Choose Background'}
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
                                                    <Label htmlFor="name_en">Name *</Label>
                                                    <Input
                                                        id="name_en"
                                                        type="text"
                                                        placeholder="Enter English name"
                                                        value={data.name_en}
                                                        onChange={(e) => setData('name_en', e.target.value)}
                                                        className={errors.name_en ? 'border-destructive' : ''}
                                                    />
                                                    {errors.name_en && (
                                                        <p className="text-sm text-destructive">{errors.name_en}</p>
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
                                                    <Label htmlFor="name_ar">Name *</Label>
                                                    <Input
                                                        id="name_ar"
                                                        type="text"
                                                        placeholder="أدخل الاسم بالعربية"
                                                        value={data.name_ar}
                                                        onChange={(e) => setData('name_ar', e.target.value)}
                                                        className={errors.name_ar ? 'border-destructive' : ''}
                                                        dir="rtl"
                                                    />
                                                    {errors.name_ar && (
                                                        <p className="text-sm text-destructive">{errors.name_ar}</p>
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

                                    {/* External Links */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                            External Links
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <Label htmlFor="website_url">Website URL (Optional)</Label>
                                                <div className="relative">
                                                    <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                                    <Input
                                                        id="website_url"
                                                        type="url"
                                                        placeholder="https://organization-website.com"
                                                        value={data.website_url}
                                                        onChange={(e) => setData('website_url', e.target.value)}
                                                        className={`pl-10 ${errors.website_url ? 'border-destructive' : ''}`}
                                                    />
                                                </div>
                                                {errors.website_url && (
                                                    <p className="text-sm text-destructive">{errors.website_url}</p>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                <Label htmlFor="contact_url">Contact URL (Optional)</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                                    <Input
                                                        id="contact_url"
                                                        type="url"
                                                        placeholder="mailto:contact@org.com or contact form URL"
                                                        value={data.contact_url}
                                                        onChange={(e) => setData('contact_url', e.target.value)}
                                                        className={`pl-10 ${errors.contact_url ? 'border-destructive' : ''}`}
                                                    />
                                                </div>
                                                {errors.contact_url && (
                                                    <p className="text-sm text-destructive">{errors.contact_url}</p>
                                                )}
                                            </div>
                                        </div>
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
                                                    Featured Organization
                                                </Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Show this organization on the home page
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
                                                    Make this organization visible on the site
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
                                            {processing ? 'Updating...' : 'Update Organization'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Categories & Preview Panel */}
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
                                                {data.type === 'initiatives' ? (
                                                    <Users className="mx-auto w-8 h-8 mb-2" />
                                                ) : (
                                                    <Building className="mx-auto w-8 h-8 mb-2" />
                                                )}
                                                <p className="text-sm">No background image</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Preview */}
                                    <div className="space-y-2">
                                        <Badge variant="outline" className="text-xs capitalize">
                                            {data.type === 'organizations' ? 'Organization' : 'Initiative'}
                                        </Badge>
                                        <h3 className="font-medium text-sm">
                                            {data.name_en || 'Organization name will appear here'}
                                        </h3>
                                        {data.description_en && (
                                            <p className="text-xs text-muted-foreground line-clamp-3">
                                                {data.description_en}
                                            </p>
                                        )}
                                    </div>

                                    {/* Links Preview */}
                                    {(data.website_url || data.contact_url) && (
                                        <div className="flex gap-1 pt-2 border-t">
                                            {data.website_url && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <ExternalLink className="w-3 h-3" />
                                                    Website
                                                </div>
                                            )}
                                            {data.contact_url && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Mail className="w-3 h-3" />
                                                    Contact
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
                                            <span className="text-muted-foreground">Categories:</span>
                                            <span>{selectedCategories.length} selected</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Selected Categories */}
                        {selectedCategories.length > 0 && (
                            <Card>
                                <CardHeader className="px-6 py-4 border-b">
                                    <CardTitle className="text-lg font-semibold">
                                        Selected Categories ({selectedCategories.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-2">
                                        {selectedCategories.map((category) => (
                                            <div key={category.id} className="flex items-center justify-between p-2 border rounded">
                                                <div>
                                                    <p className="text-sm font-medium">{category.name}</p>
                                                    <p className="text-xs text-muted-foreground">{category.slug}</p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeSelectedCategory(category.id)}
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

                        {/* Category Selection */}
                        <Card>
                            <CardHeader className="px-6 py-4 border-b">
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <Tag className="w-4 h-4" />
                                    Categories
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Select categories that apply to this organization
                                </p>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-3">
                                    {categories.length > 0 ? (
                                        categories.map((category) => (
                                            <div key={category.id} className="flex items-center gap-3 p-2">
                                                <Checkbox
                                                    checked={data.category_ids.includes(category.id)}
                                                    onCheckedChange={(checked) => handleCategorySelect(category, Boolean(checked))}
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{category.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {category.slug}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {category.name_ar}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <Tag className="mx-auto w-8 h-8 text-muted-foreground mb-2" />
                                            <p className="text-sm text-muted-foreground">
                                                No categories available. Create some categories first.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Organization Info */}
                        <Card>
                            <CardHeader className="px-6 py-4 border-b">
                                <CardTitle className="text-lg font-semibold">Organization Info</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">ID:</span>
                                        <span className="font-mono">{organization.organization_id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Created:</span>
                                        <span>{new Date(organization.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Updated:</span>
                                        <span>{new Date(organization.updated_at).toLocaleDateString()}</span>
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
