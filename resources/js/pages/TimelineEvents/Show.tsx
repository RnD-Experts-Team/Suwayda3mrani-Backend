import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem } from '@/types';
import { Edit } from 'lucide-react';

interface Props {
  timelineEvent: any;
}

export default function Show({ timelineEvent }: Props) {
  const { translated_content: t } = timelineEvent;

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Timeline Events', href: '/timeline-events' },
    { title: t.title.en, href: `/timeline-events/${timelineEvent.id}` },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={t.title.en} />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t.title.en}</h1>
        <Link href={`/timeline-events/${timelineEvent.id}/edit`}>
          <Button size="sm" className="gap-2">
            <Edit className="w-4 h-4" /> Edit
          </Button>
        </Link>
      </div>

      {/* Period & Highlight */}
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="secondary">{timelineEvent.period}</Badge>
        {timelineEvent.is_highlighted && (
          <Badge variant="default">Highlighted</Badge>
        )}
      </div>

      {/* Media */}
      {t.mediaUrl && (
        <div className="mb-6">
          {t.mediaType === 'video' ? (
            <video
              src={t.mediaUrl}
              className="w-full rounded-md"
              controls
            />
          ) : (
            <img
              src={t.mediaUrl}
              className="w-full rounded-md"
              alt={t.title.en}
            />
          )}
        </div>
      )}

      {/* English / Arabic tabs */}
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold mb-2">English</h2>
          <p className="whitespace-pre-line">{t.description.en}</p>
        </div>
        <div dir="rtl">
          <h2 className="font-semibold mb-2">العربية</h2>
          <p className="whitespace-pre-line">{t.description.ar}</p>
        </div>
      </div>
    </AppLayout>
  );
}
