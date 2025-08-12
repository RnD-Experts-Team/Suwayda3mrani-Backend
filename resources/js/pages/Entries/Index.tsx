// resources/js/pages/Entries/Index.tsx
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Filter, RotateCcw, Eye, MapPin, FileText, Download } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

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

interface Props {
    entries: {
        data: Entry[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        from: number | null;
        to: number | null;
    };
    filters?: {
        entry_number?: string;
        submitter_name?: string;
        location?: string;
        status?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Entries', href: '/entries' },
];

export default function EntriesIndex({ entries, filters = {} }: Props) {
    const applyFilters = (newFilters = {}) => {
        router.get('/entries', { ...filters, ...newFilters }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const resetFilters = () => {
        router.get('/entries');
    };

    const isEmpty = entries.data.length === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Entries" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">Entries</h1>
                        <p className="text-sm text-muted-foreground">
                            {isEmpty ? "No entries found" : `Showing ${entries.from ?? 'N/A'}-${entries.to ?? 'N/A'} of ${entries.total} entries`}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <a href="/entries/export">
                            <Button variant="secondary" className="gap-1">
                                <Download className="h-4 w-4" /> Export
                            </Button>
                        </a>
                        <Link href="/entries/create">
                            <Button className="gap-1">
                                <Plus className="h-4 w-4" /> New Entry
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <Card className="overflow-hidden">
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div className="lg:col-span-1 flex gap-2">
                            <Button variant="outline" onClick={resetFilters} className="gap-1">
                                <RotateCcw className="h-4 w-4" /> Reset
                            </Button>
                        </div>
                        <Input
                            placeholder="Entry Number"
                            defaultValue={filters?.entry_number || ''}
                            onBlur={(e) => applyFilters({ entry_number: e.target.value })}
                            className="w-full"
                        />
                        <Input
                            placeholder="Submitter Name"
                            defaultValue={filters?.submitter_name || ''}
                            onBlur={(e) => applyFilters({ submitter_name: e.target.value })}
                            className="w-full"
                        />
                        <Select
                            value={filters?.location || 'all'}
                            onValueChange={(val) => applyFilters({ location: val === 'all' ? '' : val })}
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
                            value={filters?.status || 'all'}
                            onValueChange={(val) => applyFilters({ status: val === 'all' ? '' : val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="أسماء ضحايا">أسماء ضحايا</SelectItem>
                                <SelectItem value="منازل محترقة">منازل محترقة</SelectItem>
                                <SelectItem value="منازل مسروقة">منازل مسروقة</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {/* Content */}
                {isEmpty ? (
                    <Card className="text-center">
                        <CardContent className="py-16">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                <FileText className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="mt-3 text-lg font-medium">No entries found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Create a new entry or adjust your filters to see results
                            </p>
                            <div className="mt-4 flex justify-center gap-3">
                                <Button variant="outline" onClick={resetFilters}>
                                    <RotateCcw className="mr-2 h-4 w-4" /> Reset filters
                                </Button>
                                <Link href="/entries/create">
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" /> New Entry
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {entries.data.map((entry) => (
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
                                                        <Badge key={index} variant="outline" className="text-xs">{status}</Badge>
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
                                        <Link href={`/entries/${entry.id}`} className="w-full">
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
                {entries.last_page > 1 && (
                    <div className="flex justify-center pt-2">
                        <div className="flex gap-2">
                            {entries.current_page > 1 && (
                                <Button
                                    variant="outline"
                                    onClick={() => router.get(entries.links[0].url)}
                                >
                                    Previous
                                </Button>
                            )}

                            {Array.from({ length: entries.last_page }, (_, i) => i + 1).map(page => (
                                <Button
                                    key={page}
                                    variant={page === entries.current_page ? 'default' : 'outline'}
                                    onClick={() => router.get(`/entries?page=${page}`)}
                                >
                                    {page}
                                </Button>
                            ))}

                            {entries.current_page < entries.last_page && (
                                <Button
                                    variant="outline"
                                    onClick={() => router.get(entries.links[entries.links.length - 1].url)}
                                >
                                    Next
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
