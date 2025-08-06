// resources/js/pages/HomeSections/Show.tsx

import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { 
    Home, Layout, Edit, Trash2, ArrowLeft, Calendar, Copy, CheckCircle, Image
} from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

interface HomeSection {
    id: number;
    section_id: string;
    type: 'hero' | 'suggestion';
    button_variant?: string;
    action_key?: string;
    image_path?: string;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
    translated_content: {
        title: {
            en: string;
            ar: string;
        };
        description: {
            en: string;
            ar: string;
        };
        button_text: {
            en: string;
            ar: string;
        };
    };
}

interface Props {
    homeSection: HomeSection;
}

export default function HomeSectionShow({ homeSection }: Props) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ar'>('en');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Home Sections', href: '/home-sections' },
        { title: homeSection.translated_content.title.en || 'Section', href: `/home-sections/${homeSection.id}` },
    ];

    const handleDelete = () => {
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        router.delete(`/home-sections/${homeSection.id}`);
        setDeleteDialogOpen(false);
    };

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const currentContent = homeSection.translated_content;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${homeSection.translated_content.title.en || 'Home Section'} - View`} />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 overflow-x-auto">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Link href="/home-sections">
                                <Button variant="outline" size="sm" className="gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Sections
                                </Button>
                            </Link>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-lg">
                                {homeSection.type === 'hero' ? (
                                    <Home className="w-6 h-6" />
                                ) : (
                                    <Layout className="w-6 h-6" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    {currentContent.title[currentLanguage] || 'Untitled Section'}
                                </h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="gap-1 capitalize">
                                        {homeSection.type}
                                    </Badge>
                                    <Badge variant="outline">
                                        {homeSection.section_id}
                                    </Badge>
                                    {!homeSection.is_active && (
                                        <Badge variant="destructive">
                                            Inactive
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Link href={`/home-sections/${homeSection.id}/edit`}>
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Section Image */}
                        <Card className="overflow-hidden">
                            <CardContent className="p-0">
                                <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                                    {homeSection.image_path ? (
                                        <img
                                            src={`/storage/${homeSection.image_path}`}
                                            alt={currentContent.title[currentLanguage]}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-center text-muted-foreground">
                                            {homeSection.type === 'hero' ? (
                                                <Home className="mx-auto w-12 h-12 mb-3" />
                                            ) : (
                                                <Layout className="mx-auto w-12 h-12 mb-3" />
                                            )}
                                            <p className="text-sm">No image uploaded</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Content */}
                        <Card>
                            <CardHeader className="border-b">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-semibold">Content</CardTitle>
                                    <div className="flex gap-1 p-1 bg-muted rounded-lg">
                                        <Button
                                            variant={currentLanguage === 'en' ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setCurrentLanguage('en')}
                                            className="h-8 px-3 text-xs"
                                        >
                                            English
                                        </Button>
                                        <Button
                                            variant={currentLanguage === 'ar' ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setCurrentLanguage('ar')}
                                            className="h-8 px-3 text-xs"
                                        >
                                            العربية
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Title ({currentLanguage.toUpperCase()})
                                        </label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-lg font-semibold" dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
                                                {currentContent.title[currentLanguage] || 'No title provided'}
                                            </p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyToClipboard(currentContent.title[currentLanguage] || '', `title_${currentLanguage}`)}
                                                className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                                            >
                                                {copiedField === `title_${currentLanguage}` ? (
                                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                                ) : (
                                                    <Copy className="w-3 h-3" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Description ({currentLanguage.toUpperCase()})
                                        </label>
                                        <div className="flex items-start gap-2 mt-1">
                                            <div className="flex-1">
                                                <p 
                                                    className="text-sm leading-relaxed whitespace-pre-wrap" 
                                                    dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}
                                                >
                                                    {currentContent.description[currentLanguage] || 'No description provided'}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyToClipboard(currentContent.description[currentLanguage] || '', `description_${currentLanguage}`)}
                                                className="h-6 w-6 p-0 opacity-60 hover:opacity-100 mt-1"
                                            >
                                                {copiedField === `description_${currentLanguage}` ? (
                                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                                ) : (
                                                    <Copy className="w-3 h-3" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {currentContent.button_text[currentLanguage] && (
                                        <>
                                            <Separator />
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">
                                                    Button Text ({currentLanguage.toUpperCase()})
                                                </label>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-sm" dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
                                                        {currentContent.button_text[currentLanguage]}
                                                    </p>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(currentContent.button_text[currentLanguage] || '', `button_text_${currentLanguage}`)}
                                                        className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                                                    >
                                                        {copiedField === `button_text_${currentLanguage}` ? (
                                                            <CheckCircle className="w-3 h-3 text-green-600" />
                                                        ) : (
                                                            <Copy className="w-3 h-3" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Configuration */}
                        <Card>
                            <CardHeader className="border-b">
                                <CardTitle className="text-lg font-semibold">Configuration</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Type</span>
                                        <Badge variant="outline" className="capitalize">
                                            {homeSection.type}
                                        </Badge>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Status</span>
                                        <Badge variant={homeSection.is_active ? "default" : "secondary"}>
                                            {homeSection.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Sort Order</span>
                                        <span className="text-sm">{homeSection.sort_order}</span>
                                    </div>

                                    {homeSection.button_variant && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">Button Style</span>
                                            <Badge variant="outline" className="capitalize">
                                                {homeSection.button_variant}
                                            </Badge>
                                        </div>
                                    )}

                                    {homeSection.action_key && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">Action Key</span>
                                            <code className="text-xs bg-muted px-2 py-1 rounded">
                                                {homeSection.action_key}
                                            </code>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Metadata */}
                        <Card>
                            <CardHeader className="border-b">
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    Metadata
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4 text-sm">
                                    <div>
                                        <label className="font-medium text-muted-foreground">Section ID</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <code className="text-xs bg-muted px-2 py-1 rounded">
                                                {homeSection.section_id}
                                            </code>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyToClipboard(homeSection.section_id, 'section_id')}
                                                className="h-6 w-6 p-0"
                                            >
                                                {copiedField === 'section_id' ? (
                                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                                ) : (
                                                    <Copy className="w-3 h-3" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="font-medium text-muted-foreground">Created</label>
                                        <p className="mt-1">{new Date(homeSection.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}</p>
                                    </div>
                                    
                                    <div>
                                        <label className="font-medium text-muted-foreground">Last Updated</label>
                                        <p className="mt-1">{new Date(homeSection.updated_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}</p>
                                    </div>
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
                            This action cannot be undone. This will permanently delete "{homeSection.translated_content.title.en}" and all associated content including translations.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDelete} 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete Section
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
