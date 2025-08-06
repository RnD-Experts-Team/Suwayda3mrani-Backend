// resources/js/pages/Localizations/Create.tsx

import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type BreadcrumbItem } from '@/types';

interface Props {
    languages?: string[] | null;
    groups?: string[] | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Localizations', href: '/localizations' },
    { title: 'Create', href: '/localizations/create' },
];

export default function CreateLocalization({ languages = null, groups = null }: Props) {
    const { data, setData, processing, errors } = useForm({
        language: '',
        group: '',
        key: '',
        value: '',
        description: '',
        is_active: true,
    });

    // Safe arrays with fallbacks
    const safeLanguages: string[] = Array.isArray(languages) ? languages : [];
    const safeGroups: string[] = Array.isArray(groups) ? groups : [];

    const [customLanguage, setCustomLanguage] = useState('');
    const [useCustomLanguage, setUseCustomLanguage] = useState(false);
    const [customGroup, setCustomGroup] = useState('');
    const [useCustomGroup, setUseCustomGroup] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Prepare the final data
        const finalData = {
            language: useCustomLanguage ? customLanguage.trim() : (data.language === '__none__' ? '' : data.language),
            group: useCustomGroup ? customGroup.trim() : (data.group === '__none__' ? '' : data.group),
            key: data.key.trim(),
            value: data.value.trim(),
            description: data.description.trim(),
            is_active: data.is_active,
        };
        
        // Submit directly with the final data
        router.post('/localizations', finalData, {
            onSuccess: () => {
                console.log('Localization created successfully');
            },
            onError: (errors) => {
                console.error('Validation errors:', errors);
            }
        });
    };

    const handleSwitchChange = (checked: boolean | 'indeterminate') => {
        setData('is_active', checked === true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Localization" />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">Create Localization</h1>
                        <p className="text-sm text-muted-foreground">Add a new translation entry to your localization system</p>
                    </div>
                </div>
                
                <Card className="overflow-hidden max-w-2xl">
                    <CardHeader className="px-6 py-4 border-b">
                        <CardTitle className="text-lg font-semibold">Localization Details</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Language */}
                            <div className="space-y-3">
                                <Label>Language Code</Label>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={useCustomLanguage}
                                            onCheckedChange={setUseCustomLanguage}
                                        />
                                        <Label>Use custom language</Label>
                                    </div>
                                    
                                    {useCustomLanguage ? (
                                        <Input
                                            type="text"
                                            placeholder="e.g., en, ar, fr"
                                            value={customLanguage}
                                            onChange={(e) => setCustomLanguage(e.target.value)}
                                            className={errors.language ? 'border-destructive' : ''}
                                        />
                                    ) : (
                                        <Select 
                                            value={data.language || '__none__'} 
                                            onValueChange={(value) => setData('language', value)}
                                        >
                                            <SelectTrigger className={errors.language ? 'border-destructive' : ''}>
                                                <SelectValue placeholder="Select existing language" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none__">Select a language</SelectItem>
                                                {safeLanguages.map((lang) => (
                                                    <SelectItem key={lang} value={lang}>
                                                        {lang.toUpperCase()}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                                {errors.language && (
                                    <p className="text-sm text-destructive">{errors.language}</p>
                                )}
                            </div>

                            {/* Group */}
                            <div className="space-y-3">
                                <Label>Group</Label>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={useCustomGroup}
                                            onCheckedChange={setUseCustomGroup}
                                        />
                                        <Label>Use custom group</Label>
                                    </div>
                                    
                                    {useCustomGroup ? (
                                        <Input
                                            type="text"
                                            placeholder="Enter custom group name"
                                            value={customGroup}
                                            onChange={(e) => setCustomGroup(e.target.value)}
                                        />
                                    ) : (
                                        <Select 
                                            value={data.group || '__none__'} 
                                            onValueChange={(value) => setData('group', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select existing group (optional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none__">No Group</SelectItem>
                                                {safeGroups.map((group) => (
                                                    <SelectItem key={group} value={group}>
                                                        {group}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                                {errors.group && (
                                    <p className="text-sm text-destructive">{errors.group}</p>
                                )}
                            </div>

                            {/* Key */}
                            <div className="space-y-3">
                                <Label htmlFor="key">Key</Label>
                                <Input
                                    id="key"
                                    type="text"
                                    placeholder="e.g., home, title, seeStories"
                                    value={data.key}
                                    onChange={(e) => setData('key', e.target.value)}
                                    className={errors.key ? 'border-destructive' : ''}
                                />
                                {errors.key && (
                                    <p className="text-sm text-destructive">{errors.key}</p>
                                )}
                            </div>

                            {/* Value */}
                            <div className="space-y-3">
                                <Label htmlFor="value">Value</Label>
                                <Textarea
                                    id="value"
                                    placeholder="Enter the translated text"
                                    value={data.value}
                                    onChange={(e) => setData('value', e.target.value)}
                                    className={errors.value ? 'border-destructive' : ''}
                                    rows={3}
                                />
                                {errors.value && (
                                    <p className="text-sm text-destructive">{errors.value}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-3">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Context or notes for translators"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={2}
                                />
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={data.is_active}
                                    onCheckedChange={handleSwitchChange}
                                />
                                <Label>Active</Label>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing} size="sm" className="gap-2">
                                    {processing ? 'Creating...' : 'Create Localization'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
