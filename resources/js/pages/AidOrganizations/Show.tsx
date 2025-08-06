// resources/js/pages/AidOrganizations/Show.tsx

import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
    Building, Users, Star, StarOff, Edit, Trash2, ExternalLink, 
    Mail, Calendar, Tag, Globe, ArrowLeft, MoreHorizontal,
    Eye, EyeOff, Copy, CheckCircle
} from 'lucide-react';
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
    sort_order: number;
    created_at: string;
    updated_at: string;
    translated_content: {
        id: string;
        type: string;
        url: string;
        website_url?: string;
        contact_url?: string;
        categories: string[];
        en: {
            name: string;
            description: string;
            backgroundImage?: string;
            url: string;
        };
        ar: {
            name: string;
            description: string;
            backgroundImage?: string;
            url: string;
        };
    };
    categories: Array<{
        id: number;
        slug: string;
        name: string;
        name_ar: string;
    }>;
}

interface Props {
    organization: AidOrganization;
}

export default function AidOrganizationShow({ organization }: Props) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ar'>('en');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Aid Organizations', href: '/aid-organizations' },
        { title: organization.translated_content.en.name || 'Organization', href: `/aid-organizations/${organization.id}` },
    ];

    const handleDelete = () => {
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        router.delete(`/aid-organizations/${organization.id}`);
        setDeleteDialogOpen(false);
    };

    const toggleFeatured = () => {
        router.patch(`/aid-organizations/${organization.id}/toggle-featured`, {}, {
            preserveState: true,
            preserveScroll: true,
        });
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

    const currentContent = organization.translated_content[currentLanguage];
    const otherLanguage = currentLanguage === 'en' ? 'ar' : 'en';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${organization.translated_content.en.name || 'Organization'} - View`} />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 overflow-x-auto">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Link href="/aid-organizations">
                                <Button variant="outline" size="sm" className="gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Organizations
                                </Button>
                            </Link>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-lg">
                                {organization.type === 'organizations' ? (
                                    <Building className="w-6 h-6" />
                                ) : (
                                    <Users className="w-6 h-6" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    {currentContent.name || 'Untitled Organization'}
                                </h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="gap-1 capitalize">
                                        {organization.type === 'organizations' ? 'Organization' : 'Initiative'}
                                    </Badge>
                                    <Badge variant="outline">
                                        {organization.organization_id}
                                    </Badge>
                                    {organization.is_featured && (
                                        <Badge variant="default" className="gap-1">
                                            <Star className="w-3 h-3 fill-current" />
                                            Featured
                                        </Badge>
                                    )}
                                    {!organization.is_active && (
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
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleFeatured}
                            className="gap-2"
                        >
                            {organization.is_featured ? (
                                <>
                                    <StarOff className="w-4 h-4" />
                                    Unfeature
                                </>
                            ) : (
                                <>
                                    <Star className="w-4 h-4" />
                                    Feature
                                </>
                            )}
                        </Button>
                        <Link href={`/aid-organizations/${organization.id}/edit`}>
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
                        {/* Background Image */}
                        <Card className="overflow-hidden">
                            <CardContent className="p-0">
                                <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                                    {currentContent.backgroundImage ? (
                                        <img
                                            src={currentContent.backgroundImage}
                                            alt={currentContent.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-center text-muted-foreground">
                                            {organization.type === 'initiatives' ? (
                                                <Users className="mx-auto w-12 h-12 mb-3" />
                                            ) : (
                                                <Building className="mx-auto w-12 h-12 mb-3" />
                                            )}
                                            <p className="text-sm">No background image</p>
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
                                            Name ({currentLanguage.toUpperCase()})
                                        </label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-lg font-semibold" dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
                                                {currentContent.name || 'No name provided'}
                                            </p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyToClipboard(currentContent.name || '', `name_${currentLanguage}`)}
                                                className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                                            >
                                                {copiedField === `name_${currentLanguage}` ? (
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
                                                    {currentContent.description || 'No description provided'}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyToClipboard(currentContent.description || '', `description_${currentLanguage}`)}
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
                                </div>
                            </CardContent>
                        </Card>

                        {/* External Links */}
                        {(organization.website_url || organization.contact_url) && (
                            <Card>
                                <CardHeader className="border-b">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <Globe className="w-5 h-5" />
                                        External Links
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        {organization.website_url && (
                                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 rounded-lg">
                                                        <ExternalLink className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">Website</p>
                                                        <p className="text-xs text-muted-foreground break-all">
                                                            {organization.website_url}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(organization.website_url || '', 'website')}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        {copiedField === 'website' ? (
                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                        ) : (
                                                            <Copy className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <a href={organization.website_url} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {organization.contact_url && (
                                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-green-50 rounded-lg">
                                                        <Mail className="w-4 h-4 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">Contact</p>
                                                        <p className="text-xs text-muted-foreground break-all">
                                                            {organization.contact_url}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(organization.contact_url || '', 'contact')}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        {copiedField === 'contact' ? (
                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                        ) : (
                                                            <Copy className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <a href={organization.contact_url} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Categories */}
                        <Card>
                            <CardHeader className="border-b">
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <Tag className="w-5 h-5" />
                                    Categories
                                    <Badge variant="secondary" className="ml-auto">
                                        {organization.categories.length}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {organization.categories.length > 0 ? (
                                    <div className="space-y-3">
                                        {organization.categories.map((category) => (
                                            <div key={category.id} className="flex items-center justify-between p-2 border rounded">
                                                <div>
                                                    <p className="text-sm font-medium">{category.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="text-xs">
                                                            {category.slug}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {category.name_ar}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Tag className="mx-auto w-8 h-8 text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">
                                            No categories assigned
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Status & Settings */}
                        <Card>
                            <CardHeader className="border-b">
                                <CardTitle className="text-lg font-semibold">Status & Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Status</span>
                                        <Badge variant={organization.is_active ? "default" : "secondary"}>
                                            {organization.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Featured</span>
                                        <Badge variant={organization.is_featured ? "default" : "outline"}>
                                            {organization.is_featured ? "Yes" : "No"}
                                        </Badge>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Type</span>
                                        <Badge variant="outline" className="capitalize">
                                            {organization.type === 'organizations' ? 'Organization' : 'Initiative'}
                                        </Badge>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Sort Order</span>
                                        <span className="text-sm">{organization.sort_order}</span>
                                    </div>
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
                                        <label className="font-medium text-muted-foreground">Organization ID</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <code className="text-xs bg-muted px-2 py-1 rounded">
                                                {organization.organization_id}
                                            </code>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyToClipboard(organization.organization_id, 'org_id')}
                                                className="h-6 w-6 p-0"
                                            >
                                                {copiedField === 'org_id' ? (
                                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                                ) : (
                                                    <Copy className="w-3 h-3" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="font-medium text-muted-foreground">Created</label>
                                        <p className="mt-1">{new Date(organization.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}</p>
                                    </div>
                                    
                                    <div>
                                        <label className="font-medium text-muted-foreground">Last Updated</label>
                                        <p className="mt-1">{new Date(organization.updated_at).toLocaleDateString('en-US', {
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
                            This action cannot be undone. This will permanently delete "{organization.translated_content.en.name}" and all associated content including translations and category associations.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDelete} 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete Organization
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
