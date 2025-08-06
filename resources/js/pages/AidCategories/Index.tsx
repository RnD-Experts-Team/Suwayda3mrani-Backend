// resources/js/pages/AidCategories/Index.tsx

import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    Pagination, 
    PaginationContent, 
    PaginationItem, 
    PaginationLink, 
    PaginationNext, 
    PaginationPrevious 
} from '@/components/ui/pagination';
import { 
    Trash2, Edit, Plus, Search, Filter, RotateCcw, 
    Tag, Hash, Eye
} from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

interface AidCategory {
    id: number;
    name_key: string;
    slug: string;
    icon?: string;
    color?: string;
    is_active: boolean;
    sort_order: number;
    organizations_count: number;
    created_at: string;
    updated_at: string;
    translated_content: {
        slug: string;
        icon?: string;
        color?: string;
        name: {
            en: string;
            ar: string;
        };
    };
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    categories?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
        data: AidCategory[];
        links: PaginationLink[];
        first_page_url: string;
        last_page_url: string;
        next_page_url: string | null;
        prev_page_url: string | null;
        path: string;
    } | null;
    filters?: {
        search?: string;
    } | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Aid Organizations', href: '/aid-organizations' },
    { title: 'Categories', href: '/aid-categories' },
];

export default function AidCategoriesIndex(props: Props) {
    const {
        categories = null,
        filters = null
    } = props || {};

    // Create safe data objects
    const safeCategories = {
        data: categories?.data || [],
        links: categories?.links || [],
        meta: {
            current_page: categories?.current_page || 1,
            last_page: categories?.last_page || 1,
            per_page: categories?.per_page || 15,
            total: categories?.total || 0,
            from: categories?.from || null,
            to: categories?.to || null,
        }
    };

    const safeFilters = filters || {};

    const [searchTerm, setSearchTerm] = useState(safeFilters.search || '');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    // Add a flag to track if we should trigger filter on search change
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Handle filter changes with debounce for search
    useEffect(() => {
        // Don't trigger on initial load to prevent pagination reset
        if (isInitialLoad) {
            setIsInitialLoad(false);
            return;
        }

        const timeoutId = setTimeout(() => {
            applyFilters();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const applyFilters = () => {
        const params: Record<string, string> = {};
        
        if (searchTerm?.trim()) params.search = searchTerm.trim();

        router.get('/aid-categories', Object.keys(params).length > 0 ? params : {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        router.get('/aid-categories');
    };

    const handleDelete = (id: number) => {
        setItemToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            router.delete(`/aid-categories/${itemToDelete}`);
        }
        setDeleteDialogOpen(false);
        setItemToDelete(null);
    };

    // Safe calculations
    const hasActiveFilters = Boolean(searchTerm?.trim());
    const isEmpty = safeCategories.meta.total === 0;
    const totalResults = safeCategories.meta.total;
    const fromResult = safeCategories.meta.from;
    const toResult = safeCategories.meta.to;

    // Helper function to render results info
    const renderResultsInfo = () => {
        if (isEmpty && !hasActiveFilters) {
            return "No categories found. Create your first category to get started.";
        } else if (isEmpty && hasActiveFilters) {
            return "No results match your current search.";
        } else if (fromResult && toResult) {
            return `Showing ${fromResult} to ${toResult} of ${totalResults} results`;
        } else if (totalResults > 0) {
            return `${totalResults} categor${totalResults !== 1 ? 'ies' : 'y'}`;
        } else {
            return "Loading categories...";
        }
    };

    const EmptyState = () => (
        <Card className="overflow-hidden">
            <CardContent className="py-16">
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                        <Tag className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">
                            {hasActiveFilters ? "No categories found" : "No categories yet"}
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            {hasActiveFilters 
                                ? "Try adjusting your search to find what you're looking for."
                                : "Create your first aid category to organize organizations by type."
                            }
                        </p>
                    </div>
                    <div className="flex justify-center gap-2 pt-4">
                        {hasActiveFilters && (
                            <Button variant="outline" onClick={handleClearFilters} className="gap-2">
                                <RotateCcw className="w-4 h-4" />
                                Clear Search
                            </Button>
                        )}
                        <Link href="/aid-categories/create">
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                Create Category
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Aid Categories" />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">Aid Categories</h1>
                        <p className="text-sm text-muted-foreground">
                            {renderResultsInfo()}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/aid-organizations">
                            <Button variant="outline" size="sm" className="gap-2">
                                ← Back to Organizations
                            </Button>
                        </Link>
                        <Link href="/aid-categories/create">
                            <Button size="sm" className="gap-2">
                                <Plus className="w-4 h-4" />
                                Create Category
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Search */}
                <Card className="overflow-hidden">
                    <CardHeader className="px-6 py-4 border-b">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Search className="w-4 h-4 text-muted-foreground" />
                                <CardTitle className="text-lg font-semibold">Search Categories</CardTitle>
                            </div>
                            {hasActiveFilters && (
                                <Button variant="outline" size="sm" onClick={handleClearFilters} className="gap-2">
                                    <RotateCcw className="w-4 h-4" />
                                    Clear Search
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    type="text"
                                    placeholder="Search categories..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button onClick={applyFilters} className="gap-2">
                                <Search className="w-4 h-4" />
                                Search
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Content */}
                {isEmpty ? (
                    <EmptyState />
                ) : (
                    <>
                        {/* Categories Table */}
                        <Card className="overflow-hidden">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="border-b bg-muted/50">
                                            <tr>
                                                <th className="text-left p-4 font-medium text-sm">Category</th>
                                                <th className="text-left p-4 font-medium text-sm">Slug</th>
                                                <th className="text-left p-4 font-medium text-sm">Organizations</th>
                                                <th className="text-left p-4 font-medium text-sm">Status</th>
                                                <th className="text-right p-4 font-medium text-sm">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {safeCategories.data.map((category) => (
                                                <tr key={category.id} className="hover:bg-muted/50">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            {/* Category Icon/Color */}
                                                            <div 
                                                                className="w-8 h-8 rounded-full flex items-center justify-center"
                                                                style={{ 
                                                                    backgroundColor: category.color || '#6b7280',
                                                                    color: 'white'
                                                                }}
                                                            >
                                                                {category.icon ? (
                                                                    <span className="text-xs">{category.icon}</span>
                                                                ) : (
                                                                    <Tag className="w-4 h-4" />
                                                                )}
                                                            </div>
                                                            
                                                            <div>
                                                                <p className="font-medium text-sm">
                                                                    {category.translated_content.name.en}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground" dir="rtl">
                                                                    {category.translated_content.name.ar}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-1">
                                                            <Hash className="w-3 h-3 text-muted-foreground" />
                                                            <span className="font-mono text-sm text-muted-foreground">
                                                                {category.slug}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    
                                                    <td className="p-4">
                                                        <Badge variant="secondary" className="gap-1">
                                                            <span>{category.organizations_count}</span>
                                                            <span>organization{category.organizations_count !== 1 ? 's' : ''}</span>
                                                        </Badge>
                                                    </td>
                                                    
                                                    <td className="p-4">
                                                        <Badge variant={category.is_active ? 'default' : 'secondary'}>
                                                            {category.is_active ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </td>
                                                    
                                                    <td className="p-4">
                                                        <div className="flex justify-end gap-1">
                                                            <Link href={`/aid-categories/${category.id}/edit`}>
                                                                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                                                    <Edit className="w-4 h-4" />
                                                                </Button>
                                                            </Link>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleDelete(category.id)}
                                                                disabled={category.organizations_count > 0}
                                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive disabled:opacity-50"
                                                                title={category.organizations_count > 0 ? 'Cannot delete category with organizations' : 'Delete category'}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pagination */}
                        {safeCategories.meta.last_page > 1 && (
                            <div className="flex justify-center">
                                <Pagination>
                                    <PaginationContent>
                                        {safeCategories.links.map((link, index) => (
                                            <PaginationItem key={index}>
                                                {link.label === '&laquo; Previous' ? (
                                                    <PaginationPrevious 
                                                        href={link.url || '#'}
                                                        className={!link.url ? 'pointer-events-none opacity-50' : ''}
                                                    />
                                                ) : link.label === 'Next &raquo;' ? (
                                                    <PaginationNext 
                                                        href={link.url || '#'}
                                                        className={!link.url ? 'pointer-events-none opacity-50' : ''}
                                                    />
                                                ) : (
                                                    <PaginationLink 
                                                        href={link.url || '#'}
                                                        isActive={link.active}
                                                        className={!link.url ? 'pointer-events-none opacity-50' : ''}
                                                    >
                                                        {link.label}
                                                    </PaginationLink>
                                                )}
                                            </PaginationItem>
                                        ))}
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the category and all associated content.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDelete} 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
