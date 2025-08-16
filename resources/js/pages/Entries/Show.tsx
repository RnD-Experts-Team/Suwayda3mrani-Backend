import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ExternalLink, CheckCircle, Clock, ArrowLeft, Edit, Trash2, Calendar, Copy } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import { Separator } from '@/components/ui/separator';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface Need {
    id: number;
    name: string;
    name_ar: string;
    pivot?: {
        is_fulfilled: boolean;
        status?: string;
        notes: string | null;
    };
}

interface DisplacedFamily {
    id: number;
    individuals_count: string | null;
    contact: string | null;
    wife_name: string | null;
    children_info: string | null;
    family_book_number: string | null;
    children_under_8_months: string | null;
    birth_details: string | null;
    assistance_type: string | null;
    provider: string | null;
    date_received: string | null;
    notes: string | null;
    return_possible: string | null;
    previous_assistance: string | null;
    images: string | null;
    needs: Need[];
}

interface Shelter {
    id: number;
    place: string | null;
    contact: string | null;
    images: string | null;
    displacedFamilies: DisplacedFamily[];
}

interface Host {
    id: number;
    full_name: string | null;
    family_count: string | null;
    location: string | null;
    address: string | null;
    phone: string | null;
    family_book_number: string | null;
    children_under_8_months: string | null;
    birth_details: string | null;
}

interface Martyr {
    id: number;
    name: string | null;
    age: string | null;
    place: string | null;
    relative_contact: string | null;
    image: string | null;
}

interface Entry {
    id: number;
    form_id: string | null;
    entry_number: string | null;
    date_submitted: string | null;
    submitter_name: string | null;
    location: string | null;
    status: string | null;
    InternalLink: string | null;
    notes: string | null;
    host: Host | null;
    displacedFamilies: DisplacedFamily[];
    martyrs: Martyr[];
    shelters: Shelter[];
    hosted_families_count: number;
    martyrs_count: number;
    shelters_count: number;
}

interface Props {
    entry: Entry;
    allNeeds: Need[];
    stats: {
        total_displaced_families: number;
        total_needs: number;
        fulfilled_needs: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Form Entries', href: '/form-entries' },
    { title: 'View', href: '' },
];

function renderField(label: string, value: any) {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <span className="text-sm">{value}</span>
        </div>
    );
}

function renderNotesField(label: string, value: string | null) {
    if (!value || value.trim() === '') return null;
    return (
        <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <p className="text-sm whitespace-pre-wrap break-words p-3 bg-muted rounded-lg">
                {value}
            </p>
        </div>
    );
}

