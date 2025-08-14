<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Entry;
use App\Models\Host;
use App\Models\Martyr;
use App\Models\Shelter;
use App\Models\DisplacedFamily;
use App\Models\Need;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class WebhookController extends Controller
{
    /**
     * Convert potential arrays to strings for database storage.
     */
    private function convertToString($value)
    {
        if (is_array($value)) {
            return implode(',', array_filter($value, 'is_scalar'));
        }
        return is_scalar($value) && !empty($value) ? (string) $value : null;
    }

    /**
     * Extract image URLs from nested structures.
     */
    private function extractImages($imagesData)
    {
        if (!is_array($imagesData)) {
            return null;
        }

        $urls = [];
        foreach ($imagesData as $item) {
            if (isset($item['تحميل']) && is_array($item['تحميل'])) {
                foreach ($item['تحميل'] as $file) {
                    if (isset($file['File']) && !empty($file['File'])) {
                        $urls[] = $file['File'];
                    }
                }
            }
        }
        return !empty($urls) ? json_encode($urls) : null;
    }

    /**
     * Process needs data and return array of need IDs
     */
    private function processNeeds($needsData)
    {
        if (empty($needsData) || !is_array($needsData)) {
            return [];
        }

        // Map Arabic needs to database IDs
        $needsMapping = [
            'مأوى إضافي' => 1,
            'طعام' => 2,
            'مياه نظيفة' => 3,
            'أدوية / خدمات صحية' => 4,
            'ملابس' => 5,
            'فرش / بطانيات' => 6,
            'دعم نفسي' => 7,
            'دعم مالي' => 8,
        ];

        $needIds = [];
        foreach ($needsData as $need) {
            $need = trim($need);

            if (isset($needsMapping[$need])) {
                $needIds[] = $needsMapping[$need];
            } else {
                // Handle "Others" or any custom text - create new need record
                $customNeed = Need::firstOrCreate(
                    ['name_ar' => $need],
                    [
                        'name' => 'other_' . time() . '_' . rand(1000, 9999), // Generate unique English name
                        'name_ar' => $need,
                    ]
                );
                $needIds[] = $customNeed->id;

                Log::info('Created/found custom need', [
                    'need_text' => $need,
                    'need_id' => $customNeed->id,
                    'was_created' => $customNeed->wasRecentlyCreated
                ]);
            }
        }

        return array_unique($needIds);
    }

    /**
     * Create displaced family record with common fields
     */
    private function createDisplacedFamily(array $data, ?int $entryId = null, ?int $shelterId = null)
    {
        if (is_null($entryId) && is_null($shelterId)) {
            Log::error('DisplacedFamily created without entry_id or shelter_id', [
                'entryId' => $entryId,
                'shelterId' => $shelterId
            ]);
        }

        $needsDetails = $data['الاحتياجاتالحالية'] ?? $data['الاحتياجاتالحاليةللعائلاتالمستضافة'] ?? [];
        $needsData = $needsDetails['يرجىاختيارالاحتياجات'] ?? [];
        $needIds = $this->processNeeds($needsData);

        $displacedFamily = DisplacedFamily::create([
            'entry_id' => $entryId,
            'shelter_id' => $shelterId,
            'individuals_count' => $this->convertToString($data['عددالأفراد'] ?? null),
            'contact' => $this->convertToString($data['اسمربالعائلةرقمالتواصل'] ?? null),
            'wife_name' => $this->convertToString($data['اسمالزوجة'] ?? null),
            'children_info' => $this->convertToString($data['أسماءوأعمارالأطفال'] ?? null),
            'family_book_number' => $this->convertToString($data['رقمدفترالعائلةإنوجد'] ?? null),
            'children_under_8_months' => $this->convertToString($data['هليوجداطفالتحتعمرال8اشهر'] ?? null),
            'birth_details' => $this->convertToString($data['اذاكانالجوابنعميرجىذكرتاريخالولادةمعاسمالام'] ?? null),
            'assistance_type' => $this->convertToString($needsDetails['نوعالمساعدة'] ?? null),
            'provider' => $this->convertToString($needsDetails['الجهةالمقدمةللمساعدة'] ?? null),
            'date_received' => $this->convertToString($needsDetails['تاريخالحصولعليها'] ?? null),
            'notes' => $this->convertToString($needsDetails['ملاحظاتإضافية'] ?? null),
            'return_possible' => $this->convertToString($needsDetails['إمكانيةالعودةللمنزل2'] ?? null),
            'previous_assistance' => $this->convertToString($needsDetails['هلتمتلقيمساعداتسابقة2'] ?? null),
            'images' => $this->extractImages($needsDetails['صوراوفيديوهاتللتوثيق2'] ?? []),
        ]);

        if (!empty($needIds)) {
            $pivotData = [];
            foreach ($needIds as $needId) {
                $pivotData[$needId] = [
                    'is_fulfilled' => false,
                    'notes' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            $displacedFamily->needs()->attach($pivotData);
        }

        return $displacedFamily;
    }

    /**
     * Main webhook handler
     */
    public function handle(Request $request)
    {
        $data = $request->all();

        // Validate required fields
        if (!isset($data['Form']['Id'], $data['Entry']['Number'], $data['All'], $data['Entry']['InternalLink']) ||
            empty($data['Form']['Id']) || empty($data['Entry']['Number']) || empty($data['Entry']['InternalLink'])) {
            Log::error('Invalid webhook data - missing required fields', [
                'form_id' => $data['Form']['Id'] ?? null,
                'entry_number' => $data['Entry']['Number'] ?? null,
            ]);
            return response()->json(['error' => 'Invalid data - missing required fields'], 400);
        }

        // Prevent duplicates
        if (Entry::where('entry_number', $data['Entry']['Number'])->exists()) {
            return response()->json(['error' => 'Duplicate entry number'], 409);
        }

        try {
            DB::beginTransaction();

            // Create Entry
            $entry = Entry::create([
                'form_id' => $this->convertToString($data['Form']['Id']),
                'entry_number' => $this->convertToString($data['Entry']['Number']),
                'date_submitted' => $this->convertToString($data['Entry']['DateSubmitted'] ?? now()->toDateTimeString()),
                'submitter_name' => $this->convertToString($data['All']['اسمك']['FirstAndLast'] ?? null),
                'location' => $this->convertToString($data['All']['مكانالتواجد'] ?? null),
                'status' => $this->convertToString($data['All']['الحالة'] ?? null),
                'internal_link' => $this->convertToString($data['Entry']['InternalLink']),
            ]);

            // Create Host
            if (isset($data['All']['أولابياناتالمضيف'])) {
                $hostData = $data['All']['أولابياناتالمضيف'];
                $fullName = $this->convertToString($hostData['الاسمالكاملللمضيف']['FirstAndLast'] ?? null);

                if (!empty($fullName)) {
                    Host::create([
                        'entry_id' => $entry->id,
                        'full_name' => $fullName,
                        'family_count' => $this->convertToString($hostData['عددأفرادعائلةالمضيفمعأعمارهم'] ?? null),
                        'location' => $this->convertToString($hostData['مكانالتواجد'] ?? null),
                        'address' => $this->convertToString($hostData['العنوان'] ?? null),
                        'phone' => $this->convertToString($hostData['رقمالهاتف2'] ?? null),
                        'family_book_number' => $this->convertToString($hostData['رقمدفترالعائلةإنوجد'] ?? null),
                        'children_under_8_months' => $this->convertToString($hostData['هليوجداطفالتحتعمرال8اشهر'] ?? null),
                        'birth_details' => $this->convertToString($hostData['اذاكانالجوابنعميرجىذكرتاريخالولادةمعاسمالام'] ?? null),
                    ]);
                }
            }

            // Create Displaced Families
            if (isset($data['All']['ثانياالعائلةالمستضافة']) && is_array($data['All']['ثانياالعائلةالمستضافة'])) {
                foreach ($data['All']['ثانياالعائلةالمستضافة'] as $familyData) {
                    $contact = $this->convertToString($familyData['اسمربالعائلةرقمالتواصل'] ?? null);
                    $individualsCount = $this->convertToString($familyData['عددالأفراد'] ?? null);

                    if (!empty($contact) || !empty($individualsCount)) {
                        $this->createDisplacedFamily($familyData, $entry->id, null);
                    }
                }
            }

            // Create Martyrs
            if (isset($data['All']['أسماءالشهداء']) && is_array($data['All']['أسماءالشهداء'])) {
                foreach ($data['All']['أسماءالشهداء'] as $martyrData) {
                    $name = $this->convertToString($martyrData['اسمالشهيد']['FirstAndLast'] ?? null);

                    if (!empty($name) && trim($name) !== '') {
                        Martyr::create([
                            'entry_id' => $entry->id,
                            'name' => $name,
                            'age' => $this->convertToString($martyrData['العمر'] ?? null),
                            'place' => $this->convertToString($martyrData['مكانالاستشهاد'] ?? null),
                            'relative_contact' => $this->convertToString($martyrData['اسماحدالاقاربمعرقمللتواصل'] ?? null),
                            'image' => $this->extractImages($martyrData['صورةللشهيدانوجد'] ?? []),
                        ]);
                    }
                }
            }

            // Create Shelters
            if (isset($data['All']['مكانالإيواء']) && is_array($data['All']['مكانالإيواء'])) {
                foreach ($data['All']['مكانالإيواء'] as $shelterData) {
                    $place = $this->convertToString($shelterData['مكانالإيواءاوالاجار'] ?? null);
                    $contact = $this->convertToString($shelterData['رقمالتواصل'] ?? null);

                    if (!empty($place) || !empty($contact)) {
                        $shelter = Shelter::create([
                            'entry_id' => $entry->id,
                            'place' => $place,
                            'contact' => $contact,
                            'images' => $this->extractImages($shelterData['صورةاوفيديوللمنزلالمتضررانوجد2'] ?? []),
                        ]);

                        // Create families in shelter
                        if (isset($shelterData['العائلةالنازحة']) && is_array($shelterData['العائلةالنازحة'])) {
                            foreach ($shelterData['العائلةالنازحة'] as $familyData) {
                                $familyContact = $this->convertToString($familyData['اسمربالعائلةرقمالتواصل'] ?? null);
                                $individualsCount = $this->convertToString($familyData['عددالأفراد'] ?? null);

                                if (!empty($familyContact) || !empty($individualsCount)) {
                                    $this->createDisplacedFamily($familyData, null, $shelter->id);
                                }
                            }
                        }
                    }
                }
            }

            DB::commit();
            return response()->json(['success' => true, 'entry_id' => $entry->id], 200);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Webhook processing failed', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'entry_number' => $data['Entry']['Number'] ?? 'unknown',
            ]);

            return response()->json([
                'error' => 'Failed to process webhook',
                'message' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}
