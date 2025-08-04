<?php
// app/Http/Controllers/TimelineEventController.php

namespace App\Http\Controllers;

use App\Models\TimelineEvent;
use App\Models\Media;
use App\Models\Localization;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class TimelineEventController extends Controller
{
    public function index()
    {
        $timelineEvents = TimelineEvent::with(['media'])
            ->ordered()
            ->paginate(12)
            ->withQueryString();

        // Add translated content to each timeline event
        $timelineEvents->getCollection()->transform(function ($item) {
            $item->translated_content = $item->getMultilingualContent();
            $item->media_count = $item->media ? $item->media->count() : 0;
            return $item;
        });

        return Inertia::render('TimelineEvents/Index', [
            'timelineEvents' => $timelineEvents
        ]);
    }

    public function create()
    {
        $mediaItems = Media::select(['id', 'media_id', 'type', 'title_key', 'file_path', 'thumbnail_path'])
            ->active()
            ->ordered()
            ->get()
            ->map(function ($media) {
                $content = $media->getMultilingualContent();
                return [
                    'id' => $media->id,
                    'media_id' => $media->media_id,
                    'type' => $media->type,
                    'title' => $content['title']['en'] ?: 'Untitled Media',
                    'url' => $content['url'],
                    'thumbnail' => $content['thumbnail'] ?? $content['url']
                ];
            });

        return Inertia::render('TimelineEvents/Create', [
            'mediaItems' => $mediaItems
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'period' => 'required|string|max:255',
            'is_highlighted' => 'boolean',
            'sort_order' => 'integer|min:0',
            'media_ids' => 'array',
            'media_ids.*' => 'exists:media,id',
            'title.en' => 'required|string|max:255',
            'title.ar' => 'required|string|max:255',
            'description.en' => 'required|string',
            'description.ar' => 'required|string',
        ]);

        DB::transaction(function () use ($validated) {
            // Generate unique keys
            $titleKey = 'timeline_event_title_' . uniqid();
            $descriptionKey = 'timeline_event_description_' . uniqid();

            // Create timeline event
            $timelineEvent = TimelineEvent::create([
                'timeline_event_id' => TimelineEvent::generateTimelineEventId(),
                'title_key' => $titleKey,
                'period' => $validated['period'],
                'description_key' => $descriptionKey,
                'is_highlighted' => $validated['is_highlighted'] ?? false,
                'sort_order' => $validated['sort_order'] ?? 0,
            ]);

            // Create localizations
            foreach (['en', 'ar'] as $language) {
                // Title localization
                Localization::create([
                    'key' => $titleKey,
                    'language' => $language,
                    'group' => 'timeline_events',
                    'value' => $validated['title'][$language],
                    'is_active' => true,
                ]);

                // Description localization
                Localization::create([
                    'key' => $descriptionKey,
                    'language' => $language,
                    'group' => 'timeline_events',
                    'value' => $validated['description'][$language],
                    'is_active' => true,
                ]);
            }

            // Attach media if provided
            if (!empty($validated['media_ids'])) {
                foreach ($validated['media_ids'] as $index => $mediaId) {
                    $timelineEvent->media()->attach($mediaId, [
                        'sort_order' => $index + 1
                    ]);
                }
            }
        });

        return redirect()->route('timeline-events.index')
            ->with('success', 'Timeline event created successfully.');
    }

    public function show(TimelineEvent $timelineEvent)
    {
        $timelineEvent->load(['media']);
        $timelineEvent->translated_content = $timelineEvent->getMultilingualContent();

        return Inertia::render('TimelineEvents/Show', [
            'timelineEvent' => $timelineEvent
        ]);
    }

    public function edit(TimelineEvent $timelineEvent)
    {
        $timelineEvent->load(['media']);
        
        // Get current translations
        $titleTranslations = $this->getTranslationsForKey($timelineEvent->title_key);
        $descriptionTranslations = $this->getTranslationsForKey($timelineEvent->description_key);

        $timelineEvent->title = $titleTranslations;
        $timelineEvent->description = $descriptionTranslations;

        $mediaItems = Media::select(['id', 'media_id', 'type', 'title_key', 'file_path', 'thumbnail_path'])
            ->active()
            ->ordered()
            ->get()
            ->map(function ($media) {
                $content = $media->getMultilingualContent();
                return [
                    'id' => $media->id,
                    'media_id' => $media->media_id,
                    'type' => $media->type,
                    'title' => $content['title']['en'] ?: 'Untitled Media',
                    'url' => $content['url'],
                    'thumbnail' => $content['thumbnail'] ?? $content['url']
                ];
            });

        return Inertia::render('TimelineEvents/Edit', [
            'timelineEvent' => $timelineEvent,
            'mediaItems' => $mediaItems
        ]);
    }

    public function update(Request $request, TimelineEvent $timelineEvent)
    {
        $validated = $request->validate([
            'period' => 'required|string|max:255',
            'is_highlighted' => 'boolean',
            'sort_order' => 'integer|min:0',
            'media_ids' => 'array',
            'media_ids.*' => 'exists:media,id',
            'title.en' => 'required|string|max:255',
            'title.ar' => 'required|string|max:255',
            'description.en' => 'required|string',
            'description.ar' => 'required|string',
        ]);

        DB::transaction(function () use ($validated, $timelineEvent) {
            // Update timeline event
            $timelineEvent->update([
                'period' => $validated['period'],
                'is_highlighted' => $validated['is_highlighted'] ?? false,
                'sort_order' => $validated['sort_order'] ?? 0,
            ]);

            // Update localizations
            foreach (['en', 'ar'] as $language) {
                // Update title
                Localization::where('key', $timelineEvent->title_key)
                    ->where('language', $language)
                    ->update(['value' => $validated['title'][$language]]);

                // Update description
                Localization::where('key', $timelineEvent->description_key)
                    ->where('language', $language)
                    ->update(['value' => $validated['description'][$language]]);
            }

            // Update media relationships
            $timelineEvent->media()->detach();
            if (!empty($validated['media_ids'])) {
                foreach ($validated['media_ids'] as $index => $mediaId) {
                    $timelineEvent->media()->attach($mediaId, [
                        'sort_order' => $index + 1
                    ]);
                }
            }
        });

        return redirect()->route('timeline-events.index')
            ->with('success', 'Timeline event updated successfully.');
    }

    public function destroy(TimelineEvent $timelineEvent)
    {
        DB::transaction(function () use ($timelineEvent) {
            // Delete localizations
            Localization::whereIn('key', [$timelineEvent->title_key, $timelineEvent->description_key])
                ->delete();

            // Detach media
            $timelineEvent->media()->detach();

            // Delete timeline event
            $timelineEvent->delete();
        });

        return redirect()->route('timeline-events.index')
            ->with('success', 'Timeline event deleted successfully.');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:timeline_events,id'
        ]);

        DB::transaction(function () use ($request) {
            $timelineEvents = TimelineEvent::whereIn('id', $request->ids)->get();
            
            foreach ($timelineEvents as $timelineEvent) {
                // Delete localizations
                Localization::whereIn('key', [$timelineEvent->title_key, $timelineEvent->description_key])
                    ->delete();

                // Detach media
                $timelineEvent->media()->detach();
            }

            // Delete timeline events
            TimelineEvent::whereIn('id', $request->ids)->delete();
        });

        return redirect()->route('timeline-events.index')
            ->with('success', 'Timeline events deleted successfully.');
    }

    public function toggleHighlighted(TimelineEvent $timelineEvent)
    {
        $timelineEvent->update([
            'is_highlighted' => !$timelineEvent->is_highlighted
        ]);

        return back()->with('success', 'Timeline event highlight status updated.');
    }

    private function getTranslationsForKey(?string $key): array
    {
        if (!$key) {
            return ['en' => '', 'ar' => ''];
        }

        $translations = Localization::where('key', $key)
            ->whereIn('language', ['en', 'ar'])
            ->pluck('value', 'language')
            ->toArray();

        return [
            'en' => $translations['en'] ?? '',
            'ar' => $translations['ar'] ?? ''
        ];
    }
}
