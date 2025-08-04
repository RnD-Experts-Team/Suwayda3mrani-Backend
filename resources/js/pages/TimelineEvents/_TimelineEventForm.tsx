import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface MediaItem {
  id: number;
  media_id: string;
  title: string;
  type: 'image' | 'video';
  url: string;
  thumbnail: string;
}

interface Props {
  /** `null` on create, filled on edit */
  timelineEvent?: any;
  /** list supplied by controller */
  mediaItems: MediaItem[];
  /** request route */
  submitUrl: string;
  /** HTTP method – 'post' | 'put' */
  method: 'post' | 'put';
}

export default function TimelineEventForm({
  timelineEvent,
  mediaItems,
  submitUrl,
  method,
}: Props) {
  const {
    data,
    setData,
    post,
    put,
    processing,
    errors,
  } = useForm({
    period: timelineEvent?.period ?? '',
    sort_order: timelineEvent?.sort_order ?? 0,
    is_highlighted: timelineEvent?.is_highlighted ?? false,
    title: timelineEvent?.title ?? { en: '', ar: '' },
    description: timelineEvent?.description ?? { en: '', ar: '' },
    media_ids: timelineEvent?.media?.map((m: any) => m.id) ?? [],
  });

  const submit = () => {
    method === 'post' ? post(submitUrl) : put(submitUrl);
  };

  /** simple helper to toggle media ids */
  const toggleMedia = (id: number) => {
    setData('media_ids', data.media_ids.includes(id)
      ? data.media_ids.filter((x: number) => x !== id)
      : [...data.media_ids, id],
    );
  };

  return (
    <form onSubmit={e => { e.preventDefault(); submit(); }} className="space-y-6">
      {/* BASIC INFO */}
      <Card>
        <CardHeader>
          <CardTitle>Basic information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Period (e.g. 1991 – 1993)"
            value={data.period}
            onChange={e => setData('period', e.target.value)}
            error={errors.period}
          />

          <Input
            type="number"
            label="Sort order"
            value={data.sort_order}
            onChange={e => setData('sort_order', Number(e.target.value))}
            error={errors.sort_order}
          />

          <div className="flex items-center gap-2 col-span-full">
            <Checkbox
              checked={data.is_highlighted}
              onCheckedChange={val => setData('is_highlighted', Boolean(val))}
            />
            <span>Highlight on public timeline</span>
          </div>
        </CardContent>
      </Card>

      {/* TRANSLATIONS */}
      <Card>
        <CardHeader>
          <CardTitle>Translations</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="en">
            <TabsList className="mb-4">
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="ar">العربية</TabsTrigger>
            </TabsList>

            {(['en', 'ar'] as const).map(lang => (
              <TabsContent key={lang} value={lang} className="space-y-4">
                <Input
                  label="Title"
                  value={data.title[lang]}
                  onChange={e => setData('title', { ...data.title, [lang]: e.target.value })}
                  error={errors[`title.${lang}`]}
                />
                <Textarea
                  label="Description"
                  rows={6}
                  value={data.description[lang]}
                  onChange={e => setData('description', { ...data.description, [lang]: e.target.value })}
                  error={errors[`description.${lang}`]}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* MEDIA SELECTION */}
      <Card>
        <CardHeader>
          <CardTitle>Select media (optional)</CardTitle>
        </CardHeader>
        <CardContent>
          {mediaItems.length === 0 && (
            <p className="text-sm text-muted-foreground">No media found.</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mediaItems.map(item => {
              const selected = data.media_ids.includes(item.id);
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => toggleMedia(item.id)}
                  className={`relative rounded border ${selected ? 'border-primary' : 'border-muted'} overflow-hidden`}
                >
                  {item.type === 'video' ? (
                    <video src={item.url} className="w-full h-28 object-cover" muted />
                  ) : (
                    <img src={item.thumbnail} className="w-full h-28 object-cover" />
                  )}
                  {selected && (
                    <Badge variant="default" className="absolute top-2 right-2">✓</Badge>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ACTIONS */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={() => history.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={processing}>
          {method === 'post' ? 'Create' : 'Update'}
        </Button>
      </div>
    </form>
  );
}
