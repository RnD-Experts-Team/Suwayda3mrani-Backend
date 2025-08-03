// resources/js/pages/AidOrganizations/Index.tsx

import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
    Building, Users, Star, StarOff, Eye, ExternalLink, 
    Mail, Tag
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
    categories_count: number;
}

interface Category {
    slug: string;
    name: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    organizations?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
        data: AidOrganization[];
        links: PaginationLink[];
        first_page_url: string;
        last_page_url: string;
        next_page_url: string | null;
        prev_page_url: string | null;
        path: string;
    } | null;
    categories?: Category[] | null;
    filters?: {
        type?: string;
        category?: string;
        featured?: string;
        search?: string;
    } | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Aid Organizations', href: '/aid-organizations' },
];

export default function AidOrganizationsIndex(props: Props) {
    const {
        organizations = null,
        categories = null,
        filters = null
    } = props || {};

    // Create safe data objects
    const safeOrganizations = {
        data: organizations?.data || [],
        links: organizations?.links || [],
        meta: {
            current_page: organizations?.current_page || 1,
            last_page: organizations?.last_page || 1,
            per_page: organizations?.per_page || 12,
            total: organizations?.total || 0,
            from: organizations?.from || null,
            to: organizations?.to || null,
        }
    };

    const safeCategories: Category[] = Array.isArray(categories) ? categories : [];
    const safeFilters = filters || {};

    const [searchTerm, setSearchTerm] = useState(safeFilters.search || '');
    const [selectedType, setSelectedType] = useState(safeFilters.type || '__all__');
    const [selectedCategory, setSelectedCategory] = useState(safeFilters.category || '__all__');
    const [selectedFeatured, setSelectedFeatured] = useState(safeFilters.featured || '__all__');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
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

    // Helper functions to convert between display and filter values
    const getFilterValue = (displayValue: string) => {
        if (displayValue === '__all__') return '';
        return displayValue;
    };

    const getDisplayValue = (filterValue: string) => {
        if (!filterValue) return '__all__';
        return filterValue;
    };

    const applyFilters = () => {
        const params: Record<string, string> = {};
        
        if (searchTerm?.trim()) params.search = searchTerm.trim();
        
        const typeFilter = getFilterValue(selectedType);
        if (typeFilter) params.type = typeFilter;
        
        const categoryFilter = getFilterValue(selectedCategory);
        if (categoryFilter) params.category = categoryFilter;
        
        const featuredFilter = getFilterValue(selectedFeatured);
        if (featuredFilter) params.featured = featuredFilter;

        router.get('/aid-organizations', Object.keys(params).length > 0 ? params : {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const applyFiltersWithValues = (overrides: {
        type?: string;
        category?: string;
        featured?: string;
        search?: string;
    } = {}) => {
        const params: Record<string, string> = {};
        
        const searchValue = overrides.search !== undefined ? overrides.search : searchTerm;
        const typeValue = overrides.type !== undefined ? overrides.type : selectedType;
        const categoryValue = overrides.category !== undefined ? overrides.category : selectedCategory;
        const featuredValue = overrides.featured !== undefined ? overrides.featured : selectedFeatured;
        
        if (searchValue?.trim()) params.search = searchValue.trim();
        
        const typeFilter = getFilterValue(typeValue);
        if (typeFilter) params.type = typeFilter;
        
        const categoryFilter = getFilterValue(categoryValue);
        if (categoryFilter) params.category = categoryFilter;
        
        const featuredFilter = getFilterValue(featuredValue);
        if (featuredFilter) params.featured = featuredFilter;

        router.get('/aid-organizations', Object.keys(params).length > 0 ? params : {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedType('__all__');
        setSelectedCategory('__all__');
        setSelectedFeatured('__all__');
        router.get('/aid-organizations');
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked && safeOrganizations.data.length > 0) {
            setSelectedItems(safeOrganizations.data.map(item => item.id));
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
            router.delete(`/aid-organizations/${itemToDelete}`);
        }
        setDeleteDialogOpen(false);
        setItemToDelete(null);
    };

    const handleBulkDelete = () => {
        setBulkDeleteDialogOpen(true);
    };

    const confirmBulkDelete = () => {
        if (selectedItems.length > 0) {
            router.post('/aid-organizations/bulk-delete', { ids: selectedItems });
        }
        setBulkDeleteDialogOpen(false);
        setSelectedItems([]);
    };

    const toggleFeatured = (organization: AidOrganization) => {
        router.patch(`/aid-organizations/${organization.id}/toggle-featured`, {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Safe calculations
    const hasActiveFilters = Boolean(
        searchTerm?.trim() || 
        selectedType !== '__all__' || 
        selectedCategory !== '__all__' || 
        selectedFeatured !== '__all__'
    );
    const hasData = safeOrganizations.data.length > 0;
    const isEmpty = safeOrganizations.meta.total === 0;
    const totalResults = safeOrganizations.meta.total;
    const fromResult = safeOrganizations.meta.from;
    const toResult = safeOrganizations.meta.to;

    // Helper function to render results info
    const renderResultsInfo = () => {
        if (isEmpty && !hasActiveFilters) {
            return "No organizations found. Create your first organization to get started.";
        } else if (isEmpty && hasActiveFilters) {
            return "No results match your current filters.";
        } else if (fromResult && toResult) {
            return `Showing ${fromResult} to ${toResult} of ${totalResults} results`;
        } else if (totalResults > 0) {
            return `${totalResults} organization${totalResults !== 1 ? 's' : ''}`;
        } else {
            return "Loading organizations...";
        }
    };

    const EmptyState = () => (
        <Card className="overflow-hidden">
            <CardContent className="py-16">
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                        <Building className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">
                            {hasActiveFilters ? "No organizations found" : "No organizations yet"}
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            {hasActiveFilters 
                                ? "Try adjusting your filters to find what you're looking for."
                                : "Create your first aid organization to showcase relief efforts."
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
                        <Link href="/aid-organizations/create">
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                Create Organization
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Aid Organizations" />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">Aid Organizations</h1>
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
                        <Link href="/aid-categories">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Tag className="w-4 h-4" />
                                Manage Categories
                            </Button>
                        </Link>
                        <Link href="/aid-organizations/create">
                            <Button size="sm" className="gap-2">
                                <Plus className="w-4 h-4" />
                                Create Organization
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
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    type="text"
                                    placeholder="Search organizations..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            
                            {/* Type Filter */}
                            <Select value={selectedType} onValueChange={(value) => {
                                setSelectedType(value);
                                applyFiltersWithValues({ type: value });
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">All Types</SelectItem>
                                    <SelectItem value="organizations">Organizations</SelectItem>
                                    <SelectItem value="initiatives">Initiatives</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Category Filter */}
                            <Select value={selectedCategory} onValueChange={(value) => {
                                setSelectedCategory(value);
                                applyFiltersWithValues({ category: value });
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">All Categories</SelectItem>
                                    {safeCategories.map((category) => (
                                        <SelectItem key={category.slug} value={category.slug}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Featured Filter */}
                            <Select value={selectedFeatured} onValueChange={(value) => {
                                setSelectedFeatured(value);
                                applyFiltersWithValues({ featured: value });
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Items" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">All Items</SelectItem>
                                    <SelectItem value="true">Featured Only</SelectItem>
                                    <SelectItem value="false">Not Featured</SelectItem>
                                </SelectContent>
                            </Select>

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
                                                checked={selectedItems.length === safeOrganizations.data.length && safeOrganizations.data.length > 0}
                                                onCheckedChange={handleSelectAll}
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {selectedItems.length} of {safeOrganizations.data.length} selected
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

                        {/* Organizations Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {safeOrganizations.data.map((organization) => (
                                <Card key={organization.id} className="overflow-hidden group">
                                    <div className="relative">
                                        {/* Selection Checkbox */}
                                        <div className="absolute top-3 left-3 z-10">
                                            <Checkbox
                                                checked={selectedItems.includes(organization.id)}
                                                onCheckedChange={(checked) => handleSelectItem(organization.id, Boolean(checked))}
                                            />
                                        </div>

                                        {/* Featured Star */}
                                        <button
                                            onClick={() => toggleFeatured(organization)}
                                            className="absolute top-3 right-3 z-10 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            {organization.is_featured ? (
                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            ) : (
                                                <StarOff className="w-4 h-4" />
                                            )}
                                        </button>

                                        {/* Background Image */}
                                        <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                                            {organization.translated_content.en.backgroundImage ? (
                                                <img
                                                    src={organization.translated_content.en.backgroundImage}
                                                    alt={organization.translated_content.en.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <Building className="w-8 h-8" />
                                                    <span className="text-xs">No image</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Type Badge */}
                                        <div className="absolute bottom-3 left-3">
                                            <Badge variant="secondary" className="gap-1 capitalize">
                                                {organization.type === 'organizations' ? <Building className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                                                {organization.type === 'organizations' ? 'Org' : 'Initiative'}
                                            </Badge>
                                        </div>
                                    </div>

                                    <CardContent className="p-4">
                                        <div className="space-y-3">
                                            {/* Categories */}
                                            {organization.categories_count > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {organization.categories_count} categor{organization.categories_count !== 1 ? 'ies' : 'y'}
                                                    </Badge>
                                                </div>
                                            )}

                                            {/* Title */}
                                            <h3 className="font-semibold text-sm line-clamp-2">
                                                {organization.translated_content.en.name || 'Untitled'}
                                            </h3>

                                            {/* Description */}
                                            <p className="text-xs text-muted-foreground line-clamp-3">
                                                {organization.translated_content.en.description || 'No description'}
                                            </p>

                                            {/* External Links */}
                                            <div className="flex gap-1">
                                                {organization.website_url && (
                                                    <a
                                                        href={organization.website_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                )}
                                                {organization.contact_url && (
                                                    <a
                                                        href={organization.contact_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                                    >
                                                        <Mail className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex justify-between items-center pt-2">
                                                <div className="flex gap-1">
                                                    <Link href={`/aid-organizations/${organization.id}`}>
                                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/aid-organizations/${organization.id}/edit`}>
                                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDelete(organization.id)}
                                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                {organization.is_featured && (
                                                    <Badge variant="default" className="text-xs">
                                                        Featured
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {safeOrganizations.meta.last_page > 1 && (
                            <div className="flex justify-center">
                                <Pagination>
                                    <PaginationContent>
                                        {safeOrganizations.links.map((link, index) => (
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
                            This action cannot be undone. This will permanently delete the organization and all associated content.
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

            {/* Bulk Delete Confirmation Dialog */}
            <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedItems.length} organizations?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the selected organizations and all associated content.
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
