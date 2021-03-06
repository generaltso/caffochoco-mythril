<?php
/**
 * usage: php -f find_missing_files.php
 *
 * Tells you which files are missing from disk based
 * on where data.json says they should be.
 *
 * Returns nothing if everything is fine
 */
$d  = json_decode(file_get_contents('data.json'));
$tracklists = [];
foreach($d->tracklists as $tl) {
    $tracklists[$tl->id] = $tl;
}
$tracks = [];
foreach($d->tracks as $t) {
    $tracks[$t->id] = $t;
}
foreach($d->releases as $r) {
    if(!file_exists('audio/'.$r->url)) {
        echo 'missing directory ', $r->url, "\n";
    } else {
        foreach($r->tracklists as $tl) {
            foreach($tracklists[$tl]->tracks as $t) {
                if(!file_exists('audio/'.$r->url.'/'.$tracks[$t]->file)) {
                    echo 'missing file audio/'.$r->url.'/'.$tracks[$t]->file, "\n";
                }
            }
        }
    }
}
