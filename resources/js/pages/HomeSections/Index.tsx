// resources/js/pages/HomeSections/Index.tsx

import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { 
    Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious
} from '@/components/ui/pagination';
import {
    Trash2, Edit, Plus, Search, Filter, RotateCcw, Eye, Image, Layout, Home
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

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    homeSections?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
        data: HomeSection[];
        links: PaginationLink[];
    } | null;
    filters?: {
        type?: string;
        search?: string;
    } | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Home Sections', href: '/home-sections' },
];

export default function HomeSectionsIndex(props: Props) {
    const { homeSections = null, filters = null } = props || {};

    // Create safe data objects
    const safeHomeSections = {
        data: homeSections?.data || [],
        links: homeSections?.links || [],
        meta: {
            current_page: homeSections?.current_page || 1,
            last_page: homeSections?.last_page || 1,
            per_page: homeSections?.per_page || 12,
            total: homeSections?.total || 0,
            from: homeSections?.from || null,
            to: homeSections?.to || null,
        }
    };

    const safeFilters = filters || {};

    const [searchTerm, setSearchTerm] = useState(safeFilters.search || '');
    const [selectedType, setSelectedType] = useState(safeFilters.type || '__all__');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    // Helper functions
    const getFilterValue = (displayValue: string) => {
        if (displayValue === '__all__') return '';
        return displayValue;
    };

    const applyFilters = () => {
        const params: Record<string, string> = {};
        
        if (searchTerm?.trim()) params.search = searchTerm.trim();
        
        const typeFilter = getFilterValue(selectedType);
        if (typeFilter) params.type = typeFilter;

        router.get('/home-sections', Object.keys(params).length > 0 ? params : {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedType('__all__');
        router.get('/home-sections');
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked && safeHomeSections.data.length > 0) {
            setSelectedItems(safeHomeSections.data.map(item => item.id));
        } else {
            setSelectedItems([]);
        }
    };

    const handleSelectItem = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedItems(prev => [...prev, id]);
        } else {
            setSelectedItems(prev => prev.filter(item => item !== id));
        }
    };

    const handleDelete = (id: number) => {
        setItemToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            router.delete(`/home-sections/${itemToDelete}`);
        }
        setDeleteDialogOpen(false);
        setItemToDelete(null);
    };

    const handleBulkDelete = () => {
        setBulkDeleteDialogOpen(true);
    };

    const confirmBulkDelete = () => {
        if (selectedItems.length > 0) {
            router.post('/home-sections/bulk-delete', { ids: selectedItems });
        }
        setBulkDeleteDialogOpen(false);
        setSelectedItems([]);
    };

    // Safe calculations
    const hasActiveFilters = Boolean(searchTerm?.trim() || selectedType !== '__all__');
    const hasData = safeHomeSections.data.length > 0;
    const isEmpty = safeHomeSections.meta.total === 0;
    const totalResults = safeHomeSections.meta.total;
    const fromResult = safeHomeSections.meta.from;
    const toResult = safeHomeSections.meta.to;

    const renderResultsInfo = () => {
        if (isEmpty && !hasActiveFilters) {
            return "No home sections found. Create your first section to get started.";
        } else if (isEmpty && hasActiveFilters) {
            return "No results match your current filters.";
        } else if (fromResult && toResult) {
            return `Showing ${fromResult} to ${toResult} of ${totalResults} results`;
        } else if (totalResults > 0) {
            return `${totalResults} section${totalResults !== 1 ? 's' : ''}`;
        } else {
            return "Loading sections...";
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'hero':
                return <Home className="w-3 h-3" />;
            case 'suggestion':
                return <Layout className="w-3 h-3" />;
            default:
                return <Layout className="w-3 h-3" />;
        }
    };

    const EmptyState = () => (
        <Card className="overflow-hidden">
            <CardContent className="py-16">
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                        <Layout className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">
                            {hasActiveFilters ? "No sections found" : "No home sections yet"}
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            {hasActiveFilters 
                                ? "Try adjusting your filters to find what you're looking for."
                                : "Create your first home section to customize your homepage."
                            }
                        </p>
                    </div>
                    <div className="flex justify-center gap-2 pt-4">
                        {hasActiveFilters && (
                            <Button variant="outline" onClick={handleClearFilters} className="gap-2">
                                <RotateCcw className="w-4 h-4" />
                                Clear Filters
                            </Button>
                        )}
                        <Link href="/home-sections/create">
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                Create Section
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Home Sections" />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">Home Sections</h1>
                        <p className="text-sm text-muted-foreground">
                            {renderResultsInfo()}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {selectedItems.length > 0 && (
                            <Button variant="destructive" onClick={handleBulkDelete} size="sm" className="gap-2">
                                <Trash2 className="w-4 h-4" />
                                Delete Selected ({selectedItems.length})
                            </Button>
                        )}
                        <Link href="/home-sections/create">
                            <Button size="sm" className="gap-2">
                                <Plus className="w-4 h-4" />
                                Create Section
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <Card className="overflow-hidden">
                    <CardHeader className="px-6 py-4 border-b">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-muted-foreground" />
                                <CardTitle className="text-lg font-semibold">Filters</CardTitle>
                            </div>
                            {hasActiveFilters && (
                                <Button variant="outline" size="sm" onClick={handleClearFilters} className="gap-2">
                                    <RotateCcw className="w-4 h-4" />
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    type="text"
                                    placeholder="Search sections..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            
                            {/* Type Filter */}
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">All Types</SelectItem>
                                    <SelectItem value="hero">Hero</SelectItem>
                                    <SelectItem value="suggestion">Suggestion</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Spacer */}
                            <div></div>

                            {/* Search Button */}
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
                        {/* Bulk Actions */}
                        {selectedItems.length > 0 && (
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                checked={selectedItems.length === safeHomeSections.data.length && safeHomeSections.data.length > 0}
                                                onCheckedChange={handleSelectAll}
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {selectedItems.length} of {safeHomeSections.data.length} selected
                                            </span>
                                        </div>
                                        <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2">
                                            <Trash2 className="w-4 h-4" />
                                            Delete Selected
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Sections Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {safeHomeSections.data.map((section) => (
                                <Card key={section.id} className="overflow-hidden group">
                                    <div className="relative">
                                        {/* Selection Checkbox */}
                                        <div className="absolute top-3 left-3 z-10">
                                            <Checkbox
                                                checked={selectedItems.includes(section.id)}
                                                onCheckedChange={(checked) => handleSelectItem(section.id, Boolean(checked))}
                                            />
                                        </div>

                                        {/* Background Image */}
                                        <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                                            {section.image_path ? (
                                                <img
                                                    src={`/storage/${section.image_path}`}
                                                    alt={section.translated_content.title.en}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <Image className="w-8 h-8" />
                                                    <span className="text-xs">No image</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Type Badge */}
                                        <div className="absolute bottom-3 left-3">
                                            <Badge variant="secondary" className="gap-1 capitalize">
                                                {getTypeIcon(section.type)}
                                                {section.type}
                                            </Badge>
                                        </div>
                                    </div>

                                    <CardContent className="p-4">
                                        <div className="space-y-3">
                                            {/* Title */}
                                            <h3 className="font-semibold text-sm line-clamp-2">
                                                {section.translated_content.title.en || 'Untitled Section'}
                                            </h3>

                                            {/* Description */}
                                            <p className="text-xs text-muted-foreground line-clamp-3">
                                                {section.translated_content.description.en || 'No description'}
                                            </p>

                                            {/* Section Info */}
                                            <div className="space-y-1">
                                                <div className="text-xs text-muted-foreground">
                                                    ID: {section.section_id}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Order: {section.sort_order}
                                                </div>
                                                {section.action_key && (
                                                    <div className="text-xs text-muted-foreground">
                                                        Action: {section.action_key}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex justify-between items-center pt-2">
                                                <div className="flex gap-1">
                                                    <Link href={`/home-sections/${section.id}`}>
                                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/home-sections/${section.id}/edit`}>
                                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDelete(section.id)}
                                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                <div className="flex gap-1">
                                                    {!section.is_active && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Inactive
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {safeHomeSections.meta.last_page > 1 && (
                            <div className="flex justify-center">
                                <Pagination>
                                    <PaginationContent>
                                        {safeHomeSections.links.map((link, index) => (
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

            {/* Delete Confirmation Dialogs */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the home section and all associated content.
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

            <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedItems.length} sections?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the selected home sections and all associated content.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmBulkDelete} 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete All
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
