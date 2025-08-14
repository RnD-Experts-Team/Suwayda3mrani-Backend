import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Filter, RotateCcw, Eye, MapPin, FileText, Download, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { BreadcrumbItem } from '@/types';

interface Need {
    id: number;
    name: string;
    name_ar: string;
}

interface Entry {
    id: number;
    entry_number: string;
    submitter_name: string | null;
    location: string | null;
    status: string | null;
    date_submitted: string;
    hosted_families_count: number;
    martyrs_count: number;
    shelters_count: number;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    entries?: {
        data?: Entry[];
        links?: PaginationLink[];
        current_page?: number;
        last_page?: number;
        total?: number;
        per_page?: number;
        from?: number | null;
        to?: number | null;
    };
    needs?: Need[];
    predefinedNeeds?: Need[];
    otherNeeds?: Need[];
    filters?: {
        entry_number?: string;
        submitter_name?: string;
        location?: string;
        status?: string;
        needs?: number[] | number | string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Form Entries', href: '/form-entries' },
];

export default function EntriesIndex({
                                         entries = {},
                                         needs = [],
                                         predefinedNeeds = [],
                                         otherNeeds = [],
                                         filters = {}
                                     }: Props) {
    // Initialize state with proper type safety
    const [selectedNeeds, setSelectedNeeds] = useState<number[]>(() => {
        if (!filters?.needs) return [];

        // Handle both array and single value cases
        const needsArray = Array.isArray(filters.needs)
            ? filters.needs
            : [filters.needs];

        return needsArray
            .map(id => parseInt(String(id)))
            .filter(id => !isNaN(id));
    });

    // Form state for filters - NEW
    const [formFilters, setFormFilters] = useState({
        entry_number: filters?.entry_number || '',
        submitter_name: filters?.submitter_name || '',
        location: filters?.location || 'all',
        status: filters?.status || 'all',
    });

    const [needsPopoverOpen, setNeedsPopoverOpen] = useState(false);

    // Safely get data with proper type guards
    const entriesData = Array.isArray(entries?.data) ? entries.data : [];
    const paginationLinks = Array.isArray(entries?.links) ? entries.links : [];
    const needsList = Array.isArray(needs) ? needs : [];
    const predefinedNeedsList = Array.isArray(predefinedNeeds) ? predefinedNeeds : [];
    const otherNeedsList = Array.isArray(otherNeeds) ? otherNeeds : [];
    const isEmpty = entriesData.length === 0;

    // Sync selected needs with URL parameters
    useEffect(() => {
        if (!filters?.needs) {
            setSelectedNeeds([]);
            return;
        }

        const needsArray = Array.isArray(filters.needs)
            ? filters.needs
            : [filters.needs];

        const urlNeeds = needsArray
            .map(id => parseInt(String(id)))
            .filter(id => !isNaN(id));

        setSelectedNeeds(urlNeeds);
    }, [filters?.needs]);

    // Sync form state with URL filters
    useEffect(() => {
        setFormFilters({
            entry_number: filters?.entry_number || '',
            submitter_name: filters?.submitter_name || '',
            location: filters?.location || 'all',
            status: filters?.status || 'all',
        });
    }, [filters]);

    const applyFilters = (additionalFilters = {}) => {
        const filterParams = {
            ...formFilters,
            needs: selectedNeeds.length > 0 ? selectedNeeds : undefined,
            ...additionalFilters
        };

        // Clean up empty filters
        Object.keys(filterParams).forEach(key => {
            const value = filterParams[key];
            if (value === '' || value === 'all' || (Array.isArray(value) && value.length === 0)) {
                delete filterParams[key];
            }
        });

        // Remove page when applying new filters (except for pagination)
        if (!additionalFilters.hasOwnProperty('page')) {
            delete filterParams.page;
        }

        router.get('/form-entries', filterParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        setSelectedNeeds([]);
        setFormFilters({
            entry_number: '',
            submitter_name: '',
            location: 'all',
            status: 'all',
        });
        router.get('/form-entries', {}, {
            preserveState: false,
            preserveScroll: false
        });
    };

    const handleNeedsChange = (needId: number, checked: boolean) => {
        const updatedNeeds = checked
            ? [...selectedNeeds, needId]
            : selectedNeeds.filter(id => id !== needId);

        setSelectedNeeds(updatedNeeds);
    };

    const handleSelectAllOthers = (checked: boolean) => {
        const otherNeedIds = otherNeedsList.map(need => need.id);

        let updatedNeeds: number[];

        if (checked) {
            // Add all other needs that aren't already selected
            const newOtherNeeds = otherNeedIds.filter(id => !selectedNeeds.includes(id));
            updatedNeeds = [...selectedNeeds, ...newOtherNeeds];
        } else {
            // Remove all other needs
            updatedNeeds = selectedNeeds.filter(id => !otherNeedIds.includes(id));
        }

        setSelectedNeeds(updatedNeeds);
    };

    const handleFormChange = (field: string, value: string) => {
        setFormFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handlePaginationClick = (url: string | null) => {
        if (!url) return;

        const urlObj = new URL(url);
        const page = urlObj.searchParams.get('page');

        applyFilters({ page: page || 1 });
    };

    const getSelectedNeedsNames = () => {
        return needsList
            .filter(need => selectedNeeds.includes(need.id))
            .map(need => need.name_ar);
    };

    // Check if form has changes compared to current filters
    const hasFormChanges = () => {
        return formFilters.entry_number !== (filters?.entry_number || '') ||
            formFilters.submitter_name !== (filters?.submitter_name || '') ||
            formFilters.location !== (filters?.location || 'all') ||
            formFilters.status !== (filters?.status || 'all') ||
            JSON.stringify(selectedNeeds) !== JSON.stringify(
                Array.isArray(filters?.needs)
                    ? filters.needs.map(id => parseInt(String(id))).filter(id => !isNaN(id))
                    : filters?.needs ? [parseInt(String(filters.needs))].filter(id => !isNaN(id)) : []
            );
    };

    const hasActiveFilters = selectedNeeds.length > 0 ||
        Object.entries(filters).some(([key, value]) => {
            if (!value) return false;
            if (value === 'all') return false;
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'string') return value.trim() !== '';
            return true;
        });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Form Entries" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">Form Entries</h1>
                        <p className="text-sm text-muted-foreground">
                            {isEmpty
                                ? "No entries found"
                                : `Showing ${entries?.from ?? 'N/A'}-${entries?.to ?? 'N/A'} of ${entries?.total ?? 0} entries`
                            }
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <a href="/form-entries/export">
                            <Button variant="secondary" className="gap-1">
                                <Download className="h-4 w-4" /> Export
                            </Button>
                        </a>
                    </div>
                </div>

                {/* Filters with Manual Apply */}
                <Card className="overflow-hidden">
                    <CardContent className="p-4 space-y-4">
                        {/* Filter Inputs Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                            <Input
                                placeholder="Entry Number"
                                value={formFilters.entry_number}
                                onChange={(e) => handleFormChange('entry_number', e.target.value)}
                                className="w-full"
                            />

                            <Input
                                placeholder="Submitter Name"
                                value={formFilters.submitter_name}
                                onChange={(e) => handleFormChange('submitter_name', e.target.value)}
                                className="w-full"
                            />

                            <Select
                                value={formFilters.location}
                                onValueChange={(val) => handleFormChange('location', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Location" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Locations</SelectItem>
                                    <SelectItem value="عائلة مضيفة">عائلة مضيفة</SelectItem>
                                    <SelectItem value="مكان ايواء (او اجار)">مكان ايواء (او اجار)</SelectItem>
                                    <SelectItem value="no-location">لا يوجد</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={formFilters.status}
                                onValueChange={(val) => handleFormChange('status', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="أسماء ضحايا">أسماء ضحايا</SelectItem>
                                    <SelectItem value="منازل محترقة">منازل محترقة</SelectItem>
                                    <SelectItem value="منازل مسروقة">منازل مسروقة</SelectItem>
                                    <SelectItem value="نزوح">نزوح</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Combined Needs Filter with "Select All Others" */}
                            <Popover open={needsPopoverOpen} onOpenChange={setNeedsPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between">
                                        <span>
                                            {selectedNeeds.length === 0
                                                ? 'Select Needs'
                                                : `${selectedNeeds.length} need${selectedNeeds.length > 1 ? 's' : ''} selected`
                                            }
                                        </span>
                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-4" align="start">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-sm">Filter by Needs</h4>
                                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                                {/* Predefined Needs Section */}
                                                {predefinedNeedsList.length > 0 && (
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
                                                            Predefined Needs
                                                        </p>
                                                        {predefinedNeedsList.map((need) => (
                                                            <div key={need.id} className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={`need-${need.id}`}
                                                                    checked={selectedNeeds.includes(need.id)}
                                                                    onCheckedChange={(checked) =>
                                                                        handleNeedsChange(need.id, checked as boolean)
                                                                    }
                                                                />
                                                                <Label htmlFor={`need-${need.id}`} className="text-sm font-normal cursor-pointer">
                                                                    {need.name_ar}
                                                                </Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Other Needs Section with "Select All" */}
                                                {otherNeedsList.length > 0 && (
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
                                                            Other Needs
                                                        </p>

                                                        {/* Select All Others Checkbox */}
                                                        <div className="flex items-center space-x-2 bg-muted/50 p-2 rounded">
                                                            <Checkbox
                                                                id="select-all-others"
                                                                checked={otherNeedsList.every(need => selectedNeeds.includes(need.id))}
                                                                onCheckedChange={(checked) => handleSelectAllOthers(checked as boolean)}
                                                            />
                                                            <Label htmlFor="select-all-others" className="text-sm font-medium cursor-pointer">
                                                                Other (Select All)
                                                            </Label>
                                                        </div>

                                                        {/* Individual Other Needs */}
                                                        {otherNeedsList.map((need) => (
                                                            <div key={need.id} className="flex items-center space-x-2 ml-4">
                                                                <Checkbox
                                                                    id={`need-${need.id}`}
                                                                    checked={selectedNeeds.includes(need.id)}
                                                                    onCheckedChange={(checked) =>
                                                                        handleNeedsChange(need.id, checked as boolean)
                                                                    }
                                                                />
                                                                <Label htmlFor={`need-${need.id}`} className="text-sm font-normal cursor-pointer">
                                                                    {need.name_ar}
                                                                </Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Fallback: Show all needs if separation failed */}
                                                {predefinedNeedsList.length === 0 && otherNeedsList.length === 0 && needsList.length > 0 && (
                                                    <div className="space-y-2">
                                                        {needsList.map((need) => (
                                                            <div key={need.id} className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={`need-${need.id}`}
                                                                    checked={selectedNeeds.includes(need.id)}
                                                                    onCheckedChange={(checked) =>
                                                                        handleNeedsChange(need.id, checked as boolean)
                                                                    }
                                                                />
                                                                <Label htmlFor={`need-${need.id}`} className="text-sm font-normal cursor-pointer">
                                                                    {need.name_ar}
                                                                </Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={() => applyFilters()}
                                className="gap-1"
                                disabled={!hasFormChanges()}
                            >
                                <Filter className="h-4 w-4" /> Apply Filters
                            </Button>
                            <Button variant="outline" onClick={resetFilters} className="gap-1">
                                <RotateCcw className="h-4 w-4" /> Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2">
                        {filters?.entry_number && (
                            <Badge variant="secondary" className="gap-1">
                                Entry: {filters.entry_number}
                                <button
                                    onClick={() => {
                                        setFormFilters(prev => ({...prev, entry_number: ''}));
                                        applyFilters({ entry_number: '' });
                                    }}
                                    className="ml-1 text-xs hover:text-red-500"
                                >
                                    ×
                                </button>
                            </Badge>
                        )}

                        {filters?.submitter_name && (
                            <Badge variant="secondary" className="gap-1">
                                Submitter: {filters.submitter_name}
                                <button
                                    onClick={() => {
                                        setFormFilters(prev => ({...prev, submitter_name: ''}));
                                        applyFilters({ submitter_name: '' });
                                    }}
                                    className="ml-1 text-xs hover:text-red-500"
                                >
                                    ×
                                </button>
                            </Badge>
                        )}

                        {filters?.location && filters.location !== 'all' && (
                            <Badge variant="secondary" className="gap-1">
                                Location: {filters.location}
                                <button
                                    onClick={() => {
                                        setFormFilters(prev => ({...prev, location: 'all'}));
                                        applyFilters({ location: '' });
                                    }}
                                    className="ml-1 text-xs hover:text-red-500"
                                >
                                    ×
                                </button>
                            </Badge>
                        )}

                        {filters?.status && filters.status !== 'all' && (
                            <Badge variant="secondary" className="gap-1">
                                Status: {filters.status}
                                <button
                                    onClick={() => {
                                        setFormFilters(prev => ({...prev, status: 'all'}));
                                        applyFilters({ status: '' });
                                    }}
                                    className="ml-1 text-xs hover:text-red-500"
                                >
                                    ×
                                </button>
                            </Badge>
                        )}

                        {/* Selected Needs Badges */}
                        {getSelectedNeedsNames().map((needName, index) => (
                            <Badge key={index} variant="secondary" className="gap-1">
                                {needName}
                                <button
                                    onClick={() => {
                                        const needToRemove = needsList.find(n => n.name_ar === needName);
                                        if (needToRemove) {
                                            const updatedNeeds = selectedNeeds.filter(id => id !== needToRemove.id);
                                            setSelectedNeeds(updatedNeeds);
                                            applyFilters({ needs: updatedNeeds });
                                        }
                                    }}
                                    className="ml-1 text-xs hover:text-red-500"
                                >
                                    ×
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Content */}
                {isEmpty ? (
                    <Card className="text-center">
                        <CardContent className="py-16">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                <FileText className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="mt-3 text-lg font-medium">No entries found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Adjust your filters to see results
                            </p>
                            <div className="mt-4 flex justify-center gap-3">
                                <Button variant="outline" onClick={resetFilters}>
                                    <RotateCcw className="mr-2 h-4 w-4" /> Reset filters
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {entriesData.map((entry) => (
                            <Card key={entry.id} className="h-full flex flex-col hover:shadow-md transition-shadow">
                                <CardContent className="p-4 flex-1 flex flex-col">
                                    <div className="space-y-3 flex-1">
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <h3 className="font-semibold leading-tight">Entry #{entry.entry_number}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {entry.submitter_name || 'No submitter'}
                                                </p>
                                            </div>
                                            {entry.status && (
                                                <div className="flex flex-wrap gap-1">
                                                    {entry.status.split(',').map((status, index) => (
                                                        <Badge key={index} variant="outline" className="text-xs">
                                                            {status.trim()}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {entry.location && (
                                            <p className="flex items-center gap-2 text-sm">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span>{entry.location}</span>
                                            </p>
                                        )}

                                        <p className="text-sm text-muted-foreground">
                                            Submitted: {new Date(entry.date_submitted).toLocaleDateString()}
                                        </p>

                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <div className="space-y-1">
                                                <p className="font-medium">Families</p>
                                                <p>{entry.hosted_families_count}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-medium">Martyrs</p>
                                                <p>{entry.martyrs_count}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-medium">Shelters</p>
                                                <p>{entry.shelters_count}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t">
                                        <Link href={`/form-entries/${entry.id}`} className="w-full">
                                            <Button variant="default" className="w-full gap-2">
                                                <Eye className="h-4 w-4" /> View Details
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {(entries?.last_page ?? 0) > 1 && (
                    <div className="flex flex-col items-center gap-4 pt-4">
                        <div className="text-sm text-muted-foreground">
                            Page {entries?.current_page ?? 1} of {entries?.last_page ?? 1} ({entries?.total ?? 0} total entries)
                        </div>

                        <div className="flex gap-1 flex-wrap justify-center">
                            {paginationLinks.map((link, index) => {
                                if (!link.url) {
                                    if (link.label.includes('Previous')) {
                                        return (
                                            <Button key={index} variant="outline" disabled className="gap-1">
                                                <ChevronLeft className="h-4 w-4" /> Previous
                                            </Button>
                                        );
                                    }
                                    if (link.label.includes('Next')) {
                                        return (
                                            <Button key={index} variant="outline" disabled className="gap-1">
                                                Next <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        );
                                    }
                                    return null;
                                }

                                if (link.label.includes('Previous')) {
                                    return (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            onClick={() => handlePaginationClick(link.url)}
                                            className="gap-1"
                                        >
                                            <ChevronLeft className="h-4 w-4" /> Previous
                                        </Button>
                                    );
                                }

                                if (link.label.includes('Next')) {
                                    return (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            onClick={() => handlePaginationClick(link.url)}
                                            className="gap-1"
                                        >
                                            Next <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    );
                                }

                                return (
                                    <Button
                                        key={index}
                                        variant={link.active ? 'default' : 'outline'}
                                        onClick={() => handlePaginationClick(link.url)}
                                        className="min-w-[40px]"
                                    >
                                        {link.label}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
