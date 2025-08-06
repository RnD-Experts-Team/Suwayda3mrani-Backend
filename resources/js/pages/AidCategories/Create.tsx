// resources/js/pages/AidCategories/Create.tsx

import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tag, Hash, Palette } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Aid Organizations', href: '/aid-organizations' },
    { title: 'Categories', href: '/aid-categories' },
    { title: 'Create', href: '/aid-categories/create' },
];

export default function AidCategoryCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name_en: '',
        name_ar: '',
        slug: '',
        icon: '',
        color: '#6b7280',
    });

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const handleNameChange = (value: string, language: 'en' | 'ar') => {
        setData(`name_${language}`, value);
        
        // Auto-generate slug from English name
        if (language === 'en' && !data.slug) {
            setData('slug', generateSlug(value));
        }
    };

    const commonCategories = [
        { name: 'Food Aid', name_ar: 'المساعدات الغذائية', slug: 'food', icon: '🍞', color: '#f97316' },
        { name: 'Medical Aid', name_ar: 'المساعدات الطبية', slug: 'medical', icon: '🏥', color: '#dc2626' },
        { name: 'Shelter', name_ar: 'المأوى', slug: 'shelter', icon: '🏠', color: '#059669' },
        { name: 'Education', name_ar: 'التعليم', slug: 'education', icon: '📚', color: '#2563eb' },
        { name: 'Clothing', name_ar: 'الملابس', slug: 'clothing', icon: '👕', color: '#7c3aed' },
        { name: 'Emergency', name_ar: 'الطوارئ', slug: 'emergency', icon: '🚨', color: '#dc2626' },
    ];

    const handleQuickFill = (category: typeof commonCategories[0]) => {
        setData({
            name_en: category.name,
            name_ar: category.name_ar,
            slug: category.slug,
            icon: category.icon,
            color: category.color,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/aid-categories');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Aid Category" />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">Create New Aid Category</h1>
                        <p className="text-sm text-muted-foreground">Add a new category to organize aid organizations</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">
                    <div className="lg:col-span-2">
                        <Card className="overflow-hidden">
                            <CardHeader className="px-6 py-4 border-b">
                                <CardTitle className="text-lg font-semibold">Category Details</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Multilingual Names */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* English Name */}
                                        <div className="space-y-3">
                                            <Label htmlFor="name_en">English Name *</Label>
                                            <Input
                                                id="name_en"
                                                type="text"
                                                placeholder="e.g., Food Aid"
                                                value={data.name_en}
                                                onChange={(e) => handleNameChange(e.target.value, 'en')}
                                                className={errors.name_en ? 'border-destructive' : ''}
                                            />
                                            {errors.name_en && (
                                                <p className="text-sm text-destructive">{errors.name_en}</p>
                                            )}
                                        </div>

                                        {/* Arabic Name */}
                                        <div className="space-y-3">
                                            <Label htmlFor="name_ar">Arabic Name *</Label>
                                            <Input
                                                id="name_ar"
                                                type="text"
                                                placeholder="مثال: المساعدات الغذائية"
                                                value={data.name_ar}
                                                onChange={(e) => handleNameChange(e.target.value, 'ar')}
                                                className={errors.name_ar ? 'border-destructive' : ''}
                                                dir="rtl"
                                            />
                                            {errors.name_ar && (
                                                <p className="text-sm text-destructive">{errors.name_ar}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Slug */}
                                    <div className="space-y-3">
                                        <Label htmlFor="slug">Slug *</Label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                            <Input
                                                id="slug"
                                                type="text"
                                                placeholder="food-aid"
                                                value={data.slug}
                                                onChange={(e) => setData('slug', e.target.value)}
                                                className={`pl-10 font-mono ${errors.slug ? 'border-destructive' : ''}`}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Used in URLs and filters. Should be lowercase with hyphens.
                                        </p>
                                        {errors.slug && (
                                            <p className="text-sm text-destructive">{errors.slug}</p>
                                        )}
                                    </div>

                                    {/* Icon and Color */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Icon */}
                                        <div className="space-y-3">
                                            <Label htmlFor="icon">Icon (Optional)</Label>
                                            <Input
                                                id="icon"
                                                type="text"
                                                placeholder="🍞 or icon name"
                                                value={data.icon}
                                                onChange={(e) => setData('icon', e.target.value)}
                                                className={errors.icon ? 'border-destructive' : ''}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Use an emoji or icon identifier
                                            </p>
                                            {errors.icon && (
                                                <p className="text-sm text-destructive">{errors.icon}</p>
                                            )}
                                        </div>

                                        {/* Color */}
                                        <div className="space-y-3">
                                            <Label htmlFor="color">Color (Optional)</Label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Palette className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                                    <Input
                                                        id="color"
                                                        type="text"
                                                        placeholder="#6b7280"
                                                        value={data.color}
                                                        onChange={(e) => setData('color', e.target.value)}
                                                        className={`pl-10 font-mono ${errors.color ? 'border-destructive' : ''}`}
                                                    />
                                                </div>
                                                <input
                                                    type="color"
                                                    value={data.color}
                                                    onChange={(e) => setData('color', e.target.value)}
                                                    className="w-12 h-10 rounded border border-input cursor-pointer"
                                                />
                                            </div>
                                            {errors.color && (
                                                <p className="text-sm text-destructive">{errors.color}</p>
                                            )}
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
                                            {processing ? 'Creating...' : 'Create Category'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Preview and Quick Fill Panel */}
                    <div className="space-y-4">
                        {/* Preview */}
                        <Card>
                            <CardHeader className="px-6 py-4 border-b">
                                <CardTitle className="text-lg font-semibold">Preview</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {/* Category Preview */}
                                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                                        <div 
                                            className="w-10 h-10 rounded-full flex items-center justify-center"
                                            style={{ 
                                                backgroundColor: data.color || '#6b7280',
                                                color: 'white'
                                            }}
                                        >
                                            {data.icon ? (
                                                <span className="text-sm">{data.icon}</span>
                                            ) : (
                                                <Tag className="w-5 h-5" />
                                            )}
                                        </div>
                                        
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">
                                                {data.name_en || 'Category name'}
                                            </p>
                                            <p className="text-xs text-muted-foreground" dir="rtl">
                                                {data.name_ar || 'اسم التصنيف'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Slug Preview */}
                                    {data.slug && (
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">URL Slug</Label>
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <Hash className="w-3 h-3" />
                                                <span className="font-mono">{data.slug}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Color Swatch */}
                                    {data.color && (
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Color</Label>
                                            <div className="flex items-center gap-2">
                                                <div 
                                                    className="w-6 h-6 rounded border"
                                                    style={{ backgroundColor: data.color }}
                                                />
                                                <span className="text-sm font-mono text-muted-foreground">
                                                    {data.color}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Fill */}
                        <Card>
                            <CardHeader className="px-6 py-4 border-b">
                                <CardTitle className="text-lg font-semibold">Common Categories</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Click to quickly fill in common aid categories
                                </p>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-2">
                                    {commonCategories.map((category, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => handleQuickFill(category)}
                                            className="w-full text-left p-3 border rounded-lg hover:bg-muted transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                                                    style={{ 
                                                        backgroundColor: category.color,
                                                        color: 'white'
                                                    }}
                                                >
                                                    {category.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm">
                                                        {category.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate" dir="rtl">
                                                        {category.name_ar}
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className="text-xs">
                                                    {category.slug}
                                                </Badge>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
