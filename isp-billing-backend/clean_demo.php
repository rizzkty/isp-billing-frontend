<?php
$dir = __DIR__ . '/app/Http/Controllers/Api';
$files = glob($dir . '/*.php');

foreach ($files as $file) {
    $content = file_get_contents($file);
    $original = $content;

    // Remove `use App\Traits\DemoMockTrait;`
    $content = preg_replace('/use App\\\\Traits\\\\DemoMockTrait;\\r?\\n/', '', $content);
    
    // Remove `use DemoMockTrait;`
    $content = preg_replace('/[ \t]*use DemoMockTrait;\\r?\\n/', '', $content);
    
    // Remove `if ($this->isDemoUser()) { ... }` blocks
    // This regex matches `if ($this->isDemoUser()) {` up to the next `}` that is indented the same as the `if` or just non-greedy
    // Since we know they usually look like:
    // if ($this->isDemoUser()) {
    //     return response()->json(...);
    // }
    // We can use a non-greedy dotall match.
    $content = preg_replace('/[ \t]*if \(\$this->isDemoUser\(\)\) \{.*?\n[ \t]*\}\\r?\\n/s', '', $content);
    
    if ($content !== $original) {
        file_put_contents($file, $content);
        echo "Cleaned $file\n";
    }
}
echo "Done.\n";
