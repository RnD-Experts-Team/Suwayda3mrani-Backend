<?php
// app/Http/Controllers/StoriesController.php

namespace App\Http\Controllers;

use App\Models\Story;
use App\Models\Media;
use App\Models\Localization;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class StoriesController extends Controller
{
    public function index(Request $request)
    {
        $query = Story::with(['media']);

        // Filter by featured
        if ($request->filled('featured')) {
            if ($request->featured === 'true') {
                $query->featured();
            }
        }

        // Search functionality
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('story_id', 'like', '%' . $request->search . '%')
                  ->orWhere('url_slug', 'like', '%' . $request->search . '%');
            });
        }

        $stories = $query->active()->ordered()->paginate(12)->withQueryString();

        // Add translated content to each story
        $stories->getCollection()->transform(function ($item) {
            $item->translated_content = $item->getMultilingualContent();
            $item->media_count = $item->media->count();
            return $item;
        });

        return Inertia::render('Stories/Index', [
            'stories' => $stories,
            'filters' => $request->only(['featured', 'search']),
        ]);
    }

    public function create()
    {
        // Get available media items
        $mediaItems = Media::active()->ordered()->get()->map(function ($media) {
            $content = $media->getMultilingualContent();
            return [
                'id' => $media->id,
                'media_id' => $media->media_id,
                'type' => $media->type,
                'source_type' => $media->source_type,
                'title' => $content['title'] ?? ['en' => '', 'ar' => ''],
                'url' => $content['url'],
                'thumbnail' => $content['thumbnail'] ?? $content['url'],
            ];
        });

        return Inertia::render('Stories/Create', [
            'mediaItems' => $mediaItems,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title_en' => 'required|string|max:255',
            'title_ar' => 'required|string|max:255',
            'description_en' => 'required|string',
            'description_ar' => 'required|string',
            'background_image' => 'nullable|image|max:2048',
            'external_url' => 'nullable|url',
            'is_featured' => 'boolean',
            'media_ids' => 'nullable|array',
            'media_ids.*' => 'exists:media,id',
        ]);

        // Generate unique keys for localizations
        $storyId = 'story-' . date('Y') . '-' . time();
        $titleKey = 'story_title_' . time() . '_' . Str::random(6);
        $descriptionKey = 'story_desc_' . time() . '_' . Str::random(6);
        $urlSlug = Str::slug($storyId);

        // Handle background image upload
        $backgroundImagePath = null;
        if ($request->hasFile('background_image')) {
            $backgroundImagePath = $request->file('background_image')
                ->store('stories/backgrounds', 'public');
        }

        // Create the story record
        $story = Story::create([
            'story_id' => $storyId,
            'title_key' => $titleKey,
            'description_key' => $descriptionKey,
            'background_image_path' => $backgroundImagePath,
            'url_slug' => $urlSlug,
            'external_url' => $request->external_url,
            'is_active' => true,
            'is_featured' => $request->boolean('is_featured'),
            'sort_order' => Story::max('sort_order') + 1,
        ]);

        // Create localizations
        foreach (['en', 'ar'] as $lang) {
            Localization::create([
                'key' => $titleKey,
                'language' => $lang,
                'value' => $request->input("title_{$lang}"),
                'group' => 'stories',
                'is_active' => true,
            ]);

            Localization::create([
                'key' => $descriptionKey,
                'language' => $lang,
                'value' => $request->input("description_{$lang}"),
                'group' => 'stories',
                'is_active' => true,
            ]);
        }

        // Attach media if provided
        if ($request->media_ids) {
            $story->attachMedia($request->media_ids);
        }

        return redirect()->route('stories.index')
            ->with('success', 'Story created successfully.');
    }

    public function show(Story $story)
    {
        $story->load(['media']);
        $story->translated_content = $story->getMultilingualContent();
        
        // Get attached media with full content
        $attachedMedia = $story->media->map(function ($media) {
            return array_merge($media->toArray(), [
                'translated_content' => $media->getMultilingualContent()
            ]);
        });

        return Inertia::render('Stories/Show', [
            'story' => $story,
            'attachedMedia' => $attachedMedia,
        ]);
    }

    public function edit(Story $story)
    {
        // Get current translations
        $translations = [];
        foreach (['en', 'ar'] as $lang) {
            $translations["title_{$lang}"] = Localization::where('key', $story->title_key)
                ->where('language', $lang)
                ->value('value') ?? '';
            
            $translations["description_{$lang}"] = Localization::where('key', $story->description_key)
                ->where('language', $lang)
                ->value('value') ?? '';
        }

        // Get available media items
        $mediaItems = Media::active()->ordered()->get()->map(function ($media) {
            $content = $media->getMultilingualContent();
            return [
                'id' => $media->id,
                'media_id' => $media->media_id,
                'type' => $media->type,
                'source_type' => $media->source_type,
                'title' => $content['title'] ?? ['en' => '', 'ar' => ''],
                'url' => $content['url'],
                'thumbnail' => $content['thumbnail'] ?? $content['url'],
            ];
        });

        // Get currently attached media IDs
        $attachedMediaIds = $story->media->pluck('id')->toArray();

        return Inertia::render('Stories/Edit', [
            'story' => $story,
            'translations' => $translations,
            'mediaItems' => $mediaItems,
            'attachedMediaIds' => $attachedMediaIds,
        ]);
    }

    public function update(Request $request, Story $story)
    {
        $request->validate([
            'title_en' => 'required|string|max:255',
            'title_ar' => 'required|string|max:255',
            'description_en' => 'required|string',
            'description_ar' => 'required|string',
            'background_image' => 'nullable|image|max:2048',
            'external_url' => 'nullable|url',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'media_ids' => 'nullable|array',
            'media_ids.*' => 'exists:media,id',
        ]);

        // Handle background image upload
        if ($request->hasFile('background_image')) {
            // Delete old image
            if ($story->background_image_path) {
                Storage::disk('public')->delete($story->background_image_path);
            }
            
            $backgroundImagePath = $request->file('background_image')
                ->store('stories/backgrounds', 'public');
            $story->background_image_path = $backgroundImagePath;
        }

        // Update story record
        $story->update([
            'external_url' => $request->external_url,
            'is_active' => $request->boolean('is_active', true),
            'is_featured' => $request->boolean('is_featured'),
        ]);

        // Update localizations
        foreach (['en', 'ar'] as $lang) {
            Localization::updateOrCreate([
                'key' => $story->title_key,
                'language' => $lang,
            ], [
                'value' => $request->input("title_{$lang}"),
                'group' => 'stories',
                'is_active' => true,
            ]);

            Localization::updateOrCreate([
                'key' => $story->description_key,
                'language' => $lang,
            ], [
                'value' => $request->input("description_{$lang}"),
                'group' => 'stories',
                'is_active' => true,
            ]);
        }

        // Update media attachments
        $story->media()->detach();
        if ($request->media_ids) {
            $story->attachMedia($request->media_ids);
        }

        return redirect()->route('stories.index')
            ->with('success', 'Story updated successfully.');
    }

    public function destroy(Story $story)
    {
        // Delete background image
        if ($story->background_image_path) {
            Storage::disk('public')->delete($story->background_image_path);
        }

        // Delete related localizations
        Localization::where('key', $story->title_key)->delete();
        Localization::where('key', $story->description_key)->delete();

        // Detach media
        $story->media()->detach();

        // Delete story record
        $story->delete();

        return redirect()->route('stories.index')
            ->with('success', 'Story deleted successfully.');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:stories,id'
        ]);

        $stories = Story::whereIn('id', $request->ids)->get();

        foreach ($stories as $story) {
            // Delete background image
            if ($story->background_image_path) {
                Storage::disk('public')->delete($story->background_image_path);
            }

            // Delete localizations
            Localization::where('key', $story->title_key)->delete();
            Localization::where('key', $story->description_key)->delete();

            // Detach media
            $story->media()->detach();
        }

        Story::whereIn('id', $request->ids)->delete();

        return redirect()->route('stories.index')
            ->with('success', count($request->ids) . ' stories deleted successfully.');
    }

    public function toggleFeatured(Story $story)
    {
        $story->update(['is_featured' => !$story->is_featured]);
        return back()->with('success', 'Story featured status updated successfully.');
    }
}