function renderImageLinks(images: string | null) {
    if (!images || images === '') return null;

    try {
        const urls = JSON.parse(images);
        if (!Array.isArray(urls) || urls.length === 0) return null;

        return (
            <div className="flex flex-wrap gap-2">
                {urls.map((url, idx) => (
                    <a
                        key={idx}
                        href={url.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 flex gap-1 items-center hover:underline"
                    >
                        Image {idx + 1} <ExternalLink className="w-4 h-4" />
                    </a>
                ))}
            </div>
        );
    } catch (error) {
        const urls = images.split(',').filter(url => url.trim() !== '');
        if (urls.length === 0) return null;

        return (
            <div className="flex flex-wrap gap-2">
                {urls.map((url, idx) => (
                    <a
                        key={idx}
                        href={url.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 flex gap-1 items-center hover:underline"
                    >
                        Image {idx + 1} <ExternalLink className="w-4 h-4" />
                    </a>
                ))}
            </div>
        );
    }
}

function renderStatus(status: string | null) {
    if (!status || status === '') return null;
    const statuses = status.split(',').filter(s => s.trim() !== '');
    if (statuses.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1">
            {statuses.map((status, index) => (
                <Badge key={index} variant="outline">{status}</Badge>
            ))}
        </div>
    );
}

function renderBooleanField(value: string | null): string {
    if (value === 'نعم') return 'Yes';
    if (value === 'لا') return 'No';
    return value || 'N/A';
}

function NeedItem({ need, familyId, entryId }: {
    need: Need,
    familyId: number,
    entryId: number
}) {
    const initialStatus = need.pivot?.status || 'pending';
    const [status, setStatus] = useState(initialStatus);
    const [isChecked, setIsChecked] = useState(initialStatus === 'given');
    const [isUpdating, setIsUpdating] = useState(false);

    const updateNeedStatus = async (newStatus: string) => {
        setIsUpdating(true);
        try {
            router.patch(`/form-entries/${entryId}/families/${familyId}/needs/${need.id}/status`, {
                status: newStatus
            }, {
                preserveScroll: true,
                preserveState: false,
                onSuccess: () => {
                    setStatus(newStatus);
                    setIsChecked(newStatus === 'given');
                },
                onError: (errors) => {
                    console.error('Failed to update need status:', errors);
                    setStatus(initialStatus);
                    setIsChecked(initialStatus === 'given');
                }
            });
        } catch (error) {
            console.error('Error updating need status:', error);
            setStatus(initialStatus);
            setIsChecked(initialStatus === 'given');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCheckboxChange = (checked: boolean) => {
        const newStatus = checked ? 'given' : 'pending';
        setIsChecked(checked);
        updateNeedStatus(newStatus);
    };

    const handleSelectChange = (newStatus: string) => {
        updateNeedStatus(newStatus);
    };

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'given': return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Given</Badge>;
            default: return <Badge variant="secondary">Pending</Badge>;
        }
    };

    return (
        <div className="flex items-center justify-between py-2 px-3 hover:bg-muted rounded-lg transition-colors">
            <div className="flex items-center gap-3 flex-1">
                <Checkbox
                    id={`need-${need.id}-${familyId}`}
                    checked={isChecked}
                    onCheckedChange={handleCheckboxChange}
                    disabled={isUpdating}
                    className="flex-shrink-0"
                />
                <div className="flex-1">
                    <Label
                        htmlFor={`need-${need.id}-${familyId}`}
                        className="text-sm font-medium cursor-pointer select-none"
                    >
                        {need.name_ar}
                    </Label>
                    {need.pivot?.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{need.pivot.notes}</p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
                <Select
                    value={status}
                    onValueChange={handleSelectChange}
                    disabled={isUpdating}
                >
                    <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="given">Given</SelectItem>
                    </SelectContent>
                </Select>

                {getStatusBadge(status)}

                {isUpdating && (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
            </div>
        </div>
    );
}

function renderNeeds(needs: Need[], familyId: number, entryId: number) {
    if (!needs || needs.length === 0) return <span className="text-muted-foreground italic">No needs</span>;

    const fulfilledCount = needs.filter(n => n.pivot?.status === 'given' || n.pivot?.is_fulfilled).length;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-3 p-2 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">
                    <strong>{fulfilledCount}</strong> of <strong>{needs.length}</strong> needs fulfilled
                </span>
                <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${needs.length > 0 ? (fulfilledCount / needs.length) * 100 : 0}%` }}
                        ></div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {needs.length > 0 ? Math.round((fulfilledCount / needs.length) * 100) : 0}%
                    </span>
                </div>
            </div>

            <div className="space-y-1">
                {needs.map((need) => (
                    <NeedItem
                        key={need.id}
                        need={need}
                        familyId={familyId}
                        entryId={entryId}
                    />
                ))}
            </div>
        </div>
    );
}

function GlobalNeedsOverview({ allNeeds, entryId }: { allNeeds: Need[], entryId: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {allNeeds.map(need => {
                const isGiven = need.pivot?.status === 'given' || need.pivot?.is_fulfilled;

                return (
                    <div
                        key={need.id}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                            isGiven
                                ? 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100'
                                : 'bg-muted border-border text-foreground hover:bg-muted/50'
                        }`}
                        title={`This need is ${isGiven ? 'fulfilled' : 'pending'} across families`}
                    >
                        <div className={`w-3 h-3 rounded-full ${
                            isGiven ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                        <span className="text-sm font-medium flex-1">{need.name_ar}</span>
                        {isGiven && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function Show({ entry, allNeeds, stats }: Props) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleDelete = () => {
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        router.delete(`/form-entries/${entry.id}`);
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Entry ${entry.entry_number || 'N/A'}`} />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 overflow-x-auto">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Link href="/form-entries">
                                <Button variant="outline" size="sm" className="gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Entries
                                </Button>
                            </Link>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-lg">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Entry #{entry.entry_number || 'N/A'}
                                </h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="gap-1">
                                        {stats.total_displaced_families} families
                                    </Badge>
                                    <Badge variant="outline">
                                        {stats.total_needs} total needs
                                    </Badge>
                                    <Badge variant="outline" className="bg-green-500 hover:bg-green-600">
                                        {stats.fulfilled_needs} fulfilled
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>


                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Entry Details */}
                        <Card>
                            <CardHeader className="border-b">
                                <CardTitle className="text-lg font-semibold">Entry Details</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        {renderField('Form ID', entry.form_id)}
                                        {renderField('Entry Number', entry.entry_number)}
                                        {renderField('Submitter Name', entry.submitter_name)}
                                        {renderField('Location', entry.location)}
                                        {entry.status && (
                                            <div className="flex justify-between items-center py-2">
                                                <span className="text-sm font-medium text-muted-foreground">Status</span>
                                                <div>{renderStatus(entry.status)}</div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        {entry.InternalLink && (
                                            <div className="flex justify-between items-center py-2">
                                                <span className="text-sm font-medium text-muted-foreground">Internal Link</span>
                                                <a href={entry.InternalLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 flex gap-1 items-center hover:underline">
                                                    View Form <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        )}
                                        {renderField('Date Submitted', entry.date_submitted ? new Date(entry.date_submitted).toLocaleString() : null)}
                                        {renderField('Hosted Families Count', entry.hosted_families_count)}
                                        {renderField('Martyrs Count', entry.martyrs_count)}
                                        {renderField('Shelters Count', entry.shelters_count)}
                                    </div>
                                </div>
                                {/* Notes */}
                                {entry.notes && renderNotesField('Entry Notes', entry.notes)}
                            </CardContent>
                        </Card>

                        {/* Host Details */}
                        {entry.host && entry.host.full_name && (
                            <Card>
                                <CardHeader className="border-b">
                                    <CardTitle className="text-lg font-semibold">Host Information</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            {renderField('Full Name', entry.host.full_name)}
                                            {renderField('Family Count', entry.host.family_count)}
                                            {renderField('Location', entry.host.location)}
                                            {renderField('Address', entry.host.address)}
                                            {renderField('Phone', entry.host.phone)}
                                        </div>
                                        <div className="space-y-4">
                                            {renderField('Family Book Number', entry.host.family_book_number)}
                                            {renderField('Children Under 8 Months', renderBooleanField(entry.host.children_under_8_months))}
                                            {entry.host.children_under_8_months === 'نعم' && renderField('Birth Details', entry.host.birth_details)}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Displaced Families */}
                        {entry.displacedFamilies && entry.displacedFamilies.length > 0 && (
                            <Card>
                                <CardHeader className="border-b">
                                    <CardTitle className="text-lg font-semibold">Displaced Families ({entry.displacedFamilies.length})</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    {entry.displacedFamilies.map((family, index) => (
                                        <Card key={family.id} className="border">
                                            <CardHeader className="bg-muted">
                                                <CardTitle className="text-md">Family {index + 1}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-4">
                                                        {renderField('Individuals Count', family.individuals_count)}
                                                        {renderField('Contact', family.contact)}
                                                        {renderField('Wife Name', family.wife_name)}
                                                        {renderField('Children Info', family.children_info)}
                                                        {renderField('Family Book Number', family.family_book_number)}
                                                        {renderField('Assistance Type', family.assistance_type)}
                                                        {renderField('Provider', family.provider)}
                                                        {renderField('Date Received', family.date_received)}
                                                    </div>
                                                    <div className="space-y-4">
                                                        {renderField('Return Possible', renderBooleanField(family.return_possible))}
                                                        {renderField('Previous Assistance', renderBooleanField(family.previous_assistance))}
                                                        {renderField('Children Under 8 Months', renderBooleanField(family.children_under_8_months))}
                                                        {family.children_under_8_months === 'نعم' && renderField('Birth Details', family.birth_details)}
                                                        {family.images && (
                                                            <div className="flex justify-between items-start py-2">
                                                                <span className="text-sm font-medium text-muted-foreground">Images</span>
                                                                <div>{renderImageLinks(family.images)}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Family notes */}
                                                {family.notes && (
                                                    <div className="mt-4">
                                                        {renderNotesField('Family Notes', family.notes)}
                                                    </div>
                                                )}
                                                <div className="mt-6">
                                                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Current Needs</h4>
                                                    {renderNeeds(family.needs, family.id, entry.id)}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Martyrs */}
                        {entry.martyrs && entry.martyrs.filter(m => m.name).length > 0 && (
                            <Card>
                                <CardHeader className="border-b">
                                    <CardTitle className="text-lg font-semibold">Martyrs ({entry.martyrs.filter(m => m.name).length})</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    {entry.martyrs.filter(m => m.name).map((martyr, index) => (
                                        <Card key={martyr.id} className="border">
                                            <CardHeader className="bg-muted">
                                                <CardTitle className="text-md">Martyr {index + 1}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-4">
                                                        {renderField('Name', martyr.name)}
                                                        {renderField('Age', martyr.age)}
                                                        {renderField('Place of Martyrdom', martyr.place)}
                                                    </div>
                                                    <div className="space-y-4">
                                                        {renderField('Relative Contact', martyr.relative_contact)}
                                                        {martyr.image && (
                                                            <div className="flex justify-between items-start py-2">
                                                                <span className="text-sm font-medium text-muted-foreground">Images</span>
                                                                <div>{renderImageLinks(martyr.image)}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Shelters and their Families */}
                        {entry.shelters && entry.shelters.filter(s => s.place || s.contact || (s.displacedFamilies && s.displacedFamilies.length > 0)).length > 0 && (
                            <Card>
                                <CardHeader className="border-b">
                                    <CardTitle className="text-lg font-semibold">Shelters ({entry.shelters.filter(s => s.place || s.contact || (s.displacedFamilies && s.displacedFamilies.length > 0)).length})</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    {entry.shelters.filter(s => s.place || s.contact || (s.displacedFamilies && s.displacedFamilies.length > 0)).map((shelter, index) => (
                                        <Card key={shelter.id} className="border">
                                            <CardHeader className="bg-muted">
                                                <CardTitle className="text-md">Shelter {index + 1}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                                    <div className="space-y-4">
                                                        {renderField('Place', shelter.place)}
                                                        {renderField('Contact', shelter.contact)}
                                                    </div>
                                                    <div className="space-y-4">
                                                        {shelter.images && (
                                                            <div className="flex justify-between items-start py-2">
                                                                <span className="text-sm font-medium text-muted-foreground">Images</span>
                                                                <div>{renderImageLinks(shelter.images)}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Families in Shelter */}
                                                {shelter.displacedFamilies && shelter.displacedFamilies.length > 0 && (
                                                    <div className="border-t pt-6">
                                                        <h4 className="text-sm font-medium text-muted-foreground mb-4">Families in Shelter ({shelter.displacedFamilies.length})</h4>
                                                        {shelter.displacedFamilies.map((family, familyIndex) => (
                                                            <Card key={family.id} className="mt-4 mb-4 bg-muted border">
                                                                <CardHeader>
                                                                    <CardTitle className="text-md">Family {familyIndex + 1}</CardTitle>
                                                                </CardHeader>
                                                                <CardContent className="p-6">
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                        <div className="space-y-4">
                                                                            {renderField('Individuals Count', family.individuals_count)}
                                                                            {renderField('Contact', family.contact)}
                                                                            {renderField('Wife Name', family.wife_name)}
                                                                            {renderField('Children Info', family.children_info)}
                                                                            {renderField('Family Book Number', family.family_book_number)}
                                                                            {renderField('Assistance Type', family.assistance_type)}
                                                                            {renderField('Provider', family.provider)}
                                                                            {renderField('Date Received', family.date_received)}
                                                                        </div>
                                                                        <div className="space-y-4">
                                                                            {renderField('Return Possible', renderBooleanField(family.return_possible))}
                                                                            {renderField('Previous Assistance', renderBooleanField(family.previous_assistance))}
                                                                            {renderField('Children Under 8 Months', renderBooleanField(family.children_under_8_months))}
                                                                            {family.children_under_8_months === 'نعم' && renderField('Birth Details', family.birth_details)}
                                                                            {family.images && (
                                                                                <div className="flex justify-between items-start py-2">
                                                                                    <span className="text-sm font-medium text-muted-foreground">Images</span>
                                                                                    <div>{renderImageLinks(family.images)}</div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {/* Family notes */}
                                                                    {family.notes && (
                                                                        <div className="mt-4">
                                                                            {renderNotesField('Family Notes', family.notes)}
                                                                        </div>
                                                                    )}
                                                                    <div className="mt-6">
                                                                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Current Needs</h4>
                                                                        {renderNeeds(family.needs, family.id, entry.id)}
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Entry Summary */}
                        <Card>
                            <CardHeader className="border-b">
                                <CardTitle className="text-lg font-semibold">Entry Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-muted-foreground">Form ID</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">{entry.form_id || 'N/A'}</span>
                                            {entry.form_id && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(entry.form_id || '', 'form_id')}
                                                    className="h-6 w-6 p-0"
                                                >
                                                    {copiedField === 'form_id' ? (
                                                        <CheckCircle className="w-3 h-3 text-green-600" />
                                                    ) : (
                                                        <Copy className="w-3 h-3" />
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-muted-foreground">Entry Number</span>
                                        <span className="text-sm">{entry.entry_number || 'N/A'}</span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-muted-foreground">Submitter</span>
                                        <span className="text-sm">{entry.submitter_name || 'N/A'}</span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-muted-foreground">Location</span>
                                        <span className="text-sm">{entry.location || 'N/A'}</span>
                                    </div>

                                    <Separator />

                                </div>
                            </CardContent>
                        </Card>

                        {/* Entry Needs Summary */}
                        {allNeeds && allNeeds.length > 0 && (
                            <Card>
                                <CardHeader className="border-b">
                                    <CardTitle className="text-lg font-semibold">All Needs ({allNeeds.length})</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {allNeeds.map(need => {
                                            const [isUpdating, setIsUpdating] = useState(false);
                                            const [currentStatus, setCurrentStatus] = useState(need.pivot?.status || 'pending');
                                            const isGiven = currentStatus === 'given' || need.pivot?.is_fulfilled;

                                            const handleNeedClick = async () => {
                                                setIsUpdating(true);
                                                const newStatus = currentStatus === 'given' ? 'pending' : 'given';

                                                try {
                                                    router.patch(
                                                        route('entries.update-need-status', {
                                                            entry: entry.id,
                                                            family: 0,
                                                            need: need.id
                                                        }),
                                                        {
                                                            status: newStatus
                                                        },
                                                        {
                                                            preserveScroll: true,
                                                            preserveState: false,
                                                            onSuccess: () => {
                                                                setCurrentStatus(newStatus);
                                                            },
                                                            onFinish: () => {
                                                                setIsUpdating(false);
                                                            }
                                                        }
                                                    );
                                                } catch (error) {
                                                    console.error('Error:', error);
                                                    setIsUpdating(false);
                                                }
                                            };

                                            return (
                                                <button
                                                    key={need.id}
                                                    onClick={handleNeedClick}
                                                    disabled={isUpdating}
                                                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all text-left ${
                                                        isGiven
                                                            ? 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100'
                                                            : 'bg-muted border-border text-foreground hover:bg-muted/50'
                                                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <div className={`w-3 h-3 rounded-full ${
                                                        isGiven ? 'bg-green-500' : 'bg-gray-400'
                                                    }`}></div>
                                                    <span className="text-sm font-medium flex-1">{need.name_ar}</span>
                                                    <div className="flex items-center gap-1">
                                                        {isGiven && (
                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                        )}
                                                        {isUpdating && (
                                                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this entry and all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete Entry
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
