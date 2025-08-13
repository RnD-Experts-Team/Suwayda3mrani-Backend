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
            if (isset($item['تحميل'])) {
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
        if (empty($needsData)) {
            return [];
        }

        // Convert to string first if it's an array
        $needsString = $this->convertToString($needsData);
        if (empty($needsString)) {
            return [];
        }

        // Split comma-separated needs
        $needsArray = array_map('trim', explode(',', $needsString));
        $needsArray = array_filter($needsArray); // Remove empty values

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
        foreach ($needsArray as $need) {
            if (isset($needsMapping[$need])) {
                $needIds[] = $needsMapping[$need];
            }
        }

        return array_unique($needIds);
    }

    /**
     * Create displaced family record with common fields
     */
    private function createDisplacedFamily(array $data, ?int $entryId = null, ?int $shelterId = null)
    {
        // Validation to ensure we have proper linking
        if (is_null($entryId) && is_null($shelterId)) {
            Log::warning('DisplacedFamily created without entry_id or shelter_id', [
                'data' => $data,
                'entryId' => $entryId,
                'shelterId' => $shelterId
            ]);
        }

        $needsDetails = $data['الاحتياجاتالحالية'] ?? $data['الاحتياجاتالحاليةللعائلاتالمستضافة'] ?? [];

        // Get needs data for processing
        $needsData = $needsDetails['يرجىاختيارالاحتياجات'] ?? null;
        $needIds = $this->processNeeds($needsData);

        // Debug logging
        Log::info('Creating displaced family', [
            'entryId' => $entryId,
            'shelterId' => $shelterId,
            'needIds' => $needIds,
            'contact' => $this->convertToString($data['اسمربالعائلةرقمالتواصل'] ?? null),
        ]);

        $displacedFamily = DisplacedFamily::create([
            'entry_id' => $entryId,
            'shelter_id' => $shelterId,
            'individuals_count' => $this->convertToString($data['عددالأفراد'] ?? null),
            'contact' => $this->convertToString($data['اسمربالعائلةرقمالتواصل'] ?? null),
            'wife_name' => $this->convertToString($data['اسمالزوجة'] ?? null),
            'children_info' => $this->convertToString($data['أسماءوأعمارالأطفال'] ?? null),
            'assistance_type' => $this->convertToString($needsDetails['نوعالمساعدة'] ?? null),
            'provider' => $this->convertToString($needsDetails['الجهةالمقدمةللمساعدة'] ?? null),
            'date_received' => $this->convertToString($needsDetails['تاريخالحصولعليها'] ?? null),
            'notes' => $this->convertToString($needsDetails['ملاحظاتإضافية'] ?? null),
            'return_possible' => $this->convertToString($needsDetails['إمكانيةالعودةللمنزل2'] ?? null),
            'previous_assistance' => $this->convertToString($needsDetails['هلتمتلقيمساعداتسابقة2'] ?? null),
            'images' => $this->extractImages($needsDetails['صوراوفيديوهاتللتوثيق2'] ?? []),
            'family_book_number' => $this->convertToString($data['رقمدفترالعائلةإنوجد'] ?? null),
            'children_under_8_months' => $this->convertToString($data['هليوجداطفالتحتعمرال8اشهر'] ?? null),
            'birth_details' => $this->convertToString($data['اذاكانالجوابنعميرجىذكرتاريخالولادةمعاسمالام'] ?? null),
        ]);

        // Log after creation
        Log::info('Displaced family created', [
            'id' => $displacedFamily->id,
            'entry_id' => $displacedFamily->entry_id,
            'shelter_id' => $displacedFamily->shelter_id,
        ]);

        // Attach needs to the displaced family using the pivot table
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

            Log::info('Attached needs to displaced family', [
                'family_id' => $displacedFamily->id,
                'needs' => $needIds,
            ]);
        }

        return $displacedFamily;
    }

    public function handle(Request $request)
    {
        $data = $request->all();

        // Log incoming webhook data
        Log::info('Webhook received', [
            'form_id' => $data['Form']['Id'] ?? 'missing',
            'entry_number' => $data['Entry']['Number'] ?? 'missing',
        ]);

        // Validate required fields for Entry
        if (!isset($data['Form']['Id'], $data['Entry']['Number'], $data['All'], $data['Entry']['InternalLink']) ||
            empty($data['Form']['Id']) || empty($data['Entry']['Number']) || empty($data['Entry']['InternalLink'])) {
            Log::error('Invalid webhook data', ['data' => $data]);
            return response()->json(['error' => 'Invalid data'], 400);
        }

        // Prevent duplicate entries
        if (Entry::where('entry_number', $data['Entry']['Number'])->exists()) {
            Log::warning('Duplicate entry attempt', ['entry_number' => $data['Entry']['Number']]);
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
                'InternalLink' => $this->convertToString($data['Entry']['InternalLink']),
            ]);

            Log::info('Entry created', ['entry_id' => $entry->id, 'entry_number' => $entry->entry_number]);

            // Create Host if primary fields are present
            if (isset($data['All']['أولابياناتالمضيف'])) {
                $hostData = $data['All']['أولابياناتالمضيف'];
                $fullName = $this->convertToString($hostData['الاسمالكاملللمضيف']['FirstAndLast'] ?? null);

                if (!empty($fullName)) {
                    $host = Host::create([
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

                    Log::info('Host created', ['host_id' => $host->id, 'entry_id' => $entry->id]);
                }
            }

            // Create Displaced Families directly associated with entry
            if (isset($data['All']['ثانياالعائلةالمستضافة']) && is_array($data['All']['ثانياالعائلةالمستضافة'])) {
                foreach ($data['All']['ثانياالعائلةالمستضافة'] as $index => $familyData) {
                    $contact = $this->convertToString($familyData['اسمربالعائلةرقمالتواصل'] ?? null);
                    $individualsCount = $this->convertToString($familyData['عددالأفراد'] ?? null);

                    if (!empty($contact) || !empty($individualsCount)) {
                        Log::info('Creating displaced family for entry', [
                            'entry_id' => $entry->id,
                            'family_index' => $index,
                            'contact' => $contact,
                        ]);

                        $this->createDisplacedFamily($familyData, $entry->id, null);
                    }
                }
            }

            // Create Martyrs if primary fields are present
            if (isset($data['All']['أسماءالشهداء']) && is_array($data['All']['أسماءالشهداء'])) {
                foreach ($data['All']['أسماءالشهداء'] as $martyr) {
                    $name = $this->convertToString($martyr['اسمالشهيد']['FirstAndLast'] ?? null);

                    if (!empty($name)) {
                        $martyrRecord = Martyr::create([
                            'entry_id' => $entry->id,
                            'name' => $name,
                            'age' => $this->convertToString($martyr['العمر'] ?? null),
                            'place' => $this->convertToString($martyr['مكانالاستشهاد'] ?? null),
                            'relative_contact' => $this->convertToString($martyr['اسماحدالاقاربمعرقمللتواصل'] ?? null),
                            'image' => $this->extractImages($martyr['صورةللشهيدانوجد'] ?? []),
                        ]);

                        Log::info('Martyr created', ['martyr_id' => $martyrRecord->id, 'entry_id' => $entry->id]);
                    }
                }
            }

            // Create Shelters and their Displaced Families
            if (isset($data['All']['مكانالإيواء']) && is_array($data['All']['مكانالإيواء'])) {
                foreach ($data['All']['مكانالإيواء'] as $shelterIndex => $shelterData) {
                    $place = $this->convertToString($shelterData['مكانالإيواءاوالاجار'] ?? null);

                    if (!empty($place)) {
                        $shelter = Shelter::create([
                            'entry_id' => $entry->id,
                            'place' => $place,
                            'contact' => $this->convertToString($shelterData['رقمالتواصل'] ?? null),
                            'images' => $this->extractImages($shelterData['صورةاوفيديوللمنزلالمتضررانوجد2'] ?? []),
                        ]);

                        Log::info('Shelter created', ['shelter_id' => $shelter->id, 'entry_id' => $entry->id]);

                        // Create Displaced Families associated with shelter
                        if (isset($shelterData['العائلةالنازحة']) && is_array($shelterData['العائلةالنازحة'])) {
                            foreach ($shelterData['العائلةالنازحة'] as $familyIndex => $familyData) {
                                $contact = $this->convertToString($familyData['اسمربالعائلةرقمالتواصل'] ?? null);
                                $individualsCount = $this->convertToString($familyData['عددالأفراد'] ?? null);

                                if (!empty($contact) || !empty($individualsCount)) {
                                    Log::info('Creating displaced family for shelter', [
                                        'shelter_id' => $shelter->id,
                                        'entry_id' => $entry->id,
                                        'family_index' => $familyIndex,
                                        'contact' => $contact,
                                    ]);

                                    $this->createDisplacedFamily($familyData, null, $shelter->id);
                                }
                            }
                        }
                    }
                }
            }

            DB::commit();

            Log::info('Webhook processed successfully', [
                'entry_id' => $entry->id,
                'entry_number' => $entry->entry_number,
            ]);

            return response()->json(['success' => true, 'entry_id' => $entry->id], 200);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Webhook processing failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'entry_number' => $data['Entry']['Number'] ?? 'unknown',
            ]);

            return response()->json([
                'error' => 'Failed to process webhook',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
